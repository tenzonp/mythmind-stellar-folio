/**
 * E2B sandbox tools for the Mythmind chat.
 *
 * Gives every agent an ephemeral Python sandbox so it can:
 *  - run/test arbitrary code (data analysis, calculations, charts)
 *  - generate PDF files (reportlab)
 *  - generate PPTX decks (python-pptx)
 *  - open and analyze user-uploaded files (CSV, PDF, XLSX, etc.)
 *
 * Generated artifacts are uploaded to the `chat-attachments` bucket and
 * a signed URL is returned so the model can hand the file to the user.
 */
import { tool } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

type Ctx = {
  userId: string;
  threadId: string;
};

const WORKDIR = "/home/user/work";

async function newSandbox() {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) throw new Error("E2B_API_KEY is not configured");
  const sbx = await Sandbox.create({ apiKey, timeoutMs: 120_000 });
  await sbx.commands.run(`mkdir -p ${WORKDIR}`);
  return sbx;
}

async function uploadArtifact(opts: {
  ctx: Ctx;
  filename: string;
  bytes: Uint8Array;
  contentType: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const path = `${opts.ctx.userId}/${opts.ctx.threadId}/${crypto.randomUUID()}-${opts.filename}`;
  const { error: upErr } = await supabaseAdmin.storage
    .from("chat-attachments")
    .upload(path, opts.bytes, { contentType: opts.contentType, upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("chat-attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 30);
  if (signErr || !signed) throw new Error(signErr?.message ?? "sign failed");
  await supabaseAdmin.from("chat_attachments").insert({
    user_id: opts.ctx.userId,
    thread_id: opts.ctx.threadId,
    file_name: opts.filename,
    file_type: opts.contentType,
    file_size: opts.bytes.byteLength,
    storage_path: path,
    public_url: signed.signedUrl,
  });
  return { url: signed.signedUrl, filename: opts.filename };
}

function contentTypeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    json: "application/json",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Collect every file under WORKDIR, upload it, return descriptors.
 */
async function harvestArtifacts(sbx: Sandbox, ctx: Ctx) {
  const out: Array<{ url: string; filename: string }> = [];
  const ls = await sbx.commands.run(
    `find ${WORKDIR} -type f -size -25000000c 2>/dev/null | head -20`,
  );
  const paths = ls.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of paths) {
    try {
      const buf = await sbx.files.read(p, { format: "bytes" });
      const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBuffer);
      const filename = p.split("/").pop() ?? "file";
      const uploaded = await uploadArtifact({
        ctx,
        filename,
        bytes,
        contentType: contentTypeFor(filename),
      });
      out.push(uploaded);
    } catch (e) {
      console.error("[sandbox harvest]", p, e);
    }
  }
  return out;
}

export function buildSandboxTools(ctx: Ctx) {
  return {
    run_code: tool({
      description:
        "Run Python code inside a secure sandbox (Mythmind compute). Use this for: data analysis, math, scraping/transforming data, charts, file conversion, image processing, testing code, or any task where you need to actually execute code. Pre-installed: pandas, numpy, matplotlib, requests, pypdf, openpyxl, python-pptx, reportlab, beautifulsoup4. Save any output files (charts, CSVs, etc.) into /home/user/work/ and they will be uploaded and returned as downloadable URLs. After the tool returns, include each artifact in your reply as a markdown link `[filename](url)` so the user can download it.",
      inputSchema: z.object({
        code: z
          .string()
          .min(1)
          .max(20000)
          .describe("Python code to execute. Save artifacts to /home/user/work/."),
        input_file_urls: z
          .array(z.string().url())
          .optional()
          .describe(
            "Optional list of URLs to download into /home/user/work/ before running (e.g. user-uploaded CSV/PDF/XLSX). Filenames are derived from the URL path.",
          ),
      }),
      execute: async ({ code, input_file_urls }) => {
        let sbx: Sandbox | null = null;
        try {
          sbx = await newSandbox();

          // Pre-download any inputs
          if (input_file_urls?.length) {
            for (const u of input_file_urls) {
              try {
                const r = await fetch(u);
                if (!r.ok) continue;
                const buf = new Uint8Array(await r.arrayBuffer());
                const name = decodeURIComponent(
                  new URL(u).pathname.split("/").pop() || `input-${Date.now()}`,
                ).replace(/[^a-zA-Z0-9._-]/g, "_");
                await sbx.files.write(`${WORKDIR}/${name}`, buf.buffer as ArrayBuffer);
              } catch (e) {
                console.error("[sandbox prefetch]", u, e);
              }
            }
          }

          const exec = await sbx.runCode(`import os\nos.chdir(${JSON.stringify(WORKDIR)})\n${code}`);
          const artifacts = await harvestArtifacts(sbx, ctx);

          return {
            ok: !exec.error,
            stdout: exec.logs.stdout.join(""),
            stderr: exec.logs.stderr.join(""),
            error: exec.error
              ? `${exec.error.name}: ${exec.error.value}`
              : undefined,
            results: exec.results.slice(0, 5).map((r) => ({
              text: r.text,
              has_image: Boolean(r.png || r.jpeg || r.svg),
            })),
            artifacts,
            artifacts_markdown: artifacts
              .map((a) => `[${a.filename}](${a.url})`)
              .join("\n"),
          };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        } finally {
          if (sbx) await sbx.kill().catch(() => {});
        }
      },
    }),

    make_pdf: tool({
      description:
        "Generate a PDF file. Use this whenever the user asks for a PDF document, report, invoice, certificate, resume, summary doc, etc. Provide a title and the body content as markdown-ish text (paragraphs separated by blank lines, '# heading' for headings, '- item' for bullets). Returns a downloadable URL — include it in your reply as a markdown link.",
      inputSchema: z.object({
        filename: z
          .string()
          .min(1)
          .max(80)
          .describe("Output filename, e.g. 'report.pdf'. Must end with .pdf"),
        title: z.string().min(1).max(200),
        body: z
          .string()
          .min(1)
          .max(40000)
          .describe(
            "Body content. Use '# H1', '## H2', blank lines for paragraph breaks, '- bullet' for lists.",
          ),
      }),
      execute: async ({ filename, title, body }) => {
        const fname = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
        let sbx: Sandbox | null = null;
        try {
          sbx = await newSandbox();
          const py = `
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import inch
import json, sys

title = json.loads(${JSON.stringify(JSON.stringify(title))})
body  = json.loads(${JSON.stringify(JSON.stringify(body))})
fname = json.loads(${JSON.stringify(JSON.stringify(fname))})

styles = getSampleStyleSheet()
doc = SimpleDocTemplate("/home/user/work/" + fname, pagesize=letter,
                        leftMargin=0.75*inch, rightMargin=0.75*inch,
                        topMargin=0.8*inch, bottomMargin=0.8*inch)
flow = [Paragraph(title, styles["Title"]), Spacer(1, 14)]

bullets = []
def flush_bullets():
    global bullets
    if bullets:
        flow.append(ListFlowable([ListItem(Paragraph(b, styles["BodyText"])) for b in bullets], bulletType="bullet"))
        flow.append(Spacer(1, 8))
        bullets = []

for raw in body.split("\\n"):
    line = raw.rstrip()
    if line.startswith("# "):
        flush_bullets(); flow.append(Spacer(1,6)); flow.append(Paragraph(line[2:], styles["Heading1"]))
    elif line.startswith("## "):
        flush_bullets(); flow.append(Paragraph(line[3:], styles["Heading2"]))
    elif line.startswith("### "):
        flush_bullets(); flow.append(Paragraph(line[4:], styles["Heading3"]))
    elif line.startswith("- ") or line.startswith("* "):
        bullets.append(line[2:])
    elif line.strip() == "":
        flush_bullets(); flow.append(Spacer(1, 6))
    else:
        flush_bullets(); flow.append(Paragraph(line, styles["BodyText"]))
flush_bullets()

doc.build(flow)
print("OK", fname)
`.trim();
          const exec = await sbx.runCode(py);
          if (exec.error) {
            return { ok: false, error: `${exec.error.name}: ${exec.error.value}` };
          }
          const artifacts = await harvestArtifacts(sbx, ctx);
          const pdf = artifacts.find((a) => a.filename === fname) ?? artifacts[0];
          return pdf
            ? { ok: true, url: pdf.url, filename: pdf.filename, markdown: `[${pdf.filename}](${pdf.url})` }
            : { ok: false, error: "No PDF produced" };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        } finally {
          if (sbx) await sbx.kill().catch(() => {});
        }
      },
    }),

    make_pptx: tool({
      description:
        "Generate a PowerPoint (.pptx) deck. Use whenever the user asks for slides, a presentation, a pitch deck, etc. Provide an array of slides, each with a title and bullet points. Returns a downloadable URL — include it in your reply as a markdown link.",
      inputSchema: z.object({
        filename: z
          .string()
          .min(1)
          .max(80)
          .describe("Output filename, e.g. 'deck.pptx'. Must end with .pptx"),
        slides: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              bullets: z.array(z.string().min(1).max(400)).max(8).default([]),
              notes: z.string().max(1000).optional(),
            }),
          )
          .min(1)
          .max(30),
      }),
      execute: async ({ filename, slides }) => {
        const fname = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
        let sbx: Sandbox | null = null;
        try {
          sbx = await newSandbox();
          const py = `
import json
from pptx import Presentation
from pptx.util import Inches, Pt

slides = json.loads(${JSON.stringify(JSON.stringify(slides))})
fname  = json.loads(${JSON.stringify(JSON.stringify(fname))})

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

for i, s in enumerate(slides):
    layout = prs.slide_layouts[0 if i == 0 else 1]
    slide = prs.slides.add_slide(layout)
    slide.shapes.title.text = s["title"]
    bullets = s.get("bullets") or []
    if len(slide.placeholders) > 1 and bullets:
        body = slide.placeholders[1].text_frame
        body.text = bullets[0]
        for b in bullets[1:]:
            p = body.add_paragraph()
            p.text = b
            p.level = 0
    if s.get("notes"):
        slide.notes_slide.notes_text_frame.text = s["notes"]

prs.save("/home/user/work/" + fname)
print("OK", fname)
`.trim();
          // Make sure python-pptx is present (sandbox usually has it; install just in case)
          await sbx.commands.run("pip install -q python-pptx >/dev/null 2>&1 || true");
          const exec = await sbx.runCode(py);
          if (exec.error) {
            return { ok: false, error: `${exec.error.name}: ${exec.error.value}` };
          }
          const artifacts = await harvestArtifacts(sbx, ctx);
          const ppt = artifacts.find((a) => a.filename === fname) ?? artifacts[0];
          return ppt
            ? { ok: true, url: ppt.url, filename: ppt.filename, markdown: `[${ppt.filename}](${ppt.url})` }
            : { ok: false, error: "No PPTX produced" };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        } finally {
          if (sbx) await sbx.kill().catch(() => {});
        }
      },
    }),
  };
}
