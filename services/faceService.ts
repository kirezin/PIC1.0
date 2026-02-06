import { Member } from '../types';

// Access the global faceapi object injected via script tag in index.html
const faceapi = (window as any).faceapi;

// Configuration
const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const MATCH_THRESHOLD = 0.5; // Stricter threshold to avoid confusion (0.6 is default)

export const FaceService = {
  isLoaded: false,

  loadModels: async () => {
    if (FaceService.isLoaded) return;
    
    try {
      console.log("Loading Face API models...");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL) // Used for higher accuracy in registration
      ]);
      FaceService.isLoaded = true;
      console.log("Face API models loaded.");
    } catch (error) {
      console.error("Failed to load face models", error);
      throw new Error("Falha ao carregar inteligência de reconhecimento facial.");
    }
  },

  /**
   * Detects a face in a static image (Base64 or HTMLImageElement) and returns the descriptor.
   * Used during Member Registration.
   */
  getDescriptorFromImage: async (imageSrc: string): Promise<Float32Array | null> => {
    const img = await faceapi.fetchImage(imageSrc);
    // Use SSD MobileNet for registration as it's more accurate than TinyFace
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    
    if (!detection) {
      return null;
    }
    return detection.descriptor;
  },

  /**
   * Detects a face in a video element stream.
   * Used during Check-in.
   */
  detectFaceInVideo: async (videoEl: HTMLVideoElement) => {
    // Use TinyFaceDetector for real-time performance on mobile
    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
      
    return detection;
  },

  /**
   * Finds the best match for a detected face among registered members.
   */
  findMatch: (descriptor: Float32Array, members: Member[]): { member: Member, distance: number } | null => {
    if (members.length === 0) return null;

    // Filter members that actually have descriptors
    const validMembers = members.filter(m => m.faceDescriptor && Array.isArray(m.faceDescriptor));
    
    if (validMembers.length === 0) return null;

    const labeledDescriptors = validMembers.map(m => {
      return new faceapi.LabeledFaceDescriptors(
        m.id,
        [new Float32Array(m.faceDescriptor!)]
      );
    });

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
    const match = faceMatcher.findBestMatch(descriptor);

    if (match.label !== 'unknown') {
      const foundMember = validMembers.find(m => m.id === match.label);
      return foundMember ? { member: foundMember, distance: match.distance } : null;
    }

    return null;
  }
};