/**
 * Real-time MediaPipe Gesture Recognition Service for SignBridge
 * Loads the official MediaPipe GestureRecognizer task model
 * Supports 21 3D hand landmarks, left/right handedness, and predefined gesture classification:
 * - Open_Palm, Closed_Fist, Thumb_Up, Thumb_Down, Victory, Pointing_Up, ILoveYou
 */

import { FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';

export interface RecognizedHandGesture {
  categoryName: string;
  score: number;
  displayName?: string;
  handedness: 'Left' | 'Right' | 'Unknown';
  handednessScore: number;
}

export interface HandTrackingFrame {
  timestampMs: number;
  handsCount: number;
  gestures: RecognizedHandGesture[];
  landmarks: Array<Array<{ x: number; y: number; z: number }>>;
  worldLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  primaryGesture: RecognizedHandGesture | null;
}

// MediaPipe 21 Hand Landmarks Skeleton Connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Wrist to finger bases
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  // Palm base connection
  [5, 9],
  [9, 13],
  [13, 17],
];

class MediaPipeGestureService {
  private recognizer: GestureRecognizer | null = null;
  private isInitializing: boolean = false;
  private initError: string | null = null;
  private modelSource: 'local' | 'cdn' | null = null;

  public async initialize(): Promise<GestureRecognizer> {
    if (this.recognizer) {
      return this.recognizer;
    }

    if (this.isInitializing) {
      // Wait for existing initialization to complete
      let attempts = 0;
      while (this.isInitializing && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
      if (this.recognizer) return this.recognizer;
    }

    this.isInitializing = true;
    this.initError = null;

    try {
      // Step 1: Initialize FilesetResolver for WASM tasks
      let vision: any = null;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
      }

      // Detect if WebGL is cleanly supported in current browser context
      let canUseGpu = false;
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        canUseGpu = Boolean(gl);
      } catch {
        canUseGpu = false;
      }

      // Step 2: Load GestureRecognizer model
      const modelCandidates = [
        { path: '/models/gesture_recognizer.task', source: 'local' as const },
        {
          path: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          source: 'cdn' as const,
        },
      ];

      let lastError: any = null;

      for (const candidate of modelCandidates) {
        // If GPU is supported, try GPU first, otherwise go straight to CPU
        const delegatesToTry: Array<'GPU' | 'CPU'> = canUseGpu ? ['GPU', 'CPU'] : ['CPU'];

        for (const delegate of delegatesToTry) {
          try {
            this.recognizer = await GestureRecognizer.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: candidate.path,
                delegate,
              },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.5,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });
            this.modelSource = candidate.source;
            break;
          } catch (delErr) {
            lastError = delErr;
          }
        }

        if (this.recognizer) {
          break;
        }
      }

      if (!this.recognizer) {
        throw lastError || new Error('Failed to load MediaPipe Gesture Recognizer model');
      }

      return this.recognizer;
    } catch (err: any) {
      this.initError = err.message || 'Failed to initialize gesture model';
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public processVideoFrame(videoElement: HTMLVideoElement, timestampMs: number): HandTrackingFrame | null {
    if (!this.recognizer) return null;

    try {
      const results: GestureRecognizerResult = this.recognizer.recognizeForVideo(videoElement, timestampMs);

      const gestures: RecognizedHandGesture[] = [];

      if (results.gestures && results.gestures.length > 0) {
        results.gestures.forEach((gestureGroup, handIndex) => {
          if (gestureGroup.length > 0) {
            const topGesture = gestureGroup[0];
            const handednessInfo = results.handednesses?.[handIndex]?.[0];

            gestures.push({
              categoryName: topGesture.categoryName,
              score: topGesture.score,
              displayName: topGesture.displayName || topGesture.categoryName,
              handedness: (handednessInfo?.categoryName as 'Left' | 'Right') || 'Unknown',
              handednessScore: handednessInfo?.score || 1.0,
            });
          }
        });
      }

      // Pick highest confidence valid gesture
      const validGestures = gestures.filter((g) => g.categoryName && g.categoryName !== 'None');
      const primaryGesture = validGestures.length > 0
        ? validGestures.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
        : gestures[0] || null;

      return {
        timestampMs,
        handsCount: results.landmarks?.length || 0,
        gestures,
        landmarks: results.landmarks || [],
        worldLandmarks: results.worldLandmarks || [],
        primaryGesture,
      };
    } catch (err) {
      console.error('Error processing video frame in GestureRecognizer:', err);
      return null;
    }
  }

  public getModelStatus(): {
    isReady: boolean;
    isInitializing: boolean;
    error: string | null;
    source: 'local' | 'cdn' | null;
  } {
    return {
      isReady: Boolean(this.recognizer),
      isInitializing: this.isInitializing,
      error: this.initError,
      source: this.modelSource,
    };
  }

  public dispose() {
    if (this.recognizer) {
      try {
        this.recognizer.close();
      } catch (e) {
        // ignore
      }
      this.recognizer = null;
    }
    this.modelSource = null;
  }
}

export const mediapipeGestureService = new MediaPipeGestureService();
