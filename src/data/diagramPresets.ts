export interface DiagramPreset {
  id: string;
  title: string;
  category: 'Matematika' | 'IPAS' | 'Pancasila' | 'Umum';
  description: string;
  dataUrl: string;
}

// Crisp inline SVGs converted to data URLs for instant offline-safe usage in SD exams
const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const SD_DIAGRAM_PRESETS: DiagramPreset[] = [
  {
    id: 'geo-segitiga-siku',
    title: 'Segitiga Siku-Siku & Sudut',
    category: 'Matematika',
    description: 'Ilustrasi segitiga siku-siku dengan sisi alas, tinggi, dan sudut siku-siku 90°',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#f8fafc" rx="16" stroke="#cbd5e1" stroke-width="2"/>
        <polygon points="50,170 260,170 50,40" fill="#e0e7ff" stroke="#4338ca" stroke-width="3"/>
        <rect x="50" y="150" width="20" height="20" fill="none" stroke="#4338ca" stroke-width="2"/>
        <text x="145" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e1b4b" text-anchor="middle">Alas = a (8 cm)</text>
        <text x="25" y="110" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e1b4b" text-anchor="middle">Tinggi (6 cm)</text>
        <text x="175" y="95" font-family="sans-serif" font-size="14" font-weight="bold" fill="#4338ca">Sisi Miring (c)</text>
        <circle cx="50" cy="40" r="4" fill="#4338ca"/>
        <circle cx="260" cy="170" r="4" fill="#4338ca"/>
        <circle cx="50" cy="170" r="4" fill="#4338ca"/>
      </svg>
    `),
  },
  {
    id: 'math-pecahan-lingkaran',
    title: 'Pecahan Lingkaran (3/4)',
    category: 'Matematika',
    description: 'Diagram lingkaran terbagi 4 bagian dengan 3 bagian diarsir',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#f8fafc" rx="16" stroke="#cbd5e1" stroke-width="2"/>
        <g transform="translate(160, 110)">
          <circle r="75" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>
          <path d="M 0 0 L 0 -75 A 75 75 0 0 1 75 0 Z" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
          <path d="M 0 0 L 75 0 A 75 75 0 0 1 0 75 Z" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
          <path d="M 0 0 L 0 75 A 75 75 0 0 1 -75 0 Z" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
          <circle cx="0" cy="0" r="4" fill="#0f172a"/>
        </g>
        <text x="160" y="205" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e293b" text-anchor="middle">Bagian yang diarsir bernilai 3/4</text>
      </svg>
    `),
  },
  {
    id: 'ipas-fotosintesis',
    title: 'Siklus Fotosintesis Tumbuhan',
    category: 'IPAS',
    description: 'Bagan proses fotosintesis dengan cahaya matahari, CO2, air, dan oksigen',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#f0fdf4" rx="16" stroke="#bbf7d0" stroke-width="2"/>
        <!-- Sun -->
        <circle cx="45" cy="45" r="22" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
        <text x="45" y="82" font-family="sans-serif" font-size="10" font-weight="bold" fill="#b45309" text-anchor="middle">Cahaya Matahari</text>
        <!-- Leaf -->
        <path d="M 120 130 C 120 70, 210 70, 240 120 C 210 170, 130 170, 120 130 Z" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
        <path d="M 120 130 Q 180 120 240 120" stroke="#166534" stroke-width="2" fill="none"/>
        <path d="M 160 125 L 180 105 M 190 122 L 210 102 M 170 127 L 190 145" stroke="#166534" stroke-width="1.5"/>
        <!-- Arrows & Labels -->
        <text x="80" y="125" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857">Karbon Dioksida (CO₂)</text>
        <text x="80" y="140" font-family="sans-serif" font-size="9" fill="#065f46">Masuk ke Stomata</text>
        <text x="240" y="70" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0284c7">Oksigen (O₂)</text>
        <text x="240" y="85" font-family="sans-serif" font-size="9" fill="#0369a1">Dihasilkan & Dilepas</text>
        <text x="160" y="200" font-family="sans-serif" font-size="12" font-weight="bold" fill="#14532d" text-anchor="middle">Air (H₂O) diserap melalui akar</text>
      </svg>
    `),
  },
  {
    id: 'ipas-siklus-air',
    title: 'Daur / Siklus Air (Hidrologi)',
    category: 'IPAS',
    description: 'Bagan evaporasi, kondensasi awan, presipitasi hujan, dan infiltrasi',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#f0f9ff" rx="16" stroke="#bae6fd" stroke-width="2"/>
        <!-- Cloud -->
        <path d="M 170 65 Q 160 45 180 40 Q 200 35 215 50 Q 235 45 240 60 Q 250 75 235 80 Q 180 85 170 65 Z" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
        <text x="205" y="65" font-family="sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">Kondensasi</text>
        <!-- Rain -->
        <line x1="190" y1="90" x2="185" y2="110" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="210" y1="90" x2="205" y2="110" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="230" y1="90" x2="225" y2="110" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="245" y="115" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0284c7">Presipitasi (Hujan)</text>
        <!-- Evaporation -->
        <path d="M 60 140 Q 70 110 60 80" stroke="#e11d48" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
        <polygon points="60,75 55,85 65,85" fill="#e11d48"/>
        <text x="75" y="105" font-family="sans-serif" font-size="10" font-weight="bold" fill="#be123c">Evaporasi</text>
        <!-- Sea and Land -->
        <path d="M 0 170 Q 150 160 320 170 L 320 220 L 0 220 Z" fill="#38bdf8"/>
        <text x="160" y="200" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Lautan & Aliran Air Tanah</text>
      </svg>
    `),
  },
  {
    id: 'pancasila-rantai',
    title: 'Simbol Sila Pancasila (Rantai Emas)',
    category: 'Pancasila',
    description: 'Simbol Sila ke-2 Kemanusiaan yang Adil dan Beradab',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#fef2f2" rx="16" stroke="#fecaca" stroke-width="2"/>
        <rect x="90" y="30" width="140" height="140" fill="#dc2626" rx="12" stroke="#991b1b" stroke-width="3"/>
        <circle cx="160" cy="100" r="45" fill="none" stroke="#fbbf24" stroke-width="10" stroke-dasharray="12,6"/>
        <text x="160" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="#991b1b" text-anchor="middle">Simbol Sila Ke-2: Rantai Emas</text>
      </svg>
    `),
  },
  {
    id: 'peta-indonesia-kepulauan',
    title: 'Peta Kepulauan Nusantara Indonesia',
    category: 'IPAS',
    description: 'Peta kepulauan 5 pulau besar Indonesia: Sumatera, Jawa, Kalimantan, Sulawesi, Papua',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
        <rect width="320" height="220" fill="#e0f2fe" rx="16" stroke="#7dd3fc" stroke-width="2"/>
        <!-- Sumatera -->
        <path d="M 30 50 L 55 110 L 80 140 L 60 135 L 40 85 Z" fill="#15803d" stroke="#14532d"/>
        <text x="35" y="70" font-family="sans-serif" font-size="8" font-weight="bold" fill="#ffffff">Sumatera</text>
        <!-- Jawa -->
        <path d="M 85 155 L 175 160 L 175 167 L 85 165 Z" fill="#15803d" stroke="#14532d"/>
        <text x="125" y="175" font-family="sans-serif" font-size="8" font-weight="bold" fill="#0f172a">Jawa</text>
        <!-- Kalimantan -->
        <path d="M 95 65 L 145 65 L 150 115 L 105 125 Z" fill="#15803d" stroke="#14532d"/>
        <text x="105" y="95" font-family="sans-serif" font-size="8" font-weight="bold" fill="#ffffff">Kalimantan</text>
        <!-- Sulawesi -->
        <path d="M 165 75 L 175 60 L 180 85 L 195 90 L 175 120 L 165 95 Z" fill="#15803d" stroke="#14532d"/>
        <text x="195" y="80" font-family="sans-serif" font-size="8" font-weight="bold" fill="#0f172a">Sulawesi</text>
        <!-- Papua -->
        <path d="M 230 90 L 260 85 L 290 100 L 290 145 L 250 145 Z" fill="#15803d" stroke="#14532d"/>
        <text x="255" y="120" font-family="sans-serif" font-size="8" font-weight="bold" fill="#ffffff">Papua</text>
        <text x="160" y="205" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Negara Kesatuan Republik Indonesia</text>
      </svg>
    `),
  },
];
