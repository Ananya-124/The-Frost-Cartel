import React from 'react';
import { soundController } from '../../../utils/soundController';

interface NextFloorModalProps {
  isOpen: boolean;
  nextFloorName: string;
  nextFloorId: string;
  onProceed: () => void;
  isMuted?: boolean;
}

export const NextFloorModal: React.FC<NextFloorModalProps> = ({
  isOpen,
  nextFloorName,
  nextFloorId,
  onProceed,
  isMuted = false,
}) => {
  if (!isOpen) return null;

  const handleProceed = () => {
    if (!isMuted) {
      soundController.playPortalWhoosh();
    }
    onProceed();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="passage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      {/* Ancient Relic Gilded Cartouche Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#24170d] via-[#1a1109] to-[#0d0703] border-2 border-[#d4af37] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.25)] text-center overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ffd866] to-transparent pointer-events-none" />

        {/* Ornate Ancient Seal Crest */}
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-[#3d2a14] to-[#120b06] border-2 border-[#d4af37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <span className="text-2xl" aria-hidden="true">🗝️</span>
        </div>

        {/* Heading */}
        <h2
          id="passage-modal-title"
          className="font-cinzel text-lg sm:text-xl font-black tracking-[0.22em] text-[#ffd866] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] mb-2"
        >
          A NEW PASSAGE HAS BEEN REVEALED
        </h2>

        {/* Decorative Divider */}
        <div className="relative flex items-center justify-center py-2 my-2">
          <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
          <span className="absolute px-2 bg-[#1a1109] text-[#ffd866] text-xs">✦</span>
        </div>

        {/* Message */}
        <p className="font-serif italic text-sm sm:text-base text-[#e5d5b8] mb-6 leading-relaxed">
          &ldquo;The seal has yielded. Your next destination awaits.&rdquo;
        </p>

        {/* Next Destination Card */}
        <div className="p-4 rounded-xl bg-[#2e1d0f]/90 border border-[#b8974a]/60 mb-6 shadow-inner">
          <span className="font-cinzel text-[11px] font-bold tracking-[0.25em] text-[#ffd866]/80 uppercase block mb-1">
            NEXT DESTINATION • {nextFloorId.toUpperCase()}
          </span>
          <span className="font-cinzel text-base sm:text-lg font-black tracking-wide text-white block drop-shadow-md">
            {nextFloorName.toUpperCase()}
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd866] to-[#d4af37] hover:from-[#e5c158] hover:to-[#e5c158] text-[#1c1208] font-cinzel text-sm sm:text-base font-black tracking-[0.25em] shadow-[0_6px_20px_rgba(212,175,55,0.4)] border border-[#fff2b2] uppercase cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          GO TO NEXT FLOOR
        </button>
      </div>
    </div>
  );
};

