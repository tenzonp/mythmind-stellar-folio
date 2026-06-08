import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const nav = [
  { to: "/about", label: "About" },
  { to: "/vision", label: "Vision" },
  { to: "/journey", label: "Journey" },
  { to: "/teams", label: "Teams" },
  { to: "/investors", label: "Independent" },
  { to: "/news", label: "News" },
  { to: "/blogs", label: "Journal" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-[1500px] px-3 lg:px-6">
        <div
          className={`flex items-center justify-between gap-3 rounded-full border-2 border-foreground bg-background/90 backdrop-blur-xl pl-3 pr-2 transition-all duration-300 ${
            scrolled ? "h-13 shadow-[3px_3px_0_var(--ink)]" : "h-15 shadow-[5px_5px_0_var(--ink)]"
          }`}
          style={{ height: scrolled ? 52 : 60 }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 pl-1">
            <span className="relative inline-flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[var(--sun)] scale-0 group-hover:scale-110 transition-transform duration-300" />
              <Logo className="relative h-7 w-7 transition-transform group-hover:rotate-[20deg] duration-300" />
            </span>
            <span className="font-display font-bold text-[1.05rem] tracking-tight leading-none">
              mythmind<span className="text-[var(--ember)]">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-0.5 text-[0.82rem] font-medium">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`relative px-3 py-1.5 rounded-full transition-all ${
                    active
                      ? "text-background bg-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[var(--sun)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA + mobile trigger */}
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-[0.82rem] font-semibold hover:bg-[var(--ember)] hover:text-foreground transition-colors"
            >
              <span className="size-1.5 rounded-full bg-[var(--sun)] animate-pulse" />
              Open app
            </Link>
            <button
              onClick={() => setOpen((s) => !s)}
              className="xl:hidden inline-flex items-center justify-center size-10 rounded-full border border-foreground/15 hover:bg-foreground/5"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <div className="relative size-4">
                <span
                  className={`absolute left-0 right-0 top-1 h-[1.5px] bg-foreground transition-transform ${
                    open ? "translate-y-[5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 right-0 bottom-1 h-[1.5px] bg-foreground transition-transform ${
                    open ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="xl:hidden mx-auto max-w-[1500px] px-3 lg:px-6 mt-2">
          <div className="rounded-3xl border-2 border-foreground bg-background p-3 shadow-[5px_5px_0_var(--ink)]">
            <nav className="grid grid-cols-2 gap-1.5">
              {nav.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                      active ? "bg-foreground text-background" : "bg-foreground/[0.04]"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              to="/app"
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[var(--sun)] py-3 text-sm font-semibold"
            >
              Open app →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
