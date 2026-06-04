// HIRA logo — a magnifier over a shield ("identify" + "protect"). Line-art mark
// drawn with currentColor so it stays white inside the brand-colored chips.
export default function Logo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* shield */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {/* magnifier lens */}
      <circle cx="10.6" cy="9.8" r="2.7" />
      {/* magnifier handle */}
      <path d="m12.7 11.9 2.6 2.6" />
    </svg>
  )
}
