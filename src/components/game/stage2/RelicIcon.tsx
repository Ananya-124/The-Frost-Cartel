import React from 'react';

interface RelicIconProps {
  relicId: string;
  className?: string;
  isFound?: boolean;
}

export const RelicIcon: React.FC<RelicIconProps> = ({
  relicId,
  className = 'w-5 h-5',
  isFound = false,
}) => {
  const fillColor = isFound ? '#10b981' : '#d4af37';
  const strokeColor = isFound ? '#34d399' : '#f59e0b';

  switch (relicId) {
    case 'target_pumpkin':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Jack-o'-Lantern */}
          <path
            d="M12 3C12.5 1.5 14 1.5 14.5 1M5 10C3 11.5 3 15 5 18C7 21 11 22 12 22C13 22 17 21 19 18C21 15 21 11.5 19 10C17 7 13 7 12 7C11 7 7 7 5 10Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <path d="M8 11L9.5 12.5L8 14H10L8 11Z" fill="#1c1917" />
          <path d="M16 11L14.5 12.5L16 14H14L16 11Z" fill="#1c1917" />
          <path d="M8 17L10 16L12 17.5L14 16L16 17L14 18.5L12 17.5L10 18.5L8 17Z" fill="#1c1917" />
        </svg>
      );

    case 'target_skull':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Ancestral Skull */}
          <path
            d="M12 3C7 3 4 6.5 4 11C4 13.5 5.5 15.5 7 16.5V20C7 20.5 7.5 21 8 21H16C16.5 21 17 20.5 17 20V16.5C18.5 15.5 20 13.5 20 11C20 6.5 17 3 12 3Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
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

    case 'target_ghost':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Spectral Ghost */}
          <path
            d="M12 3C7.5 3 5 6.5 5 11C5 14 3.5 16.5 3.5 18C3.5 20 5.5 21 7 19.5C8.5 18 9.5 20 12 20C14.5 20 15.5 18 17 19.5C18.5 21 20.5 20 20.5 18C20.5 16.5 19 14 19 11C19 6.5 16.5 3 12 3Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <ellipse cx="9" cy="9.5" rx="1.5" ry="2" fill="#1c1917" />
          <ellipse cx="15" cy="9.5" rx="1.5" ry="2" fill="#1c1917" />
          <ellipse cx="12" cy="14" rx="2" ry="2.5" fill="#1c1917" />
        </svg>
      );

    case 'target_bat':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Nocturnal Bat */}
          <path
            d="M12 9C10.5 6 8 5 4 6C4.5 9 6 12 8 13C6 14 4 14.5 2 13.5C2.5 16 5 18 9 17L12 19L15 17C19 18 21.5 16 22 13.5C20 14.5 18 14 16 13C18 12 19.5 9 20 6C16 5 13.5 6 12 9Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <path d="M11 8.5L10 6.5H11.5L12 8L12.5 6.5H14L13 8.5" stroke="#1c1917" strokeWidth="1" />
        </svg>
      );

    case 'target_witch_hat':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Witch Hat */}
          <path
            d="M12 2C13 5 15 11 17 16H7C9 11 11 5 12 2Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <ellipse cx="12" cy="18" rx="10" ry="3.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <path d="M7 16C9 14.5 15 14.5 17 16" stroke="#fbbf24" strokeWidth="1.8" />
          <rect x="11" y="14.5" width="2" height="2.5" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
        </svg>
      );

    case 'target_spider':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Crawling Arachnid */}
          <ellipse cx="12" cy="14" rx="4" ry="4.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="12" cy="8" r="2.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <path d="M9 11C6 10 4 7 3 5M9 13C6 13 3 14 2 16M9 15C6 17 4 19 3 22" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M15 11C18 10 20 7 21 5M15 13C18 13 21 14 22 16M15 15C18 17 20 19 21 22" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'target_web':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Spider Web */}
          <path d="M2 2L22 22M2 2V22M2 2H22M2 12H16M12 2V16" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.7" />
          <path d="M2 7C4.5 7 7 4.5 7 2" stroke={strokeColor} strokeWidth="1.2" fill="none" />
          <path d="M2 12C7.5 12 12 7.5 12 2" stroke={strokeColor} strokeWidth="1.2" fill="none" />
          <path d="M2 17C10.5 17 17 10.5 17 2" stroke={strokeColor} strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'target_coffin':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Carved Coffin */}
          <polygon
            points="7,2 17,2 20,8 16,22 8,22 4,8"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          {/* Cross on lid */}
          <line x1="12" y1="6" x2="12" y2="15" stroke="#1c1917" strokeWidth="1.5" />
          <line x1="9" y1="9" x2="15" y2="9" stroke="#1c1917" strokeWidth="1.5" />
        </svg>
      );

    case 'target_black_cat':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Black Cat */}
          <path
            d="M12 12C9 12 7 14 7 18C7 20 8.5 21 12 21C15.5 21 17 20 17 18C17 14 15 12 12 12Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <circle cx="12" cy="8" r="3.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <polygon points="9,6 8,2 11,5" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <polygon points="15,6 16,2 13,5" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
          <circle cx="10.5" cy="8" r="0.7" fill="#1c1917" />
          <circle cx="13.5" cy="8" r="0.7" fill="#1c1917" />
          <path d="M17 18C19 18 21 15 21 12C21 10.5 19.5 10.5 19.5 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'target_potion':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Potion Flask */}
          <rect x="10" y="2" width="4" height="4" fill="#a16207" stroke={strokeColor} strokeWidth="1" rx="0.5" />
          <path
            d="M10 6V9L4 18C3 19.5 4 21 6 21H18C20 21 21 19.5 20 18L14 9V6H10Z"
            fill={fillColor}
            fillOpacity={isFound ? 0.9 : 0.8}
            stroke={strokeColor}
            strokeWidth="1.2"
          />
          <path d="M6 17L9 12H15L18 17C17 19 15 20 12 20C9 20 7 19 6 17Z" fill="#a855f7" fillOpacity="0.8" />
          <circle cx="11" cy="15" r="1" fill="#ffffff" fillOpacity="0.6" />
          <circle cx="14" cy="17" r="0.8" fill="#ffffff" fillOpacity="0.6" />
        </svg>
      );

    case 'target_candle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Wax Taper Candle */}
          <rect x="9.5" y="9" width="5" height="13" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <line x1="12" y1="9" x2="12" y2="6.5" stroke="#78350f" strokeWidth="1.2" />
          {/* Flame */}
          <path d="M12 1.5C11 3.5 9.5 5 12 7C14.5 5 13 3.5 12 1.5Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="12" cy="4.5" r="0.8" fill="#ffffff" />
        </svg>
      );

    case 'target_key':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          {/* Antique Skeleton Key */}
          <circle cx="7" cy="8" r="4.5" fill={fillColor} fillOpacity={isFound ? 0.9 : 0.8} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="7" cy="8" r="2" fill="#1c1917" />
          <line x1="11" y1="10" x2="20" y2="19" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="17" y1="16" x2="19" y2="14" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="19" y1="18" x2="21" y2="16" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    default:
      return <span className={className} aria-hidden="true">✦</span>;
  }
};

