const DEFAULT_FIELD_IMAGE_URL = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#121410"/>
      <stop offset="1" stop-color="#0d0f0b"/>
    </linearGradient>
    <linearGradient id="pitch" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#16351f"/>
      <stop offset="1" stop-color="#0f2616"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" rx="36" fill="url(#g)"/>

  <!-- Pitch -->
  <rect x="70" y="70" width="1060" height="560" rx="28" fill="url(#pitch)"/>

  <!-- Grass stripes -->
  <g opacity="0.22">
    <rect x="70" y="70" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="210" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="350" width="1060" height="70" fill="#1d4428"/>
    <rect x="70" y="490" width="1060" height="70" fill="#1d4428"/>
  </g>

  <!-- Field lines -->
  <g fill="none" stroke="#e8fff0" stroke-opacity="0.55" stroke-width="6">
    <rect x="110" y="110" width="980" height="480" rx="18"/>
    <path d="M600 110v480"/>
    <circle cx="600" cy="350" r="120"/>
    <circle cx="600" cy="350" r="8" fill="#e8fff0"/>

    <!-- Penalty boxes -->
    <rect x="110" y="230" width="140" height="240" rx="10"/>
    <rect x="950" y="230" width="140" height="240" rx="10"/>
    <rect x="110" y="280" width="60" height="140" rx="10"/>
    <rect x="1030" y="280" width="60" height="140" rx="10"/>
  </g>

  <!-- Soft vignette -->
  <rect x="70" y="70" width="1060" height="560" rx="28" fill="#000" opacity="0.15"/>

  <!-- Border -->
  <rect x="60" y="60" width="1080" height="580" rx="28" fill="none" stroke="#8eff71" stroke-opacity="0.14" stroke-width="6"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
})();

export default DEFAULT_FIELD_IMAGE_URL;
