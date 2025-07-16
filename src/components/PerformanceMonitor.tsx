import React, { useEffect, useState, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const measurePerformance = (currentTime: number) => {
      frameCount.current++;
      
      if (currentTime - lastTime.current >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        const avgFrameTime = (currentTime - lastTime.current) / frameCount.current;
        
        setFps(currentFps);
        setFrameTime(Math.round(avgFrameTime));
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationId.current = requestAnimationFrame(measurePerformance);
    };

    animationId.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 left-4 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm z-50">
      <div className="font-mono">
        <div className={`${getPerformanceColor(fps)}`}>
          FPS: {fps}
        </div>
        <div className="text-gray-400">
          Frame: {frameTime}ms
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 