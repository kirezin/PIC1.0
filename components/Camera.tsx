import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraProps {
  onCapture: (base64Image: string) => void;
  active: boolean;
  facingMode?: 'user' | 'environment';
  onVideoReady?: (video: HTMLVideoElement) => void; // Allow parent to access video for analysis
}

export const CameraComponent: React.FC<CameraProps> = ({ onCapture, active, facingMode = 'user', onVideoReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      setError('');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
           videoRef.current?.play();
           if (onVideoReady && videoRef.current) {
               onVideoReady(videoRef.current);
           }
        };
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError('Acesso à câmera negado ou indisponível.');
    }
  };

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, facingMode]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress quality to 0.7 to save localStorage space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
          {error}
        </div>
      ) : (
        <video 
          ref={videoRef}
          playsInline 
          muted 
          className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
        />
      )}
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        {active && !error && (
            <button 
            onClick={capture}
            className="bg-white/90 p-4 rounded-full shadow-lg active:scale-95 transition-transform border-4 border-blue-500"
            aria-label="Capturar Foto"
          >
            <Camera className="w-8 h-8 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  );
};