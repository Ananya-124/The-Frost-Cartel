import React from 'react';

interface RelicIconProps {
  relicId: string;
  className?: string;
  isFound?: boolean;
}

interface IconRenderProps {
  className: string;
  fillColor: string;
  strokeColor: string;
  isFound: boolean;
}

const PumpkinIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 3C12.5 1.5 14 1.5 14.5 1M5 10C3 11.5 3 15 5 18C7 21 11 22 12 22C13 22 17 21 19 18C21 15 21 11.5 19 10C17 7 13 7 12 7C11 7 7 7 5 10Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <path d="M8 11L9.5 12.5L8 14H10L8 11Z" fill="#1c1917" />
    <path d="M16 11L14.5 12.5L16 14H14L16 11Z" fill="#1c1917" />
    <path d="M8 17L10 16L12 17.5L14 16L16 17L14 18.5L12 17.5L10 18.5L8 17Z" fill="#1c1917" />
  </svg>
);

const SkullIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 3C7 3 4 6.5 4 11C4 13.5 5.5 15.5 7 16.5V20C7 20.5 7.5 21 8 21H16C16.5 21 17 20.5 17 20V16.5C18.5 15.5 20 13.5 20 11C20 6.5 17 3 12 3Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <ellipse cx="8.5" cy="11.5" rx="2" ry="2.5" fill="#1c1917" />
    <ellipse cx="15.5" cy="11.5" rx="2" ry="2.5" fill="#1c1917" />
    <path d="M12 13.5L11 16H13L12 13.5Z" fill="#1c1917" />
    <line x1="10" y1="18.5" x2="10" y2="21" stroke="#1c1917" strokeWidth="1.2" />
    <line x1="12" y1="18.5" x2="12" y2="21" stroke="#1c1917" strokeWidth="1.2" />
    <line x1="14" y1="18.5" x2="14" y2="21" stroke="#1c1917" strokeWidth="1.2" />
  </svg>
);

const GhostIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 3C7.5 3 5 6.5 5 11C5 14 3.5 16.5 3.5 18C3.5 20 5.5 21 7 19.5C8.5 18 9.5 20 12 20C14.5 20 15.5 18 17 19.5C18.5 21 20.5 20 20.5 18C20.5 16.5 19 14 19 11C19 6.5 16.5 3 12 3Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <ellipse cx="9" cy="9.5" rx="1.5" ry="2" fill="#1c1917" />
    <ellipse cx="15" cy="9.5" rx="1.5" ry="2" fill="#1c1917" />
    <ellipse cx="12" cy="14" rx="2" ry="2.5" fill="#1c1917" />
  </svg>
);

const BatIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 9C10.5 6 8 5 4 6C4.5 9 6 12 8 13C6 14 4 14.5 2 13.5C2.5 16 5 18 9 17L12 19L15 17C19 18 21.5 16 22 13.5C20 14.5 18 14 16 13C18 12 19.5 9 20 6C16 5 13.5 6 12 9Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <path d="M11 8.5L10 6.5H11.5L12 8L12.5 6.5H14L13 8.5" stroke="#1c1917" strokeWidth="1" />
  </svg>
);

const WitchHatIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 2C13 5 15 11 17 16H7C9 11 11 5 12 2Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <ellipse cx="12" cy="18" rx="10" ry="3.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
    <path d="M7 16C9 14.5 15 14.5 17 16" stroke="#fbbf24" strokeWidth="1.8" />
  </svg>
);

const SpiderIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <circle cx="12" cy="13" r="3.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
    <circle cx="12" cy="8" r="2" fill={fillColor} />
    <path d="M9 11C6 9 4 10 3 12" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M15 11C18 9 20 10 21 12" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M9 13C6 13 4 15 3 17" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M15 13C18 13 20 15 21 17" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M9.5 15C7 17 6 19 6 21" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M14.5 15C17 17 18 19 18 21" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const SpiderWebIcon: React.FC<IconRenderProps> = ({ className, strokeColor }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M2 2L22 22M2 22L22 2M12 2V22M2 12H22" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.8" />
    <circle cx="12" cy="12" r="5" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 3" />
  </svg>
);

const CoffinIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M8 2L16 2L19 8L16 22L8 22L5 8L8 2Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <path d="M12 6V16M9 9H15" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BlackCatIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M12 11C8.5 11 6 13.5 6 17C6 20.5 8.5 22 12 22C15.5 22 18 20.5 18 17C18 13.5 15.5 11 12 11Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <path
      d="M7.5 12L7 5L10 8C10.6 7.7 11.3 7.5 12 7.5C12.7 7.5 13.4 7.7 14 8L17 5L16.5 12"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <ellipse cx="9.5" cy="10" rx="1" ry="1.5" fill="#fef08a" />
    <ellipse cx="14.5" cy="10" rx="1" ry="1.5" fill="#fef08a" />
    <path d="M18 19C20 19 22 17 22 14" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const PotionBottleIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M10 2H14V5L17 9V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V9L10 5V2Z"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <rect x="9" y="1" width="6" height="2" rx="0.5" fill={strokeColor} />
    <path d="M8 14C10 13 14 15 16 14V19C16 20.1 15.1 21 14 21H10C8.9 21 8 20.1 8 19V14Z" fill="#991b1b" fillOpacity="0.8" />
    <circle cx="11" cy="17" r="1" fill="#fef08a" />
    <circle cx="13.5" cy="15.5" r="0.8" fill="#fef08a" />
  </svg>
);

const CandleIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <rect
      x="8"
      y="8"
      width="8"
      height="14"
      rx="1"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <path d="M12 8V5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M12 2C11 3 10 4 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 4 13 3 12 2Z"
      fill="#ef4444"
      stroke="#f59e0b"
      strokeWidth="0.8"
    />
    <circle cx="12" cy="5" r="1" fill="#fef08a" />
  </svg>
);

const SkeletonKeyIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor, isFound }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <circle
      cx="7"
      cy="8"
      r="4"
      fill={fillColor}
      fillOpacity={isFound ? 0.95 : 0.75}
      stroke={strokeColor}
      strokeWidth="1.2"
    />
    <circle cx="7" cy="8" r="1.5" fill="#1c1917" />
    <path d="M11 8H21V12M17 8V11M21 8V11" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DefaultRelicIcon: React.FC<IconRenderProps> = ({ className, fillColor, strokeColor }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
    <text x="12" y="16" textAnchor="middle" fill="#1c1917" fontSize="11" fontWeight="bold">?</text>
  </svg>
);

const RELIC_RENDERERS: Record<string, React.FC<IconRenderProps>> = {
  pumpkin: PumpkinIcon,
  skull: SkullIcon,
  ghost: GhostIcon,
  bat: BatIcon,
  witch_hat: WitchHatIcon,
  spider: SpiderIcon,
  spider_web: SpiderWebIcon,
  coffin: CoffinIcon,
  black_cat: BlackCatIcon,
  potion_bottle: PotionBottleIcon,
  candle: CandleIcon,
  skeleton_key: SkeletonKeyIcon,
};

export const RelicIcon: React.FC<RelicIconProps> = ({
  relicId,
  className = 'w-5 h-5',
  isFound = false,
}) => {
  const fillColor = isFound ? '#fbbf24' : '#a8a29e';
  const strokeColor = isFound ? '#fef08a' : '#78716c';
  const normalized = relicId.replace(/^target_/, '');
  const Renderer = RELIC_RENDERERS[normalized] ?? DefaultRelicIcon;

  return (
    <Renderer
      className={className}
      fillColor={fillColor}
      strokeColor={strokeColor}
      isFound={isFound}
    />
  );
};
