// Aakash SMS — Nepal SMS gateway. Docs: https://sms.aakashsms.com/api
// POST application/x-www-form-urlencoded: auth_token, to, text

export async function sendAakashSms(opts: { to: string; text: string }) {
  const token = process.env.AAKASH_SMS_TOKEN;
  if (!token) throw new Error("AAKASH_SMS_TOKEN is not configured");

  // Aakash expects local 10-digit Nepali numbers (no +977). Strip if present.
  let to = opts.to.replace(/\s+/g, "");
  if (to.startsWith("+977")) to = to.slice(4);
  if (to.startsWith("977") && to.length > 10) to = to.slice(3);
  if (!/^\d{10}$/.test(to)) {
    throw new Error("Phone must be a 10-digit Nepali number (optionally prefixed with +977).");
  }

  const body = new URLSearchParams({ auth_token: token, to, text: opts.text });

  const res = await fetch("https://sms.aakashsms.com/sms/v3/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await res.text();
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* keep raw */
  }
  if (!res.ok) {
    console.error("[aakash-sms] failed", res.status, parsed);
    throw new Error(
      `SMS provider error (${res.status}). ${typeof parsed === "object" ? JSON.stringify(parsed) : raw}`,
    );
  }
  return parsed;
}
