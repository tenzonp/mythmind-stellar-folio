import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes, randomInt } from "crypto";

// Normalize any input to a canonical +977XXXXXXXXXX form.
function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+977")) p = p.slice(4);
  else if (p.startsWith("977") && p.length > 10) p = p.slice(3);
  if (!/^\d{10}$/.test(p)) throw new Error("Enter a valid 10-digit Nepali mobile number.");
  return `+977${p}`;
}

function hashCode(code: string, phone: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

// We sign the user in via Supabase email/password under the hood. Each phone
// maps to a synthetic local email so we never expose the address to the user.
function syntheticEmail(phoneE164: string) {
  const digits = phoneE164.replace(/\D/g, "");
  return `phone_${digits}@phone.mythmind.local`;
}

const phoneSchema = z.object({ phone: z.string().min(7).max(20) });
const verifySchema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  name: z.string().trim().min(1).max(80).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscore only")
    .optional(),
  purpose: z.enum(["login", "reset"]).default("login"),
});

export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => phoneSchema.parse(data))
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const code_hash = hashCode(code, phone);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Throttle: max 1 unexpired OTP per 30s.
    const { data: recent } = await supabaseAdmin
      .from("phone_otps")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent && recent[0]) {
      const elapsed = Date.now() - new Date(recent[0].created_at).getTime();
      if (elapsed < 30_000) {
        throw new Error(`Wait ${Math.ceil((30_000 - elapsed) / 1000)}s before requesting again.`);
      }
    }

    const { error: insertErr } = await supabaseAdmin
      .from("phone_otps")
      .insert({ phone, code_hash, expires_at, purpose: "login" });
    if (insertErr) throw new Error(insertErr.message);

    const { sendAakashSms } = await import("./aakash-sms.server");
    await sendAakashSms({
      to: phone,
      text: `Your Mythmind verification code is ${code}. It expires in 10 minutes.`,
    });

    return { ok: true, phone };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const code_hash = hashCode(data.code, phone);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: otp, error: fetchErr } = await supabaseAdmin
      .from("phone_otps")
      .select("id, code_hash, expires_at, consumed_at, attempts")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!otp) throw new Error("No code requested for this number.");
    if (otp.consumed_at) throw new Error("This code was already used. Request a new one.");
    if (new Date(otp.expires_at).getTime() < Date.now())
      throw new Error("Code expired. Request a new one.");
    if (otp.attempts >= 5) throw new Error("Too many attempts. Request a new code.");

    if (otp.code_hash !== code_hash) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: otp.attempts + 1 })
        .eq("id", otp.id);
      throw new Error("Incorrect code.");
    }

    // Code valid — consume it.
    await supabaseAdmin
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otp.id);

    const email = syntheticEmail(phone);

    // Find existing auth user by email lookup against our profiles row.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("phone", phone)
      .maybeSingle();

    // If the user is signing up, validate uniqueness of username up front.
    if (data.username) {
      const { data: clash } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", data.username)
        .neq("id", existingProfile?.id ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      if (clash) throw new Error("That username is taken. Try another.");
    }

    // Generate a one-time password we'll hand back to the client so it can
    // call signInWithPassword. Rotated on every verification.
    const oneTimePassword = randomBytes(24).toString("base64url");

    let userId = existingProfile?.id;

    if (!userId) {
      // First time — create the auth user.
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: oneTimePassword,
        email_confirm: true,
        user_metadata: {
          full_name: data.name ?? null,
          phone,
        },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message ?? "Could not create account.");
      }
      userId = created.user.id;

      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          phone,
          phone_verified_at: new Date().toISOString(),
          display_name: data.name ?? null,
          username: data.username ?? null,
        },
        { onConflict: "id" },
      );
    } else {
      // Existing user — rotate password to the one-time value.
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: oneTimePassword,
      });
      if (updErr) throw new Error(updErr.message);

      const patch: Record<string, unknown> = {
        phone_verified_at: new Date().toISOString(),
      };
      if (data.name) patch.display_name = data.name;
      if (data.username) patch.username = data.username;
      await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
    }

    return { email, password: oneTimePassword };
  });

export const checkUsernameAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .min(3)
          .max(24)
          .regex(/^[a-zA-Z0-9_]+$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    return { available: !clash };
  });
