import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RefreshCcw, Mic } from 'lucide-react';

interface VideoRecorderProps {
  onCapture: (blob: Blob, url: string) => void;
  onClose: () => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]); 
  
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(35); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (recording && countdown > 0) {
      interval = window.setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && recording) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [recording, countdown]);

  const cleanup = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
      }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      // Configuração otimizada para Mobile (Portrait 9:16)
      // Tenta forçar resolução HD mas aceita o que a câmera der para evitar erro
      const constraints: MediaStreamConstraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        },
        video: {
            facingMode: 'environment',
            width: { ideal: 720 }, 
            height: { ideal: 1280 }
            // Aspect ratio não é forçado para evitar cortes em dispositivos antigos
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Necessário para evitar microfonia
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      setErrorMsg("Erro ao acessar câmera. Verifique permissões ou tente outro navegador.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    // Lista de prioridade de Codecs para evitar vídeo preto
    const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
    ];
    
    // Tenta encontrar o melhor formato suportado pelo navegador
    let selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    
    // Fallback genérico se nenhum específico for encontrado
    const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
    
    try {
        const recorder = new MediaRecorder(streamRef.current, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            // Cria o blob final. Se o mimeType selecionado for vazio, deixa o browser decidir (geralmente webm)
            const type = selectedMime || 'video/webm';
            const blob = new Blob(chunksRef.current, { type });
            
            // Cria URL para preview imediato
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            
            // Pausa a câmera para economizar bateria
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach(t => t.stop());
            }
        };

        // Grava em chunks de 1 segundo para garantir que dados sejam salvos se crashar
        recorder.start(1000); 
        setRecording(true);
    } catch (e: any) {
        console.error(e);
        setErrorMsg("Falha ao iniciar gravador. Tente fechar outros apps.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const confirmVideo = () => {
    if (previewUrl && chunksRef.current.length > 0) {
      // Garante que o Blob tenha o tipo correto
      const type = mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      onCapture(blob, previewUrl);
    }
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    chunksRef.current = [];
    setCountdown(35);
    setRecording(false);
    startCamera(); 
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col h-[100dvh]">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <div className="pointer-events-auto">
            {recording ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-900/50">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-white font-mono font-bold text-xs tracking-wider">GRAVANDO</span>
                    </div>
                    <span className="text-white font-black text-3xl drop-shadow-md ml-1 font-mono">{countdown}s</span>
                </div>
            ) : (
                <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-white/80 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                    Câmera
                </div>
            )}
         </div>

         <button onClick={onClose} className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform hover:bg-white/10">
            <X className="w-6 h-6" />
         </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90 p-6 text-center">
                <p className="text-red-400 font-bold mb-4">{errorMsg}</p>
                <button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase">Fechar</button>
            </div>
        )}

        {!previewUrl ? (
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               webkit-playsinline="true"
               muted 
               className={`w-full h-full object-cover transition-opacity duration-300 ${recording ? 'opacity-100' : 'opacity-80'}`} 
             />
        ) : (
             <video 
                src={previewUrl} 
                controls 
                playsInline 
                webkit-playsinline="true"
                className="w-full h-full object-contain bg-black" 
             />
        )}
        
        {/* Guides Overlay */}
        {!previewUrl && !recording && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
                <div className="w-[70%] h-[60%] border-2 border-white/30 rounded-3xl border-dashed"></div>
            </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-32 bg-black/90 backdrop-blur-xl flex justify-center items-center gap-12 pb-safe border-t border-white/10 z-20">
         {!previewUrl ? (
            !recording ? (
                <button 
                    onClick={startRecording} 
                    className="w-20 h-20 rounded-full border-[4px] border-white/20 flex items-center justify-center group active:scale-95 transition-all relative"
                >
                    <div className="w-16 h-16 bg-red-600 rounded-full group-hover:scale-95 transition-transform shadow-[0_0_30px_rgba(220,38,38,0.6)]"></div>
                </button>
            ) : (
                <button 
                    onClick={stopRecording} 
                    className="w-20 h-20 rounded-full border-[4px] border-red-500/50 flex items-center justify-center active:scale-95 transition-all"
                >
                    <div className="w-8 h-8 bg-red-500 rounded-md animate-pulse"></div>
                </button>
            )
         ) : (
            <>
                <button onClick={retake} className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center active:scale-90 transition-all">
                        <RefreshCcw className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] uppercase font-black tracking-wider">Refazer</span>
                </button>

                <button onClick={confirmVideo} className="flex flex-col items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-90 transition-all border border-green-400/50">
                        <Check className="w-8 h-8 text-black" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider">Usar</span>
                </button>
            </>
         )}
      </div>
    </div>
  );
};

export default VideoRecorder;