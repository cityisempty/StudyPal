import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("无法访问相机，请检查权限设置。");
      onClose();
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64, 'image/jpeg');
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 flex justify-end">
        <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700">
          <X size={24} />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-grow relative flex items-center justify-center overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-8 pb-12 bg-black bg-opacity-80 flex justify-between items-center">
        <div className="w-12"></div> {/* Spacer */}
        
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative hover:bg-gray-800 transition-colors"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>

        <button onClick={toggleCamera} className="text-white p-3 rounded-full hover:bg-gray-800">
           <SwitchCamera size={28} />
        </button>
      </div>
    </div>
  );
};

export default CameraModal;