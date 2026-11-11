import React, { useState, useEffect, useRef } from 'react';
import { soundController } from '../../../utils/soundController';
import { round4Service } from '../../../services/round4Service';

interface QRScannerModalProps {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onScanSuccess: (validationWord: string) => void;
  isMuted?: boolean;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  teamId,
  onClose,
  onScanSuccess,
  isMuted = false,
}) => {
  const [manualToken, setManualToken] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);

  // Initialize camera and BarcodeDetector
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setErrorMessage(null);
      setManualToken('');
      return;
    }

    let isSubscribed = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraActive(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);

        // Check for BarcodeDetector support
        if ('BarcodeDetector' in window) {
          const BD = (window as any).BarcodeDetector;
          detectorRef.current = new BD({ formats: ['qr_code'] });
          scanVideoFrames();
        }
      } catch (err) {
        console.warn('[QRScannerModal] Camera not accessible:', err);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      isSubscribed = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanVideoFrames = async () => {
    if (!detectorRef.current || !videoRef.current || !streamRef.current) return;

    try {
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            handleVerifyToken(rawValue);
            return;
          }
        }
      }
    } catch {
      // Frame detection dropped
    }

    if (streamRef.current) {
      requestAnimationFrame(scanVideoFrames);
    }
  };

  const handleVerifyToken = async (tokenToVerify: string) => {
    const clean = tokenToVerify.trim();
    if (!clean || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    const result = await round4Service.scanQrToken(teamId, clean);
    setIsVerifying(false);

    if (result.success && result.valid && result.validationWord) {
      if (!isMuted) {
        soundController.playVictory();
      }
      stopCamera();
      onScanSuccess(result.validationWord);
      onClose();
    } else {
      if (!isMuted) {
        soundController.playError();
      }
      setErrorMessage(result.message || 'Invalid physical checkpoint QR.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#24170d] via-[#1a1109] to-[#0d0703] border-2 border-[#d4af37] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#ffd866] hover:text-white text-xl cursor-pointer"
          aria-label="Close Scanner"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-[#3d2a14] to-[#120b06] border border-[#d4af37] flex items-center justify-center shadow-md">
          <span className="text-xl" aria-hidden="true">📷</span>
        </div>
        <h2
          id="qr-modal-title"
          className="font-cinzel text-base sm:text-lg font-bold tracking-[0.2em] text-[#ffd866] uppercase mb-1"
        >
          PHYSICAL QR CHECKPOINT
        </h2>
        <p className="font-serif italic text-xs text-[#d8c29e] mb-4">
          Scan the physical checkpoint marker at the designated location or enter its code.
        </p>

        {/* Camera Viewfinder */}
        <div className="relative w-full aspect-video rounded-xl bg-black/60 border border-[#b8974a]/50 overflow-hidden mb-4 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          {!cameraActive && (
            <div className="p-4 text-center">
              <span className="text-2xl mb-1 block">🔍</span>
              <p className="font-sans text-xs text-[#d8c29e]/80">
                Camera feed inactive or unavailable on desktop. Use manual token entry below.
              </p>
            </div>
          )}

          {/* Target Reticle Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-[#ffd866]/80 rounded-lg shadow-[0_0_15px_rgba(255,216,102,0.4)] animate-pulse" />
            </div>
          )}
        </div>

        {/* Manual Token Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyToken(manualToken);
          }}
          className="space-y-3"
        >
          <div className="relative">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={isVerifying}
              placeholder="ENTER PHYSICAL QR TOKEN (e.g. fc_qr_...)"
              aria-label="Enter Physical QR Token"
              className="w-full px-4 py-2.5 rounded-lg bg-[#2e1d0f] border border-[#b8974a]/60 text-white font-mono text-xs tracking-wider placeholder:text-[#947650] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-center"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || !manualToken.trim()}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#ffd866] hover:from-[#e5c158] hover:to-[#e5c158] text-[#1c1208] font-cinzel text-xs font-bold tracking-[0.2em] shadow-md uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isVerifying ? 'VERIFYING CHECKPOINT...' : 'VERIFY CHECKPOINT'}
          </button>
        </form>

        {/* Error Feedback */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-3 p-2.5 rounded bg-red-950/50 border border-red-500/60 text-red-200 text-xs font-serif leading-snug"
          >
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

