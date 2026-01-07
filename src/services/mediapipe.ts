// MediaPipe Face Landmarker Service
// Handles face mesh detection and analysis

import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;

export interface FaceMetrics {
  eyeContactScore: number; // 0-100
  isSmiling: boolean;
  headPoseDeviation: number; // degrees from center
  isLookingAtCamera: boolean;
}

export interface FrameData {
  timestamp: number;
  eyeContact: boolean;
  smiling: boolean;
  headDeviation: number;
}

// Initialize MediaPipe FaceLandmarker
export const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  if (isInitializing) {
    // Wait for initialization to complete
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

    isInitializing = false;
    return faceLandmarker;
  } catch (error) {
    isInitializing = false;
    console.error('Failed to initialize FaceLandmarker:', error);
    throw error;
  }
};

// Process a video frame and return face metrics
export const processVideoFrame = (
  video: HTMLVideoElement,
  timestamp: number
): FaceMetrics | null => {
  if (!faceLandmarker || video.readyState < 2) {
    return null;
  }

  try {
    const results = faceLandmarker.detectForVideo(video, timestamp);

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.faceLandmarks[0];
    const blendshapes = results.faceBlendshapes?.[0]?.categories || [];

    // Calculate eye contact based on iris position
    const eyeContactScore = calculateEyeContact(landmarks);
    
    // Detect smile from blendshapes
    const smileScore = blendshapes.find(b => b.categoryName === 'mouthSmileLeft')?.score || 0;
    const smileScoreRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight')?.score || 0;
    const isSmiling = (smileScore + smileScoreRight) / 2 > 0.3;

    // Calculate head pose deviation
    const headPoseDeviation = calculateHeadPoseDeviation(landmarks);
    
    return {
      eyeContactScore,
      isSmiling,
      headPoseDeviation,
      isLookingAtCamera: eyeContactScore > 70 && headPoseDeviation < 15,
    };
  } catch (error) {
    console.error('Error processing video frame:', error);
    return null;
  }
};

// Calculate eye contact score based on iris position
const calculateEyeContact = (landmarks: { x: number; y: number; z: number }[]): number => {
  // Iris landmarks: left iris center = 468, right iris center = 473
  // Eye corners for reference
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  
  // Get iris positions (if available)
  const leftIris = landmarks[468];
  const rightIris = landmarks[473];

  if (!leftIris || !rightIris) {
    // Fallback: use eye centers
    const leftEyeCenter = {
      x: (leftEyeInner.x + leftEyeOuter.x) / 2,
      y: (leftEyeInner.y + leftEyeOuter.y) / 2,
    };
    const rightEyeCenter = {
      x: (rightEyeInner.x + rightEyeOuter.x) / 2,
      y: (rightEyeInner.y + rightEyeOuter.y) / 2,
    };
    
    // Check if eyes are roughly centered
    const faceCenterX = (landmarks[1].x + landmarks[4].x) / 2;
    const avgEyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const deviation = Math.abs(avgEyeCenterX - faceCenterX);
    
    return Math.max(0, 100 - deviation * 500);
  }

  // Calculate deviation from eye center
  const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
  const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
  
  const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
  const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;
  
  const leftDeviation = Math.abs(leftIris.x - leftEyeCenterX) / leftEyeWidth;
  const rightDeviation = Math.abs(rightIris.x - rightEyeCenterX) / rightEyeWidth;
  
  const avgDeviation = (leftDeviation + rightDeviation) / 2;
  
  // Convert to score (0 deviation = 100%, max deviation = 0%)
  return Math.max(0, Math.min(100, 100 - avgDeviation * 200));
};

// Calculate head pose deviation from center
const calculateHeadPoseDeviation = (landmarks: { x: number; y: number; z: number }[]): number => {
  // Use nose tip and face outline for head pose estimation
  const noseTip = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  
  // Calculate face center
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  
  // Deviation of nose from face center indicates head rotation
  const horizontalDeviation = Math.abs(noseTip.x - faceCenterX) * 100;
  
  // Vertical deviation
  const faceTop = landmarks[10];
  const faceCenterY = (faceTop.y + landmarks[152].y) / 2;
  const verticalDeviation = Math.abs(noseTip.y - faceCenterY) * 50;
  
  // Combine deviations and convert to degrees (approximate)
  return Math.min(90, (horizontalDeviation + verticalDeviation) * 30);
};

// Draw face mesh on canvas
export const drawFaceMesh = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  timestamp: number
): FaceMetrics | null => {
  if (!faceLandmarker || video.readyState < 2) {
    return null;
  }

  try {
    const results = faceLandmarker.detectForVideo(video, timestamp);

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    const drawingUtils = new DrawingUtils(ctx);

    // Draw face mesh
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: 'rgba(99, 102, 241, 0.3)', lineWidth: 0.5 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: 'rgba(99, 102, 241, 0.8)', lineWidth: 2 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: 'rgba(34, 197, 94, 0.8)', lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: 'rgba(34, 197, 94, 0.8)', lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: 'rgba(239, 68, 68, 0.6)', lineWidth: 1 }
      );
    }

    // Return metrics
    const landmarks = results.faceLandmarks[0];
    const blendshapes = results.faceBlendshapes?.[0]?.categories || [];
    
    const eyeContactScore = calculateEyeContact(landmarks);
    const smileScore = blendshapes.find(b => b.categoryName === 'mouthSmileLeft')?.score || 0;
    const smileScoreRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight')?.score || 0;
    const isSmiling = (smileScore + smileScoreRight) / 2 > 0.3;
    const headPoseDeviation = calculateHeadPoseDeviation(landmarks);

    return {
      eyeContactScore,
      isSmiling,
      headPoseDeviation,
      isLookingAtCamera: eyeContactScore > 70 && headPoseDeviation < 15,
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
} => {
  if (frameData.length === 0) {
    return { averageEyeContact: 0, smilePercentage: 0, stabilityScore: 0 };
  }

  const eyeContactFrames = frameData.filter(f => f.eyeContact).length;
  const smilingFrames = frameData.filter(f => f.smiling).length;
  
  // Calculate stability based on head deviation variance
  const deviations = frameData.map(f => f.headDeviation);
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const variance = deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / deviations.length;
  const stabilityScore = Math.max(0, 100 - Math.sqrt(variance) * 5);

  return {
    averageEyeContact: Math.round((eyeContactFrames / frameData.length) * 100),
    smilePercentage: Math.round((smilingFrames / frameData.length) * 100),
    stabilityScore: Math.round(stabilityScore),
  };
};

// Cleanup
export const disposeFaceLandmarker = (): void => {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
};
