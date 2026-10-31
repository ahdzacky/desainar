import { useEffect, useState } from 'react';
import { Camera, ImageIcon, ImageUp, LoaderCircle, RefreshCw, ScanEye, Sparkles, WandSparkles } from 'lucide-react';
import { ROOM_TYPES, findRoom } from '../data/options.js';
import { useCameraMode } from '../lib/camera.js';
import { loadRender } from '../lib/render.js';
import WebcamCapture from './WebcamCapture.jsx';

const TABS = [
  { id: 'orig', label: 'Original', icon: ImageIcon },
  { id: 'analysis', label: 'Analysis', icon: ScanEye },
  { id: 'render', label: 'AI Design', icon: WandSparkles },
];

const STAGES = [
  'Identifying the room type…',
  'Mapping empty zones & light…',
  'Reading the 60-30-10 palette…',
  'Picking furniture from the 3D catalog…',
  'Writing the design critique…',
];

// Tailwind only ships class names it can see, so zone colours are spelled out.
const ZONE_STYLES = [
  { box: 'border-primary bg-primary/15', tag: 'bg-primary' },
  { box: 'border-secondary bg-secondary/15', tag: 'bg-secondary' },
  { box: 'border-primary-deep bg-primary-deep/15', tag: 'bg-primary-deep' },
];

const BUTTON_BASE = 'flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition';
const BUTTON_STYLES = {
  primary: 'bg-primary text-white hover:bg-primary-deep px-3 py-2.5',
  secondary: 'border border-hairline bg-surface text-slate hover:border-primary hover:text-primary px-3 py-2.5',
  floating: 'border border-hairline bg-surface/95 text-ink shadow-overlay backdrop-blur-md hover:text-primary px-3 py-1.5',
};

// Phones: the native camera app. Desktops: the webcam dialog, disabled when there is no camera.
function CameraButton({ mode, onFile, onOpenWebcam, variant = 'primary' }) {
  if (mode === 'native') return <PhotoButton capture icon={Camera} label="Camera" onFile={onFile} variant={variant} />;
  const disabled = mode !== 'webcam';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpenWebcam}
      title={disabled ? 'No camera found on this device' : 'Take a photo with your camera'}
      className={`${BUTTON_BASE} ${BUTTON_STYLES[variant]} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <Camera className={`size-3.5 ${variant === 'floating' ? 'text-primary' : ''}`} />
      Camera
    </button>
  );
}

function PhotoButton({ capture, icon: Icon, label, onFile, variant = 'secondary' }) {
  return (
    <label className={`${BUTTON_BASE} cursor-pointer ${BUTTON_STYLES[variant]}`}>
      <Icon className={`size-3.5 ${variant === 'floating' ? 'text-primary' : ''}`} />
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function AnalysisOverlay({ annotations, currentWall, paint }) {
  let zone = 0;
  return (
    <>
      <div className="blueprint absolute inset-0" />
      {annotations.map((a, i) => {
        const pos = { left: `${a.x_percent}%`, top: `${a.y_percent}%` };
        if (a.type === 'placement_zone') {
          const style = ZONE_STYLES[zone % ZONE_STYLES.length];
          // Labels sit inside their own box, alternating corners, so neighbouring zones never overlap.
          const corner = zone++ % 2 === 0 ? 'top-1 left-1' : 'right-1 bottom-1';
          return (
            <div
              key={i}
              style={{ ...pos, width: `${a.w_percent}%`, height: `${a.h_percent}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed ${style.box}`}
            >
              <span
                className={`absolute max-w-[calc(100%-0.5rem)] truncate rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-overlay ${corner} ${style.tag}`}
              >
                {a.label}
              </span>
            </div>
          );
        }
        if (a.type === 'light_source') {
          return (
            <div
              key={i}
              style={pos}
              className="absolute max-w-[45%] -translate-x-1/2 -translate-y-1/2 truncate rounded-sm border border-chip-border bg-chip px-2 py-1 text-[10px] font-semibold text-secondary shadow-overlay"
            >
              ☀️ {a.label}
            </div>
          );
        }
        return (
          <div
            key={i}
            style={pos}
            className="absolute flex max-w-[60%] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-hairline bg-surface/95 px-2.5 py-1.5 text-[10px] shadow-overlay"
          >
            <span className="flex shrink-0">
              <span className="size-3 rounded-full border border-hairline" style={{ background: currentWall.hex }} />
              {paint && <span className="-ml-1 size-3 rounded-full border border-white" style={{ background: paint.hex }} />}
            </span>
            <span className="line-clamp-2 font-bold text-primary">{a.label}</span>
          </div>
        );
      })}
    </>
  );
}

export default function VisualPanel({ photo, result, loading, styleName, roomType, paint, onRoomChange, onFile, onDemo }) {
  const [tab, setTab] = useState('analysis');
  const [variant, setVariant] = useState(0);
  const [render, setRender] = useState({ status: 'idle', src: '' });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!result) return;
    setTab('analysis');
    setVariant(0);
  }, [result]);

  // Start the render as soon as the analysis lands, so the tab is usually ready.
  useEffect(() => {
    if (!result) return;
    // The demo result ships a pre-rendered image for its first variant.
    if (variant === 0 && result.demo_render) {
      setRender({ status: 'done', src: result.demo_render });
      return;
    }
    const controller = new AbortController();
    let blobUrl = '';
    setRender({ status: 'loading', src: '' });
    loadRender(result.design_render_prompt, photo, variant, controller.signal)
      .then((src) => {
        blobUrl = src;
        setRender({ status: 'done', src });
      })
      .catch(() => {
        if (!controller.signal.aborted) setRender({ status: 'error', src: '' });
      });
    return () => {
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [result, photo, variant]);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const timer = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(timer);
  }, [loading]);

  const cameraMode = useCameraMode();
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  // A photo dropped next to the drop zone would make the browser open it and lose the session.
  useEffect(() => {
    const keep = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files') && e.preventDefault();
    window.addEventListener('dragover', keep);
    window.addEventListener('drop', keep);
    return () => {
      window.removeEventListener('dragover', keep);
      window.removeEventListener('drop', keep);
    };
  }, []);

  const dropZone = {
    onDragOver: (e) => {
      if (loading || ![...e.dataTransfer.types].includes('Files')) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      if (loading) return;
      const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
      if (file) onFile(file);
    },
  };

  const webcam = webcamOpen && (
    <WebcamCapture
      onClose={() => setWebcamOpen(false)}
      onCapture={(blob) => {
        setWebcamOpen(false);
        onFile(blob);
      }}
    />
  );

  if (!photo) {
    return (
      <section
        {...dropZone}
        className={`rounded-xl border border-dashed p-6 text-center transition ${
          dragging ? 'border-primary bg-primary-soft ring-2 ring-primary/15' : 'border-primary/30 bg-surface'
        }`}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary-soft">
          {dragging ? <ImageUp className="size-6 text-primary" /> : <Camera className="size-6 text-primary" />}
        </div>
        <h2 className="mt-3 text-sm font-bold text-ink">{dragging ? 'Drop your room photo' : '2. Snap your room'}</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
          Gemma 4 identifies the room, maps the empty zones, reads the wall colours, then picks 3D furniture you can place in your
          room with AR.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <CameraButton mode={cameraMode} onFile={onFile} onOpenWebcam={() => setWebcamOpen(true)} />
          <PhotoButton icon={ImageUp} label="Upload" onFile={onFile} />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          {cameraMode === 'none' ? 'No camera found. Upload or drag & drop a photo here.' : 'or drag & drop a photo here'}
        </p>
        <button type="button" onClick={onDemo} className="mt-3 text-xs font-semibold text-primary underline-offset-4 hover:underline">
          Try the sample photo
        </button>
        {webcam}
      </section>
    );
  }

  const view = result && !loading ? tab : 'orig';
  const room = findRoom(result?.room_identification.room_type ?? roomType);
  const captions = {
    orig: '📷 Room photo (Before)',
    analysis: '📐 Gemma 4 spatial map',
    render: '✨ Design concept (After)',
  };

  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-hover">
      <div className="grid grid-cols-3 gap-1 border-b border-hairline bg-subtle p-1.5 text-[11px]">
        {TABS.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            type="button"
            disabled={!result || loading}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 transition disabled:opacity-40 ${
              view === id ? 'bg-primary font-bold text-white shadow-hover' : 'font-medium text-muted hover:text-ink'
            }`}
          >
            <Icon className="size-3.5" />
            <span>
              {i + 1}. {label}
            </span>
          </button>
        ))}
      </div>

      <div {...dropZone} className="relative bg-subtle">
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary bg-primary-soft/90">
            <ImageUp className="size-7 text-primary" />
            <p className="text-xs font-bold text-primary">Drop to analyse a new photo</p>
          </div>
        )}
        {view === 'render' ? (
          <div className="relative" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
            {render.status === 'done' ? (
              <img src={render.src} alt="AI interior design concept" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                {render.status === 'error' ? (
                  <p className="text-xs leading-relaxed text-error-ink">
                    The free render service is busy (limit: 1 image per 45 seconds). Wait a moment, then tap “New variation”.
                  </p>
                ) : (
                  <>
                    <LoaderCircle className="size-7 animate-spin text-primary" />
                    <p className="text-xs font-semibold text-ink">Painting the design concept… (10–30 s)</p>
                  </>
                )}
              </div>
            )}
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-sm bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-overlay">
              <Sparkles className="size-3" /> DESAINAR Concept (After)
            </span>
            <button
              type="button"
              onClick={() => setVariant((v) => v + 1)}
              className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md border border-hairline bg-surface/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-overlay backdrop-blur-md hover:border-primary"
            >
              <RefreshCw className="size-3" /> New variation
            </button>
          </div>
        ) : (
          <div className="relative">
            <img src={photo.dataUrl} alt="Room photo" className={`block w-full ${view === 'analysis' ? 'brightness-90' : ''}`} />
            {view === 'analysis' && (
              <AnalysisOverlay
                annotations={result.spatial_annotations}
                currentWall={result.color_and_wall_analysis.current_wall}
                paint={paint}
              />
            )}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/75 backdrop-blur-[2px]">
                <LoaderCircle className="size-7 animate-spin text-primary" />
                <p className="text-xs font-semibold text-ink">{STAGES[stage]}</p>
                <p className="text-[10px] text-muted">Gemma 4 is analysing your photo (~20 s)</p>
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="absolute top-3 right-3 z-20 flex gap-1.5">
            <CameraButton mode={cameraMode} onFile={onFile} onOpenWebcam={() => setWebcamOpen(true)} variant="floating" />
            <PhotoButton icon={ImageUp} label="Upload" onFile={onFile} variant="floating" />
          </div>
        )}
        {webcam}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-hairline px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {room && (
            <span className="rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">{room.label}</span>
          )}
          <span className="rounded-sm border border-hairline bg-subtle px-2 py-0.5 text-[10px] text-slate">
            Style: <strong className="text-primary">{styleName}</strong>
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-medium text-secondary">{captions[view]}</span>
      </div>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-hairline bg-subtle p-3 text-[11px]">
        <span className="mr-1 shrink-0 text-muted">Room:</span>
        {ROOM_TYPES.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={loading}
            onClick={() => onRoomChange(r.id)}
            className={`shrink-0 rounded-sm border px-2.5 py-1 transition disabled:opacity-50 ${
              room?.id === r.id
                ? 'border-primary bg-primary-soft font-semibold text-primary'
                : 'border-hairline bg-surface font-medium text-slate hover:border-primary/50'
            }`}
          >
            {r.emoji} {r.label}
          </button>
        ))}
      </div>
    </section>
  );
}
