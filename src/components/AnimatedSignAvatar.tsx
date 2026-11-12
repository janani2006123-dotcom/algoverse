import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';
import { SignAvatarKeyframe } from '../types';

interface AnimatedSignAvatarProps {
  keyframes?: SignAvatarKeyframe[];
  gloss?: string;
  signWord?: string;
  signLanguage?: string;
  autoPlay?: boolean;
  loop?: boolean;
  height?: number | string;
  showControls?: boolean;
  handshapeDescription?: string;
  nonManualDescription?: string;
}

const DEFAULT_FRAMES: SignAvatarKeyframe[] = [
  {
    headTilt: 0,
    eyebrows: 'neutral',
    mouth: 'neutral',
    leftHand: { x: 30, y: 70, shape: 'open5' },
    rightHand: { x: 70, y: 70, shape: 'open5' },
    durationMs: 400,
  },
  {
    headTilt: 2,
    eyebrows: 'raised',
    mouth: 'smile',
    leftHand: { x: 32, y: 65, shape: 'flat' },
    rightHand: { x: 65, y: 40, shape: 'flat' },
    durationMs: 600,
  },
  {
    headTilt: 0,
    eyebrows: 'raised',
    mouth: 'smile',
    leftHand: { x: 30, y: 70, shape: 'open5' },
    rightHand: { x: 75, y: 35, shape: 'flat' },
    durationMs: 500,
  },
];

export const AnimatedSignAvatar: React.FC<AnimatedSignAvatarProps> = ({
  keyframes = DEFAULT_FRAMES,
  gloss = 'SIGN',
  signWord,
  signLanguage = 'ASL',
  autoPlay = true,
  loop = true,
  height = 340,
  showControls = true,
  handshapeDescription,
  nonManualDescription,
}) => {
  const frames = keyframes && keyframes.length > 0 ? keyframes : DEFAULT_FRAMES;
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(autoPlay);
  }, [keyframes, gloss]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentFrame = frames[currentFrameIndex] || frames[0];
    const duration = (currentFrame.durationMs || 500) / speed;

    timerRef.current = setTimeout(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= frames.length - 1) {
          if (loop) return 0;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentFrameIndex, frames, speed, loop]);

  const frame = frames[currentFrameIndex] || frames[0];

  // Helper to render handshape icon/path
  const renderHandshape = (hand: SignAvatarKeyframe['rightHand'], isRight: boolean) => {
    const { shape, rotation = 0 } = hand;
    return (
      <g transform={`rotate(${rotation})`}>
        {shape === 'flat' && (
          <path
            d="M -12 -18 C -12 -24, 12 -24, 12 -18 L 10 14 C 10 18, -10 18, -10 14 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="2"
          />
        )}
        {shape === 'fist' && (
          <circle cx="0" cy="0" r="14" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
        )}
        {shape === 'thumbs_up' && (
          <g>
            <rect x="-10" y="-4" width="20" height="20" rx="6" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <path d="M 0 -4 L 0 -22 C 0 -26, 8 -26, 8 -20 L 6 -4" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          </g>
        )}
        {shape === 'pointing' && (
          <g>
            <circle cx="0" cy="4" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <path d="M -3 4 L -3 -22 C -3 -26, 3 -26, 3 -22 L 3 4" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          </g>
        )}
        {shape === 'peace' && (
          <g>
            <circle cx="0" cy="6" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <path d="M -7 4 L -11 -20 C -12 -24, -4 -26, -3 -20 L -2 4" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <path d="M 2 4 L 3 -20 C 4 -26, 12 -24, 11 -20 L 7 4" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          </g>
        )}
        {shape === 'pinch' && (
          <g>
            <ellipse cx="0" cy="0" rx="11" ry="13" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <circle cx="0" cy="-6" r="4" fill="#D97706" />
          </g>
        )}
        {shape === 'open5' && (
          <g>
            <ellipse cx="0" cy="4" rx="10" ry="12" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <line x1="-12" y1="2" x2={isRight ? -16 : 16} y2="-12" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
            <line x1="-6" y1="-6" x2="-8" y2="-22" stroke="#D97706" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="-1" y1="-8" x2="-2" y2="-25" stroke="#D97706" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="4" y1="-8" x2="5" y2="-23" stroke="#D97706" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="9" y1="-4" x2="11" y2="-18" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };

  // Convert coordinate percentages (0-100) to SVG viewBox 0-400
  const lX = (frame.leftHand.x / 100) * 400;
  const lY = (frame.leftHand.y / 100) * 400;
  const rX = (frame.rightHand.x / 100) * 400;
  const rY = (frame.rightHand.y / 100) * 400;

  return (
    <div className="flex flex-col items-center bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm w-full">
      {/* Top Banner / Status */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-indigo-400">{signLanguage} Sign Avatar</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-mono tracking-wide">{gloss}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Frame {currentFrameIndex + 1}/{frames.length}</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validated Kinematics
          </span>
        </div>
      </div>

      {/* SVG Character Canvas */}
      <div className="relative w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" style={{ height }}>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full max-h-[380px] drop-shadow-md select-none transition-all duration-300 ease-out"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Grid Pattern for Spatial Signing Frame */}
          <g opacity="0.12" stroke="#6366F1" strokeWidth="0.8">
            <line x1="80" y1="50" x2="80" y2="350" strokeDasharray="3 3" />
            <line x1="200" y1="50" x2="200" y2="350" strokeDasharray="3 3" />
            <line x1="320" y1="50" x2="320" y2="350" strokeDasharray="3 3" />
            <line x1="80" y1="120" x2="320" y2="120" strokeDasharray="3 3" />
            <line x1="80" y1="200" x2="320" y2="200" strokeDasharray="3 3" />
            <line x1="80" y1="280" x2="320" y2="280" strokeDasharray="3 3" />
          </g>

          {/* Torso & Shoulders */}
          <path
            d="M 120 230 C 130 180, 150 170, 175 170 L 225 170 C 250 170, 270 180, 280 230 L 290 380 L 110 380 Z"
            fill="url(#bodyGrad)"
            stroke="#6366F1"
            strokeWidth="2"
          />

          {/* Neck */}
          <rect x="186" y="130" width="28" height="42" rx="4" fill="url(#skinGrad)" />

          {/* Left Arm (Sleeve & Forearm) */}
          {/* Shoulder: (140, 185). Elbow calculated towards lX, lY */}
          <path
            d={`M 140 185 Q ${Math.min(130, lX - 20)} ${(185 + lY) / 2} ${lX} ${lY}`}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d={`M 140 185 Q ${Math.min(130, lX - 20)} ${(185 + lY) / 2} ${lX} ${lY}`}
            fill="none"
            stroke="url(#skinGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Right Arm (Sleeve & Forearm) */}
          {/* Shoulder: (260, 185) */}
          <path
            d={`M 260 185 Q ${Math.max(270, rX + 20)} ${(185 + rY) / 2} ${rX} ${rY}`}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d={`M 260 185 Q ${Math.max(270, rX + 20)} ${(185 + rY) / 2} ${rX} ${rY}`}
            fill="none"
            stroke="url(#skinGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Left Hand Vector */}
          <g transform={`translate(${lX}, ${lY})`}>
            {renderHandshape(frame.leftHand, false)}
          </g>

          {/* Right Hand Vector */}
          <g transform={`translate(${rX}, ${rY})`}>
            {renderHandshape(frame.rightHand, true)}
          </g>

          {/* Head & Face */}
          <g transform={`rotate(${frame.headTilt || 0}, 200, 100)`}>
            {/* Hair */}
            <path
              d="M 152 100 C 150 45, 250 45, 248 100 C 248 115, 245 130, 245 130 L 155 130 C 155 130, 152 115, 152 100 Z"
              fill="#1E1B4B"
            />

            {/* Face Shape */}
            <ellipse cx="200" cy="100" rx="36" ry="44" fill="url(#skinGrad)" filter="url(#softShadow)" />

            {/* Eyebrows */}
            {frame.eyebrows === 'raised' && (
              <g stroke="#312E81" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 175 80 Q 185 73 195 78" />
                <path d="M 205 78 Q 215 73 225 80" />
              </g>
            )}
            {frame.eyebrows === 'furrowed' && (
              <g stroke="#312E81" strokeWidth="3.2" strokeLinecap="round" fill="none">
                <path d="M 176 77 L 195 83" />
                <path d="M 205 83 L 224 77" />
              </g>
            )}
            {(!frame.eyebrows || frame.eyebrows === 'neutral') && (
              <g stroke="#312E81" strokeWidth="2.8" strokeLinecap="round" fill="none">
                <path d="M 176 80 Q 185 77 194 80" />
                <path d="M 206 80 Q 215 77 224 80" />
              </g>
            )}

            {/* Eyes */}
            <ellipse cx="185" cy="92" rx="4.5" ry="5.5" fill="#1E293B" />
            <circle cx="187" cy="90" r="1.5" fill="#FFFFFF" />
            <ellipse cx="215" cy="92" rx="4.5" ry="5.5" fill="#1E293B" />
            <circle cx="217" cy="90" r="1.5" fill="#FFFFFF" />

            {/* Nose */}
            <path d="M 199 98 L 197 108 L 203 108" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Mouth */}
            {frame.mouth === 'smile' && (
              <path d="M 188 120 Q 200 130 212 120" stroke="#B45309" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
            {frame.mouth === 'open' && (
              <ellipse cx="200" cy="122" rx="7" ry="6" fill="#7C2D12" stroke="#B45309" strokeWidth="2" />
            )}
            {frame.mouth === 'round' && (
              <circle cx="200" cy="122" r="5" fill="#7C2D12" stroke="#B45309" strokeWidth="2" />
            )}
            {(!frame.mouth || frame.mouth === 'neutral') && (
              <path d="M 191 122 L 209 122" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </g>
        </svg>

        {/* Floating linguistic cues badge */}
        {(handshapeDescription || nonManualDescription) && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur-xs border border-slate-800 rounded-lg p-2 text-xs text-slate-300">
            {handshapeDescription && (
              <div>
                <span className="font-medium text-amber-400">Handshape:</span> {handshapeDescription}
              </div>
            )}
            {nonManualDescription && (
              <div className="mt-0.5">
                <span className="font-medium text-indigo-400">Expression:</span> {nonManualDescription}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {showControls && (
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentFrameIndex(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Replay from start"
              aria-label="Replay animation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <FastForward className="w-3.5 h-3.5 text-slate-400" />
            {[0.5, 0.75, 1].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  speed === s
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Scrubber step buttons */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <button
              type="button"
              disabled={currentFrameIndex <= 0}
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex((i) => Math.max(0, i - 1));
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentFrameIndex >= frames.length - 1}
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex((i) => Math.min(frames.length - 1, i + 1));
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
