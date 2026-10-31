import { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';

// Desktop camera: live preview from getUserMedia, then one frame as a JPEG.
export default function WebcamCapture({ onCapture, onClose }) {
  const video = useRef(null);
  const [state, setState] = useState('starting'); // starting | live | error

  useEffect(() => {
    let stream;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((track) => track.stop());
        stream = s;
        video.current.srcObject = s;
        setState('live');
      })
      .catch(() => !cancelled && setState('error'));
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function capture() {
    const v = video.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/jpeg', 0.9);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a room photo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-hairline bg-surface shadow-overlay">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h3 className="text-sm font-bold text-ink">Take a room photo</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-subtle hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="relative aspect-video bg-ink">
          <video ref={video} autoPlay playsInline muted className="size-full object-contain" />
          {state === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-white" />
            </div>
          )}
          {state === 'error' && (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs leading-relaxed text-white">
              The camera is blocked or unavailable. Allow camera access in your browser, or upload a photo instead.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hairline px-3 py-2 text-xs font-semibold text-slate hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={state !== 'live'}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-deep disabled:opacity-40"
          >
            <Camera className="size-3.5" /> Capture
          </button>
        </div>
      </div>
    </div>
  );
}
