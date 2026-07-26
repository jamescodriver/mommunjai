import Image from "next/image";

// Official Baby & Mom logo (horizontal lockup: symbol + "baby&mom+" wordmark).
// Source file: public/logo.png (colour, black wordmark) / public/logo-white.png (all-white,
// for use on the teal brand background). Do not recolour or distort — see docs/BRAND.md §1.7.
export function Wordmark({
  className = "",
  height = 28,
  white = false,
}: {
  className?: string;
  /** rendered height in px; width scales automatically (logo ratio ≈ 3.2:1) */
  height?: number;
  /** use the all-white version (for teal/dark backgrounds) */
  white?: boolean;
}) {
  const width = Math.round(height * 3.2);
  return (
    <Image
      src={white ? "/logo-white.png" : "/logo.png"}
      alt="baby&mom+"
      width={width}
      height={height}
      priority
      className={`inline-block h-auto w-auto ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
