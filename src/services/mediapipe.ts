// MediaPipe Vision Service - Face + Body Tracking
// Handles face mesh, pose detection, and comprehensive body language analysis

import { 
  FaceLandmarker, 
  PoseLandmarker,
  FilesetResolver, 
  DrawingUtils,
  NormalizedLandmark 
} from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;
let isInitializing = false;

export interface FaceMetrics {
  eyeContactScore: number; // 0-100
  isSmiling: boolean;
  headPoseDeviation: number; // degrees from center
  isLookingAtCamera: boolean;
}

export interface BodyMetrics {
  postureScore: number; // 0-100
  postureIssue: 'good' | 'shoulders_shrugged' | 'slouching' | 'leaning';
  leftHandVisible: boolean;
  rightHandVisible: boolean;
  handsStatus: 'visible' | 'hidden' | 'crossed';
  bodyStability: number; // 0-100
  swayAmount: number; // Horizontal movement in % of frame
}

export interface CombinedMetrics extends FaceMetrics {
  body: BodyMetrics | null;
}

export interface FrameData {
  timestamp: number;
  eyeContact: boolean;
  smiling: boolean;
  headDeviation: number;
  // Body language data
  postureScore?: number;
  handsVisible?: boolean;
  bodyStability?: number;
  noseX?: number; // For sway tracking
}

// Rolling buffer for stability calculation
const nosePositionBuffer: { x: number; timestamp: number }[] = [];
const STABILITY_WINDOW_MS = 3000; // 3 second rolling window

// Initialize MediaPipe FaceLandmarker + PoseLandmarker
export const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker && poseLandmarker) {
    return faceLandmarker;
  }

  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (faceLandmarker) return faceLandmarker;
  }

  isInitializing = true;

  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    // Initialize Face Landmarker
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });

    // Initialize Pose Landmarker for body tracking
    poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });

    isInitializing = false;
    return faceLandmarker;
  } catch (error) {
    isInitializing = false;
    console.error('Failed to initialize MediaPipe:', error);
    throw error;
  }
};

// Calculate eye contact score based on iris position
const calculateEyeContact = (landmarks: NormalizedLandmark[]): number => {
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  
  const leftIris = landmarks[468];
  const rightIris = landmarks[473];

  if (!leftIris || !rightIris) {
    const leftEyeCenter = {
      x: (leftEyeInner.x + leftEyeOuter.x) / 2,
      y: (leftEyeInner.y + leftEyeOuter.y) / 2,
    };
    const rightEyeCenter = {
      x: (rightEyeInner.x + rightEyeOuter.x) / 2,
      y: (rightEyeInner.y + rightEyeOuter.y) / 2,
    };
    
    const faceCenterX = (landmarks[1].x + landmarks[4].x) / 2;
    const avgEyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const deviation = Math.abs(avgEyeCenterX - faceCenterX);
    
    return Math.max(0, 100 - deviation * 500);
  }

  const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
  const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
  
  const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
  const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;
  
  const leftDeviation = Math.abs(leftIris.x - leftEyeCenterX) / leftEyeWidth;
  const rightDeviation = Math.abs(rightIris.x - rightEyeCenterX) / rightEyeWidth;
  
  const avgDeviation = (leftDeviation + rightDeviation) / 2;
  
  return Math.max(0, Math.min(100, 100 - avgDeviation * 200));
};

// Calculate head pose deviation from center
const calculateHeadPoseDeviation = (landmarks: NormalizedLandmark[]): number => {
  const noseTip = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const horizontalDeviation = Math.abs(noseTip.x - faceCenterX) * 100;
  
  const faceTop = landmarks[10];
  const faceCenterY = (faceTop.y + landmarks[152].y) / 2;
  const verticalDeviation = Math.abs(noseTip.y - faceCenterY) * 50;
  
  return Math.min(90, (horizontalDeviation + verticalDeviation) * 30);
};

// Calculate posture score from pose landmarks
const calculatePostureMetrics = (landmarks: NormalizedLandmark[]): Omit<BodyMetrics, 'bodyStability' | 'swayAmount'> => {
  // Pose landmark indices:
  // 0: nose, 11: left shoulder, 12: right shoulder
  // 13: left elbow, 14: right elbow, 15: left wrist, 16: right wrist
  // 7: left ear, 8: right ear
  
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  // Posture: Compare shoulder height to ear height
  // Good posture = shoulders relaxed (lower Y = higher position in image, so shoulders should be significantly below ears)
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const avgEarY = (leftEar.y + rightEar.y) / 2;
  const shoulderEarDistance = avgShoulderY - avgEarY; // Positive = shoulders below ears (good)
  
  // Check if shoulders are shrugged (too close to ears)
  const isShrugged = shoulderEarDistance < 0.08;
  
  // Check shoulder alignment (slouching detection via Z depth if available)
  const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
  const isLeaning = shoulderSlope > 0.05;
  
  // Posture score calculation
  let postureScore = 100;
  let postureIssue: BodyMetrics['postureIssue'] = 'good';
  
  if (isShrugged) {
    postureScore -= 30;
    postureIssue = 'shoulders_shrugged';
  }
  if (isLeaning) {
    postureScore -= 20;
    postureIssue = postureIssue === 'good' ? 'leaning' : postureIssue;
  }
  
  // Check if shoulders are hunched forward (Z-axis)
  const avgShoulderZ = ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2;
  const noseZ = nose.z || 0;
  if (avgShoulderZ > noseZ + 0.1) { // Shoulders pushed forward
    postureScore -= 25;
    postureIssue = 'slouching';
  }
  
  postureScore = Math.max(0, Math.min(100, postureScore));
  
  // Hand visibility: Check if wrists are in frame (0-1 normalized coords)
  const leftHandVisible = leftWrist && leftWrist.visibility !== undefined 
    ? leftWrist.visibility > 0.5 
    : (leftWrist.x >= 0 && leftWrist.x <= 1 && leftWrist.y >= 0 && leftWrist.y <= 1);
  const rightHandVisible = rightWrist && rightWrist.visibility !== undefined
    ? rightWrist.visibility > 0.5
    : (rightWrist.x >= 0 && rightWrist.x <= 1 && rightWrist.y >= 0 && rightWrist.y <= 1);
  
  // Detect crossed arms (wrists close together and near opposite shoulders)
  const wristDistance = Math.sqrt(
    Math.pow(leftWrist.x - rightWrist.x, 2) + 
    Math.pow(leftWrist.y - rightWrist.y, 2)
  );
  const isCrossed = wristDistance < 0.15 && leftHandVisible && rightHandVisible;
  
  let handsStatus: BodyMetrics['handsStatus'] = 'hidden';
  if (leftHandVisible && rightHandVisible) {
    handsStatus = isCrossed ? 'crossed' : 'visible';
  } else if (leftHandVisible || rightHandVisible) {
    handsStatus = 'visible';
  }
  
  return {
    postureScore,
    postureIssue,
    leftHandVisible,
    rightHandVisible,
    handsStatus,
  };
};

// Calculate body stability from nose position over time
const calculateBodyStability = (noseX: number, timestamp: number): { stability: number; swayAmount: number } => {
  // Add current position to buffer
  nosePositionBuffer.push({ x: noseX, timestamp });
  
  // Remove old entries
  const cutoff = timestamp - STABILITY_WINDOW_MS;
  while (nosePositionBuffer.length > 0 && nosePositionBuffer[0].timestamp < cutoff) {
    nosePositionBuffer.shift();
  }
  
  if (nosePositionBuffer.length < 10) {
    return { stability: 100, swayAmount: 0 };
  }
  
  // Calculate movement range
  const xValues = nosePositionBuffer.map(p => p.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const range = maxX - minX;
  
  // Convert to percentage of frame width
  const swayPercent = range * 100;
  
  // Stability score (10% sway = 0 stability)
  const stability = Math.max(0, Math.min(100, 100 - swayPercent * 10));
  
  return { stability, swayAmount: swayPercent };
};

// Process video frame and return combined metrics
export const processVideoFrame = (
  video: HTMLVideoElement,
  timestamp: number
): CombinedMetrics | null => {
  if (!faceLandmarker || video.readyState < 2) {
    return null;
  }

  try {
    const faceResults = faceLandmarker.detectForVideo(video, timestamp);

    if (!faceResults.faceLandmarks || faceResults.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = faceResults.faceLandmarks[0];
    const blendshapes = faceResults.faceBlendshapes?.[0]?.categories || [];

    const eyeContactScore = calculateEyeContact(landmarks as NormalizedLandmark[]);
    const smileScore = blendshapes.find(b => b.categoryName === 'mouthSmileLeft')?.score || 0;
    const smileScoreRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight')?.score || 0;
    const isSmiling = (smileScore + smileScoreRight) / 2 > 0.3;
    const headPoseDeviation = calculateHeadPoseDeviation(landmarks as NormalizedLandmark[]);
    
    // Get body metrics if pose landmarker is available
    let bodyMetrics: BodyMetrics | null = null;
    if (poseLandmarker) {
      try {
        const poseResults = poseLandmarker.detectForVideo(video, timestamp);
        if (poseResults.landmarks && poseResults.landmarks.length > 0) {
          const poseLandmarks = poseResults.landmarks[0];
          const baseMetrics = calculatePostureMetrics(poseLandmarks as NormalizedLandmark[]);
          const { stability, swayAmount } = calculateBodyStability(poseLandmarks[0].x, timestamp);
          
          bodyMetrics = {
            ...baseMetrics,
            bodyStability: stability,
            swayAmount,
          };
        }
      } catch (e) {
        console.warn('Pose detection error:', e);
      }
    }

    return {
      eyeContactScore,
      isSmiling,
      headPoseDeviation,
      isLookingAtCamera: eyeContactScore > 70 && headPoseDeviation < 15,
      body: bodyMetrics,
    };
  } catch (error) {
    console.error('Error processing video frame:', error);
    return null;
  }
};

// Draw face mesh and body skeleton on canvas
export const drawFaceMesh = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  timestamp: number
): CombinedMetrics | null => {
  if (!faceLandmarker || video.readyState < 2) {
    return null;
  }

  try {
    const faceResults = faceLandmarker.detectForVideo(video, timestamp);
    const drawingUtils = new DrawingUtils(ctx);

    // Draw face mesh if detected
    if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
      for (const landmarks of faceResults.faceLandmarks) {
        // Tessellation - subtle cyan mesh
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: 'rgba(34, 211, 238, 0.18)', lineWidth: 0.6 }
        );
        // Face oval - bright cyan
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: 'rgba(34, 211, 238, 0.75)', lineWidth: 2 }
        );
        // Eyes - lime
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: 'rgba(163, 230, 53, 0.8)', lineWidth: 1.6 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: 'rgba(163, 230, 53, 0.8)', lineWidth: 1.6 }
        );
        // Irises
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: 'rgba(163, 230, 53, 0.95)', lineWidth: 1.2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: 'rgba(163, 230, 53, 0.95)', lineWidth: 1.2 }
        );
        // Lips
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: 'rgba(34, 211, 238, 0.45)', lineWidth: 1.4 }
        );
      }
    }

    // Draw body skeleton if pose detected
    let bodyMetrics: BodyMetrics | null = null;
    if (poseLandmarker) {
      try {
        const poseResults = poseLandmarker.detectForVideo(video, timestamp);
        if (poseResults.landmarks && poseResults.landmarks.length > 0) {
          const poseLandmarks = poseResults.landmarks[0];
          
          // Draw skeleton connections
          // Torso - Yellow
          const torsoConnections = [
            [11, 12], // shoulders
            [11, 23], // left shoulder to hip
            [12, 24], // right shoulder to hip
            [23, 24], // hips
          ];
          
          for (const [start, end] of torsoConnections) {
            const startPoint = poseLandmarks[start];
            const endPoint = poseLandmarks[end];
            if (startPoint && endPoint) {
              ctx.beginPath();
              ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
              ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
              ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)'; // Yellow
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }
          
          // Arms - Orange
          const armConnections = [
            [11, 13], [13, 15], // left arm
            [12, 14], [14, 16], // right arm
          ];
          
          for (const [start, end] of armConnections) {
            const startPoint = poseLandmarks[start];
            const endPoint = poseLandmarks[end];
            if (startPoint && endPoint) {
              ctx.beginPath();
              ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
              ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
              ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)'; // Orange
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }
          
          // Draw key joints
          const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24]; // shoulders, elbows, wrists, hips
          for (const idx of keyJoints) {
            const joint = poseLandmarks[idx];
            if (joint) {
              ctx.beginPath();
              ctx.arc(
                joint.x * ctx.canvas.width,
                joint.y * ctx.canvas.height,
                5,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = idx <= 16 ? 'rgba(251, 146, 60, 1)' : 'rgba(250, 204, 21, 1)';
              ctx.fill();
            }
          }
          
          // Calculate body metrics
          const baseMetrics = calculatePostureMetrics(poseLandmarks as NormalizedLandmark[]);
          const { stability, swayAmount } = calculateBodyStability(poseLandmarks[0].x, timestamp);
          
          bodyMetrics = {
            ...baseMetrics,
            bodyStability: stability,
            swayAmount,
          };
        }
      } catch (e) {
        console.warn('Pose drawing error:', e);
      }
    }

    // Calculate face metrics
    if (!faceResults.faceLandmarks || faceResults.faceLandmarks.length === 0) {
      return bodyMetrics ? {
        eyeContactScore: 0,
        isSmiling: false,
        headPoseDeviation: 0,
        isLookingAtCamera: false,
        body: bodyMetrics,
      } : null;
    }

    const landmarks = faceResults.faceLandmarks[0];
    const blendshapes = faceResults.faceBlendshapes?.[0]?.categories || [];
    
    const eyeContactScore = calculateEyeContact(landmarks as NormalizedLandmark[]);
    const smileScore = blendshapes.find(b => b.categoryName === 'mouthSmileLeft')?.score || 0;
    const smileScoreRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight')?.score || 0;
    const isSmiling = (smileScore + smileScoreRight) / 2 > 0.3;
    const headPoseDeviation = calculateHeadPoseDeviation(landmarks as NormalizedLandmark[]);

    return {
      eyeContactScore,
      isSmiling,
      headPoseDeviation,
      isLookingAtCamera: eyeContactScore > 70 && headPoseDeviation < 15,
      body: bodyMetrics,
    };
  } catch (error) {
    console.error('Error drawing face mesh:', error);
    return null;
  }
};

// Aggregate frame data into summary metrics
export const aggregateMetrics = (frameData: FrameData[]): {
  averageEyeContact: number;
  smilePercentage: number;
  stabilityScore: number;
  // Body language aggregates
  averagePosture: number;
  handsVisiblePercent: number;
  averageBodyStability: number;
  postureGrade: 'A' | 'B' | 'C';
} => {
  if (frameData.length === 0) {
    return { 
      averageEyeContact: 0, 
      smilePercentage: 0, 
      stabilityScore: 0,
      averagePosture: 0,
      handsVisiblePercent: 0,
      averageBodyStability: 0,
      postureGrade: 'C',
    };
  }

  const eyeContactFrames = frameData.filter(f => f.eyeContact).length;
  const smilingFrames = frameData.filter(f => f.smiling).length;
  
  // Head stability
  const deviations = frameData.map(f => f.headDeviation);
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const variance = deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / deviations.length;
  const stabilityScore = Math.max(0, 100 - Math.sqrt(variance) * 5);

  // Body language aggregates
  const framesWithPosture = frameData.filter(f => f.postureScore !== undefined);
  const framesWithHands = frameData.filter(f => f.handsVisible !== undefined);
  const framesWithBodyStability = frameData.filter(f => f.bodyStability !== undefined);
  
  const averagePosture = framesWithPosture.length > 0
    ? framesWithPosture.reduce((sum, f) => sum + (f.postureScore || 0), 0) / framesWithPosture.length
    : 0;
  
  const handsVisiblePercent = framesWithHands.length > 0
    ? (framesWithHands.filter(f => f.handsVisible).length / framesWithHands.length) * 100
    : 0;
  
  const averageBodyStability = framesWithBodyStability.length > 0
    ? framesWithBodyStability.reduce((sum, f) => sum + (f.bodyStability || 0), 0) / framesWithBodyStability.length
    : 0;
  
  // Calculate posture grade
  let postureGrade: 'A' | 'B' | 'C' = 'C';
  if (averagePosture >= 80) postureGrade = 'A';
  else if (averagePosture >= 60) postureGrade = 'B';

  return {
    averageEyeContact: Math.round((eyeContactFrames / frameData.length) * 100),
    smilePercentage: Math.round((smilingFrames / frameData.length) * 100),
    stabilityScore: Math.round(stabilityScore),
    averagePosture: Math.round(averagePosture),
    handsVisiblePercent: Math.round(handsVisiblePercent),
    averageBodyStability: Math.round(averageBodyStability),
    postureGrade,
  };
};

// Get sway data for graphing (returns normalized X positions over time)
export const getSwayData = (frameData: FrameData[]): { time: number; sway: number }[] => {
  return frameData
    .filter(f => f.noseX !== undefined)
    .map((f, idx) => ({
      time: Math.round(f.timestamp / 1000), // seconds
      sway: Math.round(((f.noseX || 0.5) - 0.5) * 200), // -100 to +100
    }));
};

// Cleanup
export const disposeFaceLandmarker = (): void => {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  nosePositionBuffer.length = 0;
};
