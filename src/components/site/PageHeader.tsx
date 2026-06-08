import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  lede,
  accent = "sun",
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  accent?: "sun" | "leaf" | "ember";
}) {
  const accentVar = `var(--${accent})`;
  return (
    <section className="relative pt-16 lg:pt-24 pb-20 overflow-hidden border-b-2 border-foreground">
      <div aria-hidden className="absolute -top-20 right-0 size-[420px] rounded-full blob" style={{ background: accentVar }} />
      <div className="relative mx-auto max-w-[1500px] px-5 lg:px-8">
        <div className="sticker bg-background" style={{ background: accentVar }}>{eyebrow}</div>
        <h1 className="display-lg mt-8 max-w-[20ch]">{title}</h1>
        {lede && (
          <p className="mt-8 max-w-2xl text-xl leading-snug text-foreground/75">{lede}</p>
        )}
      </div>
    </section>
  );
}
