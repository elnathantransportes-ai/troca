import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{
    id: number;
    x: string;
    y: string;
    color: string;
    rotation: number;
    scale: number;
    style: any;
  }[]>([]);

  useEffect(() => {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ffffff'];
    const particleCount = 100;
    
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      // Physics for explosion
      const angle = Math.random() * Math.PI * 2;
      const velocity = 20 + Math.random() * 60; // Explosive distance
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity; // Negative is up
      
      const rotation = Math.random() * 720;
      
      return {
        id: i,
        x: '50%',
        y: '50%',
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation,
        scale: 0.5 + Math.random(),
        style: {
            '--tx': `${tx}vw`,
            '--ty': `${ty}vh`,
            '--rot': `${rotation}deg`,
            '--color': colors[Math.floor(Math.random() * colors.length)]
        }
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm animate-explode opacity-0"
          style={{
            backgroundColor: p.color,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
            ...p.style
          }}
        />
      ))}
      <style>{`
        @keyframes explode {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg) scale(0); 
            opacity: 1; 
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); 
            opacity: 0; 
          }
        }
        .animate-explode {
          animation: explode 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Confetti;