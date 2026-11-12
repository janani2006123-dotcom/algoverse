import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Volume2,
  RotateCcw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Edit3,
  Trash2,
  RefreshCw,
  AlertCircle,
  Activity,
  Sliders,
  Settings,
  ChevronDown,
  ChevronUp,
  Hand,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SignToVoiceResult } from '../types';
import {
  mediapipeGestureService,
  HAND_CONNECTIONS,
  RecognizedHandGesture,
} from '../services/mediapipeGestureService';
import {
  temporalSignEngine,
  TemporalEngineMetrics,
} from '../services/temporalSignEngine';

interface CameraSignRecognizerProps {
  onRecognized?: (text: string, gloss: string) => void;
  compact?: boolean;
}

// Default gesture-to-text mapping (User editable)
export interface GestureMapping {
  gestureId: string;
  gestureName: string;
  mappedText: string;
  description: string;
}

export const DEFAULT_GESTURE_MAPPINGS: GestureMapping[] = [
  { gestureId: 'Open_Palm', gestureName: 'Open Palm', mappedText: 'Hello / Stop', description: 'Flat open hand showing 5 extended fingers' },
  { gestureId: 'Closed_Fist', gestureName: 'Closed Fist', mappedText: 'Hold / Ready', description: 'All fingers curled firmly into palm' },
  { gestureId: 'Thumb_Up', gestureName: 'Thumb Up', mappedText: 'Good / Yes / Approve', description: 'Fist with upright extended thumb' },
  { gestureId: 'Thumb_Down', gestureName: 'Thumb Down', mappedText: 'No / Bad / Disapprove', description: 'Fist with downward pointing thumb' },
  { gestureId: 'Victory', gestureName: 'Victory / Peace', mappedText: 'Peace / Two / Victory', description: 'V-sign with extended index and middle fingers' },
  { gestureId: 'Pointing_Up', gestureName: 'Pointing Up', mappedText: 'One / Look here / Attention', description: 'Single extended vertical index finger' },
  { gestureId: 'ILoveYou', gestureName: 'I Love You', mappedText: 'I love you', description: 'Thumb, index, and pinky fingers extended' },
];

export const CameraSignRecognizer: React.FC<CameraSignRecognizerProps> = ({
  onRecognized,
  compact = false,
}) => {
  const { preferences, speakText, isSpeaking, stopSpeaking, addTranslationRecord, showToast } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number; fps: number }>({ frames: 0, lastTime: performance.now(), fps: 0 });

  // Recognition cooldown management (prevents duplicate spam while gesture is held)
  const lastPredictedGestureRef = useRef<string | null>(null);
  const cooldownEndTimestampRef = useRef<number>(0);
  const GESTURE_COOLDOWN_MS = 1800; // 1.8 seconds debounce

  // UI & Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(preferences.cameraMirror ?? true);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelErrorMsg, setModelErrorMsg] = useState<string | null>(null);
  const [currentFps, setCurrentFps] = useState<number>(0);

  // Real-time Detection Telemetry
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);
  const [detectedHandedness, setDetectedHandedness] = useState<string>('No hands');
  const [activeGesture, setActiveGesture] = useState<RecognizedHandGesture | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number>(0);
  const [sampleLandmarks, setSampleLandmarks] = useState<{ wrist?: { x: number; y: number; z: number }; indexTip?: { x: number; y: number; z: number } }>({});
  const [temporalMetrics, setTemporalMetrics] = useState<TemporalEngineMetrics | null>(null);

  // Editable Gesture Mappings & Output Sentences
  const [gestureMappings, setGestureMappings] = useState<GestureMapping[]>(() => {
    try {
      const saved = localStorage.getItem('signbridge_gesture_mappings');
      return saved ? JSON.parse(saved) : DEFAULT_GESTURE_MAPPINGS;
    } catch {
      return DEFAULT_GESTURE_MAPPINGS;
    }
  });

  const [showMappingEditor, setShowMappingEditor] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(!compact);
  const [temporalModeActive, setTemporalModeActive] = useState<boolean>(true);

  const [accumulatedSentence, setAccumulatedSentence] = useState('Hello, good to see you.');
  const [validationError, setValidationError] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('hello');
  const [isAnalyzingPreset, setIsAnalyzingPreset] = useState<boolean>(false);

  // Save gesture mappings to localStorage
  const handleUpdateMapping = (gestureId: string, newText: string) => {
    const updated = gestureMappings.map((m) =>
      m.gestureId === gestureId ? { ...m, mappedText: newText } : m
    );
    setGestureMappings(updated);
    try {
      localStorage.setItem('signbridge_gesture_mappings', JSON.stringify(updated));
      showToast('Gesture mapping updated', 'success');
    } catch (e) {
      // ignore
    }
  };

  const handleResetMappings = () => {
    setGestureMappings(DEFAULT_GESTURE_MAPPINGS);
    localStorage.removeItem('signbridge_gesture_mappings');
    showToast('Reset to default gesture dictionary', 'info');
  };

  // Step 1: Initialize MediaPipe Gesture Recognizer on component mount
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      setModelStatus('loading');
      setModelErrorMsg(null);
      try {
        await mediapipeGestureService.initialize();
        if (isMounted) {
          setModelStatus('ready');
          showToast('MediaPipe gesture model loaded and ready', 'info');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to initialize MediaPipe model:', err);
          setModelStatus('error');
          setModelErrorMsg(err.message || 'MediaPipe task failed to load');
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Step 2: Start real webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            showToast('Live camera feed active', 'success');
          }).catch((err) => {
            console.error('Video play error:', err);
          });
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in browser permissions.'
        : err.message || 'Unable to access webcam device.';
      setCameraError(msg);
      setIsCameraActive(false);
      showToast(msg, 'error');
    }
  };

  // Step 3: Stop webcam and clean up tracks
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    temporalSignEngine.clear();
    setIsCameraActive(false);
    setDetectedHandsCount(0);
    setDetectedHandedness('Camera stopped');
    setActiveGesture(null);
  };

  // Step 4: Handle valid detected gesture trigger into sentence
  const handleGestureRecognized = useCallback((gestureName: string, confidence: number, handedness: string) => {
    const mapping = gestureMappings.find((m) => m.gestureId === gestureName);
    const phrase = mapping ? mapping.mappedText : gestureName;

    setAccumulatedSentence((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${phrase}` : phrase;
    });

    addTranslationRecord(
      'sign-to-voice',
      `${gestureName} (${handedness} Hand, ${Math.round(confidence * 100)}%)`,
      phrase,
      preferences.preferredSignLanguage
    );

    if (onRecognized) {
      onRecognized(phrase, gestureName);
    }

    showToast(`Recognized: ${gestureName} → "${phrase}"`, 'success');
  }, [gestureMappings, preferences.preferredSignLanguage, onRecognized, addTranslationRecord, showToast]);

  // Step 5: High-speed RAF continuous frame processing and landmark rendering
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCameraActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();

    // Compute FPS
    fpsCounterRef.current.frames++;
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      const fps = Math.round((fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.lastTime));
      setCurrentFps(fps);
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }

    // Check cooldown state
    if (cooldownEndTimestampRef.current > now) {
      setCooldownRemainingMs(Math.round(cooldownEndTimestampRef.current - now));
    } else {
      setCooldownRemainingMs(0);
    }

    // Match canvas dimensions to video
    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    const width = canvas.width || 640;
    const height = canvas.height || 480;

    // 1. Draw raw video feed (mirrored or standard)
    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // 2. Perform Real-time MediaPipe Hand Landmark & Gesture Recognition
    if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
      lastVideoTimeRef.current = video.currentTime;

      const frameData = mediapipeGestureService.processVideoFrame(video, now);

      if (frameData && frameData.handsCount > 0) {
        setDetectedHandsCount(frameData.handsCount);

        // Track handedness description
        const handsDesc = frameData.gestures
          .map((g) => `${g.handedness} Hand`)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(' + ') || `${frameData.handsCount} Hand(s)`;
        setDetectedHandedness(handsDesc);

        // Record sample coordinates for debug panel
        if (frameData.landmarks[0] && frameData.landmarks[0].length > 8) {
          setSampleLandmarks({
            wrist: frameData.landmarks[0][0],
            indexTip: frameData.landmarks[0][8],
          });
        }

        // Add to temporal landmark engine
        if (temporalModeActive) {
          temporalSignEngine.addFrame({
            timestampMs: now,
            landmarks: frameData.landmarks,
            handednesses: frameData.gestures.map((g) => g.handedness),
          });
          setTemporalMetrics(temporalSignEngine.getMetrics());

          // Evaluate temporal ISL gesture trajectories
          const temporalSign = temporalSignEngine.evaluateTemporalSign(now);
          if (temporalSign) {
            handleGestureRecognized(temporalSign.signName, temporalSign.confidence, 'Dynamic Motion');
            cooldownEndTimestampRef.current = now + 2400;
          }
        }

        // Check primary MediaPipe static gesture
        const primary = frameData.primaryGesture;
        if (primary && primary.categoryName && primary.categoryName !== 'None') {
          setActiveGesture(primary);

          // Evaluate recognition confidence and cooldown
          const isCooldownActive = now < cooldownEndTimestampRef.current;
          const isSameGesture = lastPredictedGestureRef.current === primary.categoryName;

          if (primary.score >= 0.65) {
            if (!isCooldownActive || (!isSameGesture && primary.score >= 0.8)) {
              lastPredictedGestureRef.current = primary.categoryName;
              cooldownEndTimestampRef.current = now + GESTURE_COOLDOWN_MS;
              handleGestureRecognized(primary.categoryName, primary.score, primary.handedness);
            }
          }
        } else {
          setActiveGesture(null);
        }

        // 3. Draw accurate 21-joint skeleton overlays per detected hand
        frameData.landmarks.forEach((handLandmarks, handIdx) => {
          const handedness = frameData.gestures[handIdx]?.handedness || (handIdx === 0 ? 'Left' : 'Right');
          const isLeftHand = handedness === 'Left';

          // Color palette: Left hand = Emerald (#10B981), Right hand = Indigo (#6366F1)
          const boneColor = isLeftHand ? 'rgba(16, 185, 129, 0.85)' : 'rgba(99, 102, 241, 0.85)';
          const jointFillColor = isLeftHand ? '#34D399' : '#818CF8';
          const tipColor = isLeftHand ? '#059669' : '#4F46E5';

          // Helper to convert normalized landmark coordinate to canvas pixel
          const toPixel = (pt: { x: number; y: number }) => {
            // If mirrored, flip the X coordinate back across the viewport
            const px = isMirrored ? (1 - pt.x) * width : pt.x * width;
            const py = pt.y * height;
            return [px, py];
          };

          // Draw skeleton lines (bones)
          ctx.beginPath();
          ctx.strokeStyle = boneColor;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          HAND_CONNECTIONS.forEach(([startIndex, endIndex]) => {
            if (handLandmarks[startIndex] && handLandmarks[endIndex]) {
              const [x1, y1] = toPixel(handLandmarks[startIndex]);
              const [x2, y2] = toPixel(handLandmarks[endIndex]);
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
            }
          });
          ctx.stroke();

          // Draw all 21 joints (vertices)
          handLandmarks.forEach((landmark, jointIdx) => {
            const [jx, jy] = toPixel(landmark);
            const isTip = [4, 8, 12, 16, 20].includes(jointIdx);
            const radius = jointIdx === 0 ? 5.5 : isTip ? 4.5 : 3.5;

            ctx.beginPath();
            ctx.arc(jx, jy, radius, 0, Math.PI * 2);
            ctx.fillStyle = isTip ? tipColor : jointFillColor;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
          });

          // Draw hand bounding label HUD
          if (handLandmarks[0]) {
            const [wristX, wristY] = toPixel(handLandmarks[0]);
            const labelText = `${handedness.toUpperCase()} HAND (21 pts)`;
            ctx.font = 'bold 11px monospace';
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            ctx.roundRect(wristX - textWidth / 2 - 6, wristY + 14, textWidth + 12, 20, 6);
            ctx.fill();
            ctx.strokeStyle = boneColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(labelText, wristX - textWidth / 2, wristY + 28);
          }
        });

      } else {
        // No hands in frame: reset state and DO NOT draw any synthetic landmarks
        setDetectedHandsCount(0);
        setDetectedHandedness('No hands detected in frame');
        setActiveGesture(null);
        setSampleLandmarks({});
        temporalSignEngine.clear();

        // Display subtle center HUD indicating scanning
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 120, height - 45, 240, 28, 8);
        ctx.fill();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Show 1 or 2 hands to begin tracking', width / 2, height - 27);
        ctx.textAlign = 'start';
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isCameraActive, isMirrored, temporalModeActive, handleGestureRecognized]);

  // Trigger RAF loop whenever camera is activated
  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, processFrame]);

  // Fallback simulator for preset gestures (Server / Heuristic)
  const handleAnalyzePreset = async (presetId: string) => {
    setIsAnalyzingPreset(true);
    setValidationError('');
    try {
      const res = await fetch('/api/gemini/interpret-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestureHint: presetId,
          signLanguage: preferences.preferredSignLanguage,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze preset');
      const data: SignToVoiceResult = await res.json();

      const newText = data.sentence || data.recognizedSign;
      setAccumulatedSentence((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${newText}` : newText;
      });

      addTranslationRecord(
        'sign-to-voice',
        `${data.recognizedSign} (${data.handshapeDetected || 'Preset Demo'})`,
        data.sentence,
        preferences.preferredSignLanguage
      );

      if (onRecognized) {
        onRecognized(data.sentence, data.recognizedSign);
      }

      showToast(`Preset: ${data.recognizedSign}`, 'success');
    } catch (err) {
      console.error('Preset analysis error:', err);
      showToast('Could not analyze preset gesture.', 'error');
    } finally {
      setIsAnalyzingPreset(false);
    }
  };

  // Speech playback trigger
  const handleSpeak = () => {
    if (!accumulatedSentence.trim()) {
      setValidationError('Please type or perform a sign gesture before speaking aloud.');
      showToast('No sentence to speak aloud.', 'info');
      return;
    }
    setValidationError('');
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(accumulatedSentence);
    }
  };

  const handleClear = () => {
    setAccumulatedSentence('');
    setValidationError('');
    temporalSignEngine.clear();
    showToast('Sentence cleared', 'info');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Camera Sign Recognition
          </h2>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            {preferences.preferredSignLanguage}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Model Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                modelStatus === 'ready'
                  ? 'bg-emerald-500'
                  : modelStatus === 'loading'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-medium">
              {modelStatus === 'ready'
                ? 'MediaPipe Model Ready'
                : modelStatus === 'loading'
                ? 'Loading Model...'
                : 'Model Load Error'}
            </span>
          </div>

          {/* Toggle Dictionary Mappings */}
          <button
            type="button"
            onClick={() => setShowMappingEditor(!showMappingEditor)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
              showMappingEditor
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gesture Dictionary</span>
          </button>
        </div>
      </div>

      {/* Main Stage Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Video & Canvas Landmark Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Hidden raw video element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="hidden"
            />

            {/* Display Canvas with real 21-landmark tracking */}
            {isCameraActive ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-200">
                  Webcam is Inactive
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Start your webcam to activate real-time MediaPipe hand landmark tracking and gesture recognition.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Live Webcam</span>
                </button>
              </div>
            )}

            {/* In-Canvas Telemetry HUD (Top Left) */}
            {isCameraActive && (
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md rounded-xl p-2.5 border border-slate-800 text-[11px] font-mono text-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-emerald-400">
                    {detectedHandsCount === 0 ? 'NO HANDS' : `${detectedHandsCount} HAND${detectedHandsCount > 1 ? 'S' : ''} DETECTED`}
                  </span>
                  <span className="text-slate-400">· {currentFps} FPS</span>
                </div>
                <div className="text-slate-300">
                  Handedness: <span className="text-indigo-300">{detectedHandedness}</span>
                </div>
              </div>
            )}

            {/* Camera Overlay Controls (Top Right) */}
            {isCameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-200 backdrop-blur-md border border-slate-700 transition-colors"
                  title="Toggle Mirror Camera"
                >
                  {isMirrored ? 'Mirrored' : 'Normal'}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white backdrop-blur-md transition-colors flex items-center gap-1"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Active Recognition Toast Banner inside Canvas (Bottom) */}
            {activeGesture && activeGesture.categoryName !== 'None' && isCameraActive && (
              <div className="absolute bottom-3 left-3 right-3 bg-indigo-950/90 border border-indigo-500/60 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{activeGesture.categoryName.replace('_', ' ')}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-normal">
                        {activeGesture.handedness} Hand
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-200">
                      Mapped: "{gestureMappings.find((m) => m.gestureId === activeGesture.categoryName)?.mappedText || activeGesture.categoryName}"
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(activeGesture.score * 100)}%
                  </div>
                  {cooldownRemainingMs > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cooldown: {(cooldownRemainingMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="text-xs p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Live Webcam</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setTemporalModeActive(!temporalModeActive)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                  temporalModeActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ISL Motion Engine: {temporalModeActive ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Preset Testing Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Simulator:</span>
              <select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value);
                  handleAnalyzePreset(e.target.value);
                }}
                disabled={isAnalyzingPreset}
                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hello">Hello (Salute)</option>
                <option value="help">Help (Lift Palm)</option>
                <option value="thank-you">Thank You (Chin Sweep)</option>
                <option value="doctor">Doctor (Wrist Pulse)</option>
                <option value="water">Water (W-Chin)</option>
                <option value="yes">Yes (Nodding Fist)</option>
                <option value="no">No (Finger Snap)</option>
                <option value="family">Family (F-Circle)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Interpreted Sentence, Editable Output & Speech Synthesis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Gesture & Hand Tracking HUD Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">
                Recognized Gesture
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {activeGesture ? `${Math.round(activeGesture.score * 100)}% Confidence` : 'Awaiting Gesture...'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {activeGesture && activeGesture.categoryName !== 'None'
                  ? activeGesture.categoryName.replace('_', ' ')
                  : 'NONE'}
              </span>
              {activeGesture && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {activeGesture.handedness} Hand
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Mapped Output:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  "{gestureMappings.find((m) => m.gestureId === activeGesture?.categoryName)?.mappedText || '—'}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Detection Source:</span>
                <span className="font-medium">
                  {isCameraActive ? 'MediaPipe Tasks-Vision 21-pt Model' : 'Preset Simulator'}
                </span>
              </div>
            </div>
          </div>

          {/* Interpreted Natural English Output (User Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="accumulated-sentence-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Interpreted Spoken Sentence (Editable)</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                title="Clear sentence"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <textarea
              id="accumulated-sentence-input"
              name="accumulatedSentenceInput"
              rows={compact ? 3 : 4}
              value={accumulatedSentence}
              onChange={(e) => {
                setAccumulatedSentence(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="Recognized signs from your webcam will appear here in real time. You can edit any words before speaking."
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed shadow-inner"
            />

            {validationError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Speech Playback Controls */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSpeak}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-xs ${
                isSpeaking
                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Speaking Out Loud (Click to Stop)' : 'Speak Sentence via Audio'}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeak}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Replay Audio"
              aria-label="Replay speech audio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Editable Gesture Dictionary Panel */}
      {showMappingEditor && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-5 bg-slate-50/80 dark:bg-slate-900/60 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Editable Gesture-to-Text Dictionary</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the English phrase triggered when each MediaPipe gesture is recognized.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetMappings}
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gestureMappings.map((mapping) => (
              <div
                key={mapping.gestureId}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {mapping.gestureName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {mapping.gestureId}
                  </span>
                </div>
                <input
                  type="text"
                  value={mapping.mappedText}
                  onChange={(e) => handleUpdateMapping(mapping.gestureId, e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {mapping.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 5: Comprehensive Interactive Debug & Telemetry Panel */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 text-xs">
        <button
          type="button"
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="w-full px-5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Hardware & AI Model Debug Telemetry
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
              {isCameraActive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          {showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDebugPanel && (
          <div className="p-5 border-t border-slate-800 space-y-4 font-mono text-[11px]">
            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase">Webcam Status</span>
                <span className={`font-bold ${isCameraActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isCameraActive ? `Active (${currentFps} FPS)` : 'Camera Inactive'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {videoRef.current ? `${videoRef.current.videoWidth || 640}x${videoRef.current.videoHeight || 480}` : '640x480'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase">Hand Detection</span>
                <span className="font-bold text-white">
                  {detectedHandsCount === 0 ? 'No Hands' : `${detectedHandsCount} Hand (${detectedHandsCount * 21} pts)`}
                </span>
                <span className="text-[10px] text-indigo-400 block">{detectedHandedness}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase">Gesture Model</span>
                <span className={`font-bold ${modelStatus === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {modelStatus === 'ready' ? 'GestureRecognizer Ready' : modelStatus}
                </span>
                <span className="text-[10px] text-slate-500 block">WASM Local / CDN</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase">Prediction & Cooldown</span>
                <span className="font-bold text-indigo-300">
                  {activeGesture ? `${activeGesture.categoryName} (${Math.round(activeGesture.score * 100)}%)` : 'None / Neutral'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {cooldownRemainingMs > 0 ? `Cooldown: ${(cooldownRemainingMs / 1000).toFixed(1)}s` : 'Ready to capture'}
                </span>
              </div>
            </div>

            {/* Live Landmark Coordinates Sample */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">
                Live Landmark Coordinates (Sample 3D Points from Real Webcam)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 text-[10px]">
                <div>
                  <span className="text-indigo-400">Wrist (Point 0):</span>{' '}
                  {sampleLandmarks.wrist
                    ? `X: ${sampleLandmarks.wrist.x.toFixed(4)}, Y: ${sampleLandmarks.wrist.y.toFixed(4)}, Z: ${sampleLandmarks.wrist.z.toFixed(4)}`
                    : 'Awaiting hand in camera...'}
                </div>
                <div>
                  <span className="text-indigo-400">Index Tip (Point 8):</span>{' '}
                  {sampleLandmarks.indexTip
                    ? `X: ${sampleLandmarks.indexTip.x.toFixed(4)}, Y: ${sampleLandmarks.indexTip.y.toFixed(4)}, Z: ${sampleLandmarks.indexTip.z.toFixed(4)}`
                    : 'Awaiting hand in camera...'}
                </div>
              </div>
            </div>

            {/* Temporal Engine ISL Metrics */}
            {temporalMetrics && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[10px]">
                <span className="text-slate-400 uppercase font-bold block">
                  Temporal Engine State (Indian Sign Language Sequential Dynamics)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div>Buffer: {temporalMetrics.bufferLength} / {temporalMetrics.maxBuffer} frames</div>
                  <div>Avg Velocity: {temporalMetrics.averageVelocity} px/f</div>
                  <div>Orientation: {temporalMetrics.handOrientationSummary}</div>
                  <div>Trajectory: {temporalMetrics.dominantTrajectory}</div>
                </div>
              </div>
            )}

            {/* Linguistic Disclosure Note */}
            <div className="flex items-start gap-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-sans">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Linguistic Integrity Disclosure:</strong> MediaPipe Gesture Recognizer detects isolated handshapes (Open Palm, Closed Fist, Victory, Thumb Up/Down, Pointing, ILoveYou). True Indian Sign Language (ISL) requires full continuous spatial-temporal graph neural networks (ST-GCN) trained on datasets such as INCLUDE.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
