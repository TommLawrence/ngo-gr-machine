
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isActive || !stream || !canvasRef.current) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioContext;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    // Higher fftSize for smoother time-domain waveform
    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;
      animationRef.current = requestAnimationFrame(draw);
      
      // Get time domain data for a true waveform look
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;

      ctx.lineWidth = 2;
      
      // Gradient matching the professional NGO blue theme
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)'); // blue-600 low opac
      gradient.addColorStop(0.5, 'rgba(37, 99, 235, 1)');  // blue-600 full opac
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.2)');  // blue-600 low opac
      
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Add a subtle glow effect to the line
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stream, isActive]);

  return (
    <div className={`w-full h-16 transition-all duration-500 rounded-xl overflow-hidden bg-blue-50/30 border border-blue-100/50 flex items-center justify-center ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={64} 
        className="w-full h-full"
      />
    </div>
  );
};
