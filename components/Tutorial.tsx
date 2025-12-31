import React, { useState } from 'react';

interface TutorialProps {
  onFinish: () => void;
}

const steps = [
  {
    icon: '🚀',
    title: 'BEM-VINDO À ELITE',
    description: 'Você acaba de entrar no maior ecossistema de trocas profissionais do Brasil. Aqui a moeda é a confiança.',
    color: 'bg-indigo-600'
  },
  {
    icon: '🎥',
    title: 'VÍDEOS REAIS',
    description: 'No EXPLORER você vê vídeos reais dos itens. Sem fotos enganosas, apenas a realidade do que você quer trocar.',
    color: 'bg-slate-900'
  },
  {
    icon: '➕',
    title: 'ANUNCIE EM SEGUNDOS',
    description: 'Grave um vídeo de 35s do seu item, fale o que busca e pronto. Nossa IA ajuda você com os detalhes.',
    color: 'bg-indigo-600'
  },
  {
    icon: '🛡️',
    title: 'SEGURANÇA TOTAL',
    description: 'Negocie pelo chat e marque encontros apenas em locais públicos e seguros. Protegemos sua jornada.',
    color: 'bg-slate-900'
  },
  {
    icon: '🏆',
    title: 'O PODIUM É SEU',
    description: 'Sua honestidade gera pontos e avaliações. Quanto melhor você troca, mais alto você sobe no Podium.',
    color: 'bg-amber-500'
  }
];

const Tutorial: React.FC<TutorialProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
      setIsExiting(true);
      setTimeout(onFinish, 500);
  };

  const step = steps[currentStep];

  return (
    <div className={`fixed inset-0 z-[5000] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center text-center p-8 space-y-8 transition-all duration-300">
        
        {/* Icon Header */}
        <div className={`w-32 h-32 ${step.color} rounded-[2rem] flex items-center justify-center text-6xl shadow-2xl transition-all duration-500 transform ${isExiting ? 'scale-0' : 'scale-100'}`}>
          <span className="animate-bounce">{step.icon}</span>
        </div>
        
        {/* Text Content */}
        <div className="space-y-4 min-h-[160px] flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter leading-none animate-pulse">
            {step.title}
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed px-2">
            {step.description}
          </p>
        </div>

        {/* Indicators */}
        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}></div>
          ))}
        </div>

        {/* Buttons */}
        <button 
          onClick={next}
          className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-slate-800"
        >
          {currentStep === steps.length - 1 ? 'COMEÇAR AGORA ⚡' : 'PRÓXIMO'}
        </button>
        
        {currentStep < steps.length - 1 && (
          <button 
            onClick={finish}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Pular Guia
          </button>
        )}
      </div>
    </div>
  );
};

export default Tutorial;