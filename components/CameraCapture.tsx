import React, { useRef, useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // USEREF para garantir persistência do objeto stream entre renders e cleanup
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        streamRef.current = s;
        if (videoRef.current) {
            videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access error", err);
        alert("Erro ao abrir câmera. Verifique as permissões.");
        handleClose();
      }
    };
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
              t.stop();
              t.enabled = false;
          });
          streamRef.current = null;
      }
  };

  const handleClose = () => {
      stopCamera();
      onClose();
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera(); // Stop before closing
        onCapture(base64);
        // onClose is called by parent usually, but we ensure stream is dead first
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute w-full h-full object-cover" />
        
        {/* Guide Frame for Document */}
        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
             <div className="w-[85%] aspect-[1.58] border-2 border-white/50 rounded-lg relative">
                 <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                 <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
             </div>
        </div>

        <button onClick={handleClose} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white z-20">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-black p-8 pb-safe flex justify-center">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center active:scale-90 transition-transform"
        >
            <Camera className="w-8 h-8 text-black" />
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;