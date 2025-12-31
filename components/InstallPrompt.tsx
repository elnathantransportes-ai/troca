import React, { useState, useEffect } from 'react';
import { Share2, PlusSquare, X } from './IconComponents';

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Check OS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(isIosDevice);

    // Android/Desktop PWA Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay to not be annoying immediately
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Prompt Logic (Show if not standalone and on iOS)
    if (isIosDevice && !isStandalone) {
       // Check if we haven't shown it recently
       const lastShown = localStorage.getItem('installPromptShown');
       if (!lastShown || Date.now() - parseInt(lastShown) > 86400000) { // 24h
           setTimeout(() => setShowPrompt(true), 5000);
       }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  const handleClose = () => {
      setShowPrompt(false);
      localStorage.setItem('installPromptShown', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <button onClick={handleClose} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
      
      <div className="flex items-start gap-4">
         <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">T</div>
         <div className="flex-1">
             <h4 className="text-sm font-black text-white uppercase italic">Instalar Troca Troca</h4>
             <p className="text-[10px] text-slate-400 mt-1 leading-tight">Adicione à tela de início para uma experiência em tela cheia e acesso rápido.</p>
             
             {isIOS ? (
                 <div className="mt-3 text-[10px] text-slate-300 bg-white/5 p-2 rounded-lg border border-white/5">
                     Toque em <span className="inline-flex align-middle"><Share2 className="w-3 h-3 mx-1 text-blue-400"/></span> e depois em <span className="font-bold text-white">"Adicionar à Tela de Início"</span> <span className="inline-flex align-middle"><PlusSquare className="w-3 h-3 mx-1"/></span>
                 </div>
             ) : (
                 <button 
                    onClick={handleInstallClick}
                    className="mt-3 bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
                 >
                    Instalar App
                 </button>
             )}
         </div>
      </div>
    </div>
  );
};

export default InstallPrompt;