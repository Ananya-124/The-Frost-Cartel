import React from 'react';

/** Seven-segment style readout (drawn as SVG so it needs no font). */
const ON: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg',
  '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
};
const SEG: Record<string, string> = {
  a: 'M4 2.5 L5.8 1 L16.2 1 L18 2.5 L16.2 4 L5.8 4 Z',
  b: 'M20 4 L21.5 5.6 L21.5 16 L20 17.6 L18.5 16 L18.5 5.6 Z',
  c: 'M20 20.4 L21.5 22 L21.5 32.4 L20 34 L18.5 32.4 L18.5 22 Z',
  d: 'M4 35.5 L5.8 34 L16.2 34 L18 35.5 L16.2 37 L5.8 37 Z',
  e: 'M2 20.4 L3.5 22 L3.5 32.4 L2 34 L0.5 32.4 L0.5 22 Z',
  f: 'M2 4 L3.5 5.6 L3.5 16 L2 17.6 L0.5 16 L0.5 5.6 Z',
  g: 'M4 19 L5.8 17.5 L16.2 17.5 L18 19 L16.2 20.5 L5.8 20.5 Z',
};
const DIGIT_W = 22;
const GAP = 5;

export const LedClock: React.FC<{ value: string; warn?: boolean; label: string }> = ({ value, warn = false, label }) => {
  let x = 0;
  const parts: React.ReactNode[] = [];
  [...value].forEach((ch, i) => {
    if (ch === ':') {
      parts.push(
        <g key={i}>
          <circle className="on" cx={x + 3} cy={12} r={2.2} />
          <circle className="on" cx={x + 3} cy={26} r={2.2} />
        </g>
      );
      x += 6 + GAP;
      return;
    }
    const lit = ON[ch] ?? '';
    parts.push(
      <g key={i} transform={`translate(${x} 0)`}>
        {Object.keys(SEG).map((k) => <path key={k} d={SEG[k]} className={lit.includes(k) ? 'on' : 'off'} />)}
      </g>
    );
    x += DIGIT_W + GAP;
  });
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${x - GAP} 38`} className={`s1-led ${warn ? 'warn' : ''}`}>
      {parts}
    </svg>
  );
};
