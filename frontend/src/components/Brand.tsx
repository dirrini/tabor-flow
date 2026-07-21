import { Link } from "react-router-dom";

export function BrandMark() {
  return <img src="/brand/tabor-flow-mark.svg" alt="" className="h-10 w-10 shrink-0" aria-hidden="true" />;
}

export function Brand({ inverse = false, to = "/", compact = false }: { inverse?: boolean; to?: string; compact?: boolean }) {
  const src = compact ? "/brand/tabor-flow-mark.svg" : inverse ? "/brand/tabor-flow-logo-inverse.svg" : "/brand/tabor-flow-logo.svg";
  return <Link to={to} className="inline-flex items-center" aria-label="TaborFlow">
    <img src={src} alt="TaborFlow" className={compact ? "h-10 w-10" : "h-10 w-[200px]"} />
  </Link>;
}
