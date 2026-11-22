const symbols: Record<string, string> = {
  medical: "M82 42h36v40h40v36h-40v40H82v-40H42V82h40Z",
  surgical: "M49 146l33-33 29-63 42-12-12 42-63 29-33 33Z M101 92l18 17",
  dental: "M67 52Q82 41 100 53Q119 41 133 52Q151 69 138 105L124 147Q117 161 113 144L108 118Q100 103 92 118L87 144Q83 161 76 147L62 105Q49 69 67 52Z",
  rehabilitation: "M55 142h88M65 122l31-29 18 16 26-38M117 71h23v23",
  longevity: "M46 101h28l12-30 21 60 16-30h31M100 154Q45 119 45 80Q46 48 74 48Q90 48 100 64Q110 48 126 48Q154 48 155 80Q155 119 100 154Z",
  "holistic-health": "M100 145Q56 145 46 106Q76 106 100 133Q124 106 154 106Q144 145 100 145ZM100 132Q63 101 100 55Q137 101 100 132Z",
};

export function ServiceCover({ slug }: { slug: string }) {
  return (
    <svg className="service-cover" viewBox="0 0 320 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M0 0H320V225H0Z" fill="#241633" />
      <path d="M0 150L58 105L117 146L187 95L246 122L320 70V225H0Z" fill="#4A2857" />
      <path d="M0 197L73 150L155 184L250 124L320 156V225H0Z" fill="#683959" />
      <path d="M0 208H320M0 216H320" stroke="#FFAD76" opacity=".45" />
      <circle cx="160" cy="108" r="82" fill="#311E46" stroke="#FFAD76" opacity=".95" />
      <circle cx="160" cy="108" r="70" stroke="#FF5FAD" strokeDasharray="2 5" fill="none" />
      <path d={symbols[slug] ?? symbols.medical} transform="translate(60 8)" stroke="#62F5DA" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
