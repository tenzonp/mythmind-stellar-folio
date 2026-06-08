import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-foreground text-background relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 -right-20 size-[480px] rounded-full blob" style={{ background: "var(--ember)" }} />
      <div aria-hidden className="absolute bottom-0 -left-32 size-[420px] rounded-full blob" style={{ background: "var(--leaf)", animationDelay: "-6s" }} />

      <div className="relative mx-auto max-w-[1500px] px-5 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-2/5">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <span className="font-display font-bold text-4xl">mythmind<span className="text-[var(--ember)]">.</span></span>
            </div>
            <p className="mt-8 text-2xl font-display leading-tight max-w-md">
              Building minds that <span className="italic text-[var(--sun)]">remember</span> the stories we tell.
            </p>
            <Link to="/contact" className="mt-8 inline-flex chunk-btn-ghost !border-background !text-background !shadow-[4px_4px_0_var(--paper)]">
              hello@mythmind.ai →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-16 flex-1">
            <FooterCol title="Lab" links={[["About", "/about"], ["Vision", "/vision"], ["Journey", "/journey"]]} />
            <FooterCol title="People" links={[["Teams", "/teams"], ["Investors", "/investors"], ["Careers", "/teams"]]} />
            <FooterCol title="Read" links={[["News", "/news"], ["Journal", "/blogs"], ["Contact", "/contact"]]} />
          </div>
        </div>

        <div className="mt-20 pt-6 border-t border-background/15 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs font-mono text-background/60">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} MythMind Labs, Inc.</span>
            <span className="size-1 rounded-full bg-[var(--sun)]" />
            <span>Made on Earth</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="size-2.5 rounded-full bg-[var(--sun)]" />
            <span className="size-2.5 rounded-full bg-[var(--leaf)]" />
            <span className="size-2.5 rounded-full bg-[var(--ember)]" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="eyebrow text-background/50 mb-4">{title}</div>
      <ul className="space-y-3 text-lg font-medium">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-background/85 hover:text-[var(--sun)] transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
