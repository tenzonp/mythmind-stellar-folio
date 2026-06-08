import logo from "@/assets/mythmind-logo.png.asset.json";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return <img src={logo.url} alt="MythMind logo" className={className} />;
}
