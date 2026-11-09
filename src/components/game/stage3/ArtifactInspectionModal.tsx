import React, { useState } from 'react';
import { soundController } from '../../../utils/soundController';
import { ScrollGraphic, CompassGraphic, LetterGraphic, KeyGraphic, SkullGraphic, RibcageGraphic } from './CoffinGraphics';

export type ArtifactType = 'scroll' | 'compass' | 'parchment' | 'key' | 'skull' | 'ribcage';

interface ArtifactInspectionModalProps {
  isOpen: boolean;
  artifactType: ArtifactType | null;
  onClose: () => void;
}

export const ArtifactInspectionModal: React.FC<ArtifactInspectionModalProps> = ({
  isOpen,
  artifactType,
  onClose,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen || !artifactType) return null;

  const handleRotate = () => {
    soundController.playClick();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    soundController.playClick();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="document"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#24130a] via-[#140803] to-[#0a0301] border-2 border-amber-600/70 p-5 sm:p-7 text-stone-100 shadow-[0_0_80px_rgba(245,158,11,0.4)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-3 mb-4">
          <div>
            <div className="text-[10px] font-cinzel font-bold text-amber-400 tracking-widest uppercase">
              EVIDENCE ARTIFACT INSPECTION
            </div>
            <h2
              id="artifact-modal-title"
              className="text-base sm:text-xl font-cinzel font-black text-amber-100 tracking-wide"
            >
              {artifactType === 'scroll' && 'ROLLED PAPYRUS SCROLL'}
              {artifactType === 'compass' && 'ANTIQUE COMPASS MEDALLION'}
              {artifactType === 'parchment' && 'TORN WARDEN’S DISPATCH'}
              {artifactType === 'key' && 'ANCIENT BRASS SKELETON KEY'}
              {artifactType === 'skull' && 'ANCIENT CRANIUM OF THE FIRST WARDEN'}
              {artifactType === 'ribcage' && 'THORACIC RIBCAGE WITH SUN MEDALLION'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inspector"
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Visual Showcase Center */}
        <div className="flex flex-col items-center justify-center p-6 my-2 rounded-2xl bg-[#0d0603]/80 border border-amber-900/50 shadow-inner">
          <div
            style={{
              transform: `rotate(${rotation}deg) scale(${isFlipped ? -1 : 1}, 1)`,
              transition: 'transform 0.4s ease-out',
            }}
            className="flex items-center justify-center filter drop-shadow-[0_10px_25px_rgba(245,158,11,0.4)]"
          >
            {artifactType === 'scroll' && <ScrollGraphic className="w-40 h-20 sm:w-48 sm:h-24" />}
            {artifactType === 'compass' && <CompassGraphic className="w-32 h-32 sm:w-36 sm:h-36" />}
            {artifactType === 'parchment' && <LetterGraphic className="w-36 h-28 sm:w-40 sm:h-32" />}
            {artifactType === 'key' && <KeyGraphic className="w-36 h-20 sm:w-44 sm:h-24" />}
            {artifactType === 'skull' && <SkullGraphic romanNumeral="I" className="w-32 h-36 sm:w-36 sm:h-40" />}
            {artifactType === 'ribcage' && <RibcageGraphic className="w-36 h-40 sm:w-40 sm:h-44" />}
          </div>

          {/* Interactive Inspection Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-cinzel font-bold tracking-wider cursor-pointer transition-colors"
            >
              ↻ Rotate 90°
            </button>
            <button
              type="button"
              onClick={handleFlip}
              className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-cinzel font-bold tracking-wider cursor-pointer transition-colors"
            >
              ⇄ Flip Side
            </button>
          </div>
        </div>

        {/* Lore Description */}
        <div className="p-4 rounded-xl bg-black/40 border border-amber-900/30 text-stone-300 text-xs font-serif italic leading-relaxed">
          {artifactType === 'scroll' && (
            <p>
              &ldquo;An ancient papyrus roll bound in stained crimson silk. Unfurling it reveals a sacred Triquetra symbol and charred Latin script: &lsquo;Sub terra veritas manet&rsquo; — Beneath the earth, truth remains.&rdquo;
            </p>
          )}
          {artifactType === 'compass' && (
            <p>
              &ldquo;Heavy patinated brass dial exhumed beside the chest. The cardinal points are etched with gothic marks, and the magnetic needle trembles faintly toward the North, pointing directly to the year 1891.&rdquo;
            </p>
          )}
          {artifactType === 'parchment' && (
            <p>
              &ldquo;A folded fragment of linen parchment. Faded iron gall ink notes: &lsquo;Let none claim the prize who cannot speak the name of fire extinguished. The sleeper holds the key beneath his bound limb.&rsquo;&rdquo;
            </p>
          )}
          {artifactType === 'key' && (
            <p>
              &ldquo;Ornate skeletal key of heavy cold brass, featuring four-petal bow filigree and intricate warding teeth. It vibrates with ancient potential, awaiting the emergence of the locked chest.&rdquo;
            </p>
          )}
          {artifactType === 'skull' && (
            <p>
              &ldquo;The aged cranium of the First Warden, etched with the crimson Roman numeral &lsquo;I&rsquo;. The bone is cold to the touch, guarding the memories of the Cartel’s founding ritual.&rdquo;
            </p>
          )}
          {artifactType === 'ribcage' && (
            <p>
              &ldquo;An anatomical ribcage cradling a polished solar medallion. The rays of the medallion point outward in twelve directions, representing the twelve lost sentinels.&rdquo;
            </p>
          )}
        </div>

        {/* Bottom Close */}
        <div className="flex justify-end pt-3 border-t border-amber-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 border border-amber-400 text-stone-950 font-cinzel text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
          >
            Return to Investigation ✕
          </button>
        </div>
      </div>
    </div>
  );
};
