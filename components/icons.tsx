// PDF-04 — minimal line-icon set (interim stand-in for the brand's own icon
// set, which docs/DESIGN.md §9.6 lists as "ต้องขอเพิ่ม" / not yet supplied).
// Swap these for brand-supplied icons once available — keep the same props
// shape (className, size) so call sites don't need to change again.
import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(props: IconProps) {
  const { size = 24, ...rest } = props;
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...rest };
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <circle cx="8.2" cy="13.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="13.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEgg(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5C8 8 5.5 13 5.5 16.2A6.5 6.5 0 0012 22.7a6.5 6.5 0 006.5-6.5c0-3.2-2.5-8.2-6.5-12.7z" />
    </svg>
  );
}

export function IconSalad(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 12.5a8.5 5.5 0 1017 0" />
      <path d="M2.5 12.5h19" />
      <path d="M12 12.5c0-3.5 1.5-6 3.5-7.5" />
      <path d="M12 12.5c0-3-1-5-3-6.5" />
      <path d="M9 3.2c1 .3 1.8 1.2 2 2.3" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.5 14.5A8.5 8.5 0 119.5 3.5 6.8 6.8 0 0020.5 14.5z" />
    </svg>
  );
}

export function IconDroplet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3s6.5 7.3 6.5 11.8a6.5 6.5 0 11-13 0C5.5 10.3 12 3 12 3z" />
    </svg>
  );
}

export function IconPill(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="10.5" width="17" height="7.5" rx="3.75" transform="rotate(-35 12 14.25)" />
      <path d="M9.8 10.2l4.4 8.1" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.5s-7.5-4.6-9.7-9.4C.7 7.6 2.6 4 6.2 4c2 0 3.6 1.1 4.6 2.7C11.8 5.1 13.4 4 15.4 4c3.6 0 5.5 3.6 3.9 7.1-2.2 4.8-9.7 9.4-9.7 9.4z" />
    </svg>
  );
}

export function IconSprout(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21V11" />
      <path d="M12 11c0-3.5-2.5-6-6.5-6C5.5 9 8 11.5 12 11z" />
      <path d="M12 8c0-2.8 2-4.8 5-4.8C17 6.5 15 8.5 12 8z" />
    </svg>
  );
}

export function IconBelly(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3" />
      <path d="M8 11c-2.5 1.2-4 3.7-4 6.6 0 2.2 1.8 3.9 4 3.9h8c2.2 0 4-1.7 4-3.9 0-2.9-1.5-5.4-4-6.6" />
      <path d="M12 15v3" />
    </svg>
  );
}

export function IconBottle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8" y="9" width="8" height="12.5" rx="2.5" />
      <path d="M9.5 9V6.5a2.5 2.5 0 015 0V9" />
      <path d="M9.5 4.5h5" />
      <path d="M8 13.5h8" />
    </svg>
  );
}

export function IconRun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="14.2" cy="4.8" r="1.7" fill="currentColor" stroke="none" />
      <path d="M9.5 8.6l3 1.6 2.6-1.8" />
      <path d="M12.5 10.2l-1 3.6 3 1.7-.8 4.8" />
      <path d="M11.5 13.8l-3.2 1.4-1.8 3.4" />
      <path d="M15.1 11.4l2.4 1-.6 2.6" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <rect x="9" y="3" width="6" height="3" rx="1.2" />
      <path d="M8.5 12.5l2.2 2.2 4.3-4.7" />
      <path d="M8.5 17h7" />
    </svg>
  );
}

export function IconGift(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="9.5" width="17" height="11" rx="1.5" />
      <path d="M3.5 13.5h17" />
      <path d="M12 9.5v11" />
      <path d="M12 9.5C10 6 6 6 6 8.5c0 1.4 2.7 1 6 1zM12 9.5c2-3.5 6-3.5 6-1 0 1.4-2.7 1-6 1z" />
    </svg>
  );
}
