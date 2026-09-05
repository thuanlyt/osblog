import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return { 'aria-hidden': true, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'icon', ...props }
}

export function ArrowUpRightIcon(props: IconProps) { return <svg {...base(props)}><path d="M7 17 17 7M8 7h9v9" /></svg> }
export function ChevronLeftIcon(props: IconProps) { return <svg {...base(props)}><path d="M15 18 9 12l6-6" /></svg> }
export function ChevronRightIcon(props: IconProps) { return <svg {...base(props)}><path d="M9 18l6-6-6-6" /></svg> }
export function SearchIcon(props: IconProps) { return <svg {...base(props)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg> }
export function SunIcon(props: IconProps) { return <svg {...base(props)}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" /></svg> }
export function MoonIcon(props: IconProps) { return <svg {...base(props)}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></svg> }
export function GlobeIcon(props: IconProps) { return <svg {...base(props)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" /></svg> }
export function MenuIcon(props: IconProps) { return <svg {...base(props)}><path d="M4 7h16M4 12h16M4 17h16" /></svg> }
export function CloseIcon(props: IconProps) { return <svg {...base(props)}><path d="M6 6l12 12M18 6 6 18" /></svg> }
export function CheckIcon(props: IconProps) { return <svg {...base(props)}><path d="m5 13 4 4L19 7" /></svg> }
export function AlertIcon(props: IconProps) { return <svg {...base(props)}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5h.01" /></svg> }
export function BoldIcon(props: IconProps) { return <svg {...base(props)}><path d="M7 4h6a3.5 3.5 0 0 1 0 7H7Zm0 7h7a3.5 3.5 0 0 1 0 7H7Z" /></svg> }
export function ItalicIcon(props: IconProps) { return <svg {...base(props)}><path d="M11 4h6M7 20h6M14 4 10 20" /></svg> }
export function HeadingIcon(props: IconProps) { return <svg {...base(props)}><path d="M5 5v14M17 5v14M5 12h12" /></svg> }
export function LinkIcon(props: IconProps) { return <svg {...base(props)}><path d="M9.5 14.5 14.5 9.5" /><path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L16 11.5M13 17.5l-1.6 1.6a3.5 3.5 0 0 1-5-5L8 12.5" /></svg> }
export function ImageIcon(props: IconProps) { return <svg {...base(props)}><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-5 4 4 3-3 4 4" /></svg> }
export function ListIcon(props: IconProps) { return <svg {...base(props)}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></svg> }
export function QuoteIcon(props: IconProps) { return <svg {...base(props)}><path d="M8 15c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3v3c0 2 1 3.5 3 4M17 15c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3v3c0 2 1 3.5 3 4" /></svg> }
export function CodeIcon(props: IconProps) { return <svg {...base(props)}><path d="m9 8-5 4 5 4M15 8l5 4-5 4" /></svg> }
export function EyeIcon(props: IconProps) { return <svg {...base(props)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.75" /></svg> }
export function ColumnsIcon(props: IconProps) { return <svg {...base(props)}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M12 4.5v15" /></svg> }
export function TrashIcon(props: IconProps) { return <svg {...base(props)}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12.5A2 2 0 0 0 8 21.5h8a2 2 0 0 0 2-2L19 7" /></svg> }
export function LogOutIcon(props: IconProps) { return <svg {...base(props)}><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M9 12h11m0 0-3-3m3 3-3 3" /></svg> }
export function PlusIcon(props: IconProps) { return <svg {...base(props)}><path d="M12 5v14M5 12h14" /></svg> }
export function ArchiveIcon(props: IconProps) { return <svg {...base(props)}><rect x="3.5" y="4" width="17" height="4.5" rx="1" /><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13.5h4" /></svg> }
export function ClockIcon(props: IconProps) { return <svg {...base(props)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg> }
export function SpinnerIcon(props: IconProps) { return <svg {...base(props)} className="icon icon-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> }
export function FolderIcon(props: IconProps) { return <svg {...base(props)}><path d="M4 6.5a1.5 1.5 0 0 1 1.5-1.5H10l2 2h6.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" /></svg> }
export function MessageIcon(props: IconProps) { return <svg {...base(props)}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5Z" /></svg> }
export function PencilIcon(props: IconProps) { return <svg {...base(props)}><path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3Z" /><path d="m14 6 4 4" /></svg> }
