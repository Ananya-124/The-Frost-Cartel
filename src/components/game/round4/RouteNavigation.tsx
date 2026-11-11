import React from 'react';
import type { ExpeditionProgress } from '../../../types/round4Expedition.types';
import { EXPEDITION_ROUTES } from './ExpeditionRouteConfiguration';

interface RouteNavigationProps {
  progress: ExpeditionProgress;
  assignedRoute: { routeId: string; routeName: string; routeSubtitle: string };
}

export const RouteNavigation: React.FC<RouteNavigationProps> = ({
  progress,
  assignedRoute,
}) => {

  return (
    <nav
      aria-label="Expedition Routes Navigation"
      className="relative flex flex-col items-center select-none py-2"
    >
      {/* Top Decorative Gold Compass Filigree */}
      <div className="relative mb-2 text-[#d4af37] opacity-80" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M 12,2 L 13.5,8 L 19.5,9.5 L 13.5,11 L 12,17 L 10.5,11 L 4.5,9.5 L 10.5,8 Z" fill="#ffd866" stroke="#b8974a" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Vertical Connecting Guide Wire */}
      <div className="relative flex flex-col items-center gap-3 sm:gap-3.5">
        <div className="absolute top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-[#d4af37]/40 via-[#b8974a]/60 to-[#d4af37]/40 z-0" />

        {EXPEDITION_ROUTES.map((route) => {
          const isAssigned = assignedRoute.routeId === route.routeId;
          const isActive = isAssigned && progress.activeRouteId === assignedRoute.routeId;
          const isCompleted = progress.completedRouteIds.includes(route.routeId);
          // The server assignment is the only playable route; local clicks cannot change it.
          const isUnlocked = isAssigned;

          return (
            <div
              key={route.routeId}
              className="relative z-10 flex items-center group"
              aria-label={`${isAssigned ? assignedRoute.routeName : route.routeName}: ${isAssigned ? assignedRoute.routeSubtitle : route.routeSubtitle}${isAssigned ? ' (assigned by server)' : ' (not assigned)'}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Circular Ancient Compass Seal Medallion */}
              <div
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_3px_10px_rgba(70,45,15,0.3)] ${
                  isActive
                    ? 'scale-110 ring-2 ring-[#ffd866] shadow-[0_0_16px_rgba(255,215,0,0.8)]'
                    : isCompleted
                    ? 'ring-1 ring-[#10b981] hover:scale-105'
                    : isUnlocked
                    ? 'hover:scale-105 ring-1 ring-[#b8974a]/50'
                    : 'opacity-50 cursor-not-allowed filter grayscale-[0.3]'
                }`}
              >
                {/* Outer Beveled Metallic Medallion Ring */}
                <svg viewBox="0 0 36 36" className="w-full h-full pointer-events-none">
                  <defs>
                    <radialGradient id={`routeMedGrad_${route.routeId}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={isActive ? '#3d2b17' : '#271c11'} />
                      <stop offset="100%" stopColor={isActive ? '#1d130a' : '#140c06'} />
                    </radialGradient>
                    <linearGradient id={`routeGoldRing_${route.routeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={isActive ? '#fff2a8' : '#e6ca7b'} />
                      <stop offset="50%" stopColor={isActive ? '#ffd866' : '#d4af37'} />
                      <stop offset="100%" stopColor={isActive ? '#b8860b' : '#8c6517'} />
                    </linearGradient>
                  </defs>

                  {/* Inner Disc */}
                  <circle cx="18" cy="18" r="16" fill={`url(#routeMedGrad_${route.routeId})`} />
                  {/* Outer Gold Border */}
                  <circle cx="18" cy="18" r="16" fill="none" stroke={`url(#routeGoldRing_${route.routeId})`} strokeWidth="1.8" />
                  {/* Inset Compass Notches */}
                  <circle cx="18" cy="18" r="13.5" fill="none" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.6" />

                  {/* Center Symbol */}
                  {isCompleted ? (
                    // Completed Checkmark
                    <path
                      d="M 12,18 L 16,22 L 24,14"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    // Ancient 8-Point Compass Star
                    <path
                      d="M 18,7 L 19.5,15 L 27,15 L 21,19 L 23.5,27 L 18,22 L 12.5,27 L 15,19 L 9,15 L 16.5,15 Z"
                      fill={isActive ? '#ffd866' : '#c9a24d'}
                      stroke={isActive ? '#fff' : '#8a651a'}
                      strokeWidth="0.5"
                    />
                  )}
                </svg>
              </div>

              {/* Extended Route Label Cartouche */}
              <div
                className={`ml-2.5 transition-all duration-200 select-none ${
                  isActive
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`}
              >
                <div
                  className={`px-2.5 py-0.5 rounded border text-left shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ffd866] via-[#f5c742] to-[#dfa828] border-[#fff2a8] text-[#331e05] font-bold shadow-[0_2px_8px_rgba(212,175,55,0.4)]'
                      : isCompleted
                      ? 'bg-[#1e140a]/80 border-[#10b981]/50 text-[#86efac]'
                      : isUnlocked
                      ? 'bg-[#271a0e]/75 border-[#b8974a]/40 text-[#f5ebd7]'
                      : 'bg-[#1a120b]/60 border-[#57432b]/30 text-[#8a7660]'
                  }`}
                >
                  <span className="font-cinzel text-[11px] sm:text-xs tracking-[0.16em] uppercase whitespace-nowrap">
                    {(isAssigned ? assignedRoute.routeName : route.routeName).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Decorative Gold Compass Filigree */}
      <div className="relative mt-2 text-[#d4af37] opacity-80" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M 12,7 L 13.5,13 L 19.5,14.5 L 13.5,16 L 12,22 L 10.5,16 L 4.5,14.5 L 10.5,13 Z" fill="#ffd866" stroke="#b8974a" strokeWidth="0.8" />
        </svg>
      </div>
    </nav>
  );
};

