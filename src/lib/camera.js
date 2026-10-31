import { useEffect, useRef, useState } from 'react';

// Phones and tablets get the native camera app through <input capture>.
export const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

// enumerateDevices lists device kinds before the user grants camera access.
async function hasVideoInput() {
  if (!navigator.mediaDevices?.enumerateDevices) return false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((d) => d.kind === 'videoinput');
  } catch {
    return false;
  }
}

// 'native' on touch devices, 'webcam' on a desktop with a camera, 'none' without one, null while checking.
export function useCameraMode() {
  const [mode, setMode] = useState(() => (isTouchDevice() ? 'native' : null));

  useEffect(() => {
    if (isTouchDevice()) return;
    let alive = true;
    const check = () => hasVideoInput().then((found) => alive && setMode(found ? 'webcam' : 'none'));
    check();
    navigator.mediaDevices?.addEventListener?.('devicechange', check);
    return () => {
      alive = false;
      navigator.mediaDevices?.removeEventListener?.('devicechange', check);
    };
  }, []);

  return mode;
}

// Drag & drop a photo onto an element. The depth counter stops the highlight
// flickering when the pointer moves over child elements.
export function useFileDrop(onFile, enabled = true) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');

  useEffect(() => {
    if (!enabled) {
      depth.current = 0;
      setDragging(false);
    }
  }, [enabled]);

  if (!enabled) return { dragging: false, dropProps: {} };
  return {
    dragging,
    dropProps: {
      onDragEnter: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      },
      onDragOver: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      },
      onDragLeave: (e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      },
      onDrop: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        const files = [...e.dataTransfer.files];
        onFile(files.find((f) => f.type.startsWith('image/')) ?? files[0]);
      },
    },
  };
}
