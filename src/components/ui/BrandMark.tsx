/** Símbolo próprio: mapa dobrado com trajeto em forma de E. */
export function BrandMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M4 10 17 5l14 5 13-5v33l-13 5-14-5-13 5V10Z" fill="currentColor" />
    <path d="M17 5v33M31 10v33" stroke="white" strokeOpacity=".3" strokeWidth="1.5" />
    <path d="M32 15H16v18h16M16 24h12" stroke="white" strokeWidth="3" strokeLinejoin="miter" />
    <circle cx="33" cy="15" r="3" fill="#d9b65e" />
  </svg>
}
