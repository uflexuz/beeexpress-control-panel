import { useId } from 'react';

/**
 * Bee Express brend belgisi — inline SVG asalari (bee emoji o'rniga).
 * Login, Layout (sidebar) va splash ekranida ishlatiladi.
 *
 * @param {number}  [size=40]      Kvadrat o'lcham (px).
 * @param {string}  [color]        Asalari (qorong'i) rangi. Default brend matn rangi.
 * @param {?string} [bg]           Sariq kvadrat fon rangi. `null`/`false` bo'lsa fon chizilmaydi.
 * @param {number}  [radius=6]     Kvadrat burchak radiusi (24-lik viewBox bo'yicha).
 */
export default function BrandMark({
  size = 40,
  color = '#21201F',
  bg = '#FCE000',
  radius = 6,
  className,
  style,
  ...rest
}) {
  const uid = useId();
  const clipId = `bx-bee-${uid}`;
  // Yo'l-yo'l chiziqlar fon bo'lmasa ham asalari ko'rinishini beradi.
  const stripe = '#FCE000';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bee Express"
      className={className}
      style={style}
      {...rest}
    >
      {bg ? <rect x="0" y="0" width="24" height="24" rx={radius} fill={bg} /> : null}

      {/* Mo'ylovlar */}
      <g stroke={color} strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M10.7 4.7C10 3.7 9.1 3.2 8.4 3.1" />
        <path d="M13.3 4.7C14 3.7 14.9 3.2 15.6 3.1" />
      </g>
      <circle cx="8.2" cy="2.9" r="0.85" fill={color} />
      <circle cx="15.8" cy="2.9" r="0.85" fill={color} />

      {/* Qanotlar (yarim shaffof) */}
      <ellipse cx="7.5" cy="10" rx="2.9" ry="3.9" fill={color} opacity="0.38"
               transform="rotate(-26 7.5 10)" />
      <ellipse cx="16.5" cy="10" rx="2.9" ry="3.9" fill={color} opacity="0.38"
               transform="rotate(26 16.5 10)" />

      {/* Bosh */}
      <circle cx="12" cy="6.7" r="2.5" fill={color} />

      {/* Tana + sariq yo'l-yo'l chiziqlar */}
      <clipPath id={clipId}>
        <ellipse cx="12" cy="14" rx="4.3" ry="6" />
      </clipPath>
      <ellipse cx="12" cy="14" rx="4.3" ry="6" fill={color} />
      <g clipPath={`url(#${clipId})`}>
        <rect x="4" y="11.1" width="16" height="1.9" fill={stripe} />
        <rect x="4" y="15.1" width="16" height="1.9" fill={stripe} />
      </g>
    </svg>
  );
}
