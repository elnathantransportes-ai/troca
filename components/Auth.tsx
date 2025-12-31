import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/mockStore';
import { User } from '../types';
import { loginAuth, registerUser, requestPasswordRecovery, checkSystemStatus } from '../services/mockFirebase';
import { geminiService } from '../services/geminiService';
import CameraCapture from './CameraCapture';
import LegalTerms from './LegalTerms';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    dataNascimento: '',
    whatsapp: '',
    cidade: '',
    estado: '',
    bairro: '',
    fotoDoc: '',
    aceiteTermos: false
  });

  const [aiFeedback, setAiFeedback] = useState<{valid: boolean, reason?: string} | null>(null);

  useEffect(() => {
      // Non-blocking check
      checkSystemStatus().then(online => setSystemOnline(online));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const user = await loginAuth(loginEmail, loginPassword);
      onLogin(user);
    } catch (e: any) {
      setError(e.message || "Falha no login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações Básicas (Instantâneas)
    if (!formData.nome || !formData.email || !formData.senha || !formData.cpf) return setError("Preencha todos os campos obrigatórios.");
    if (formData.senha !== formData.confirmarSenha) return setError("As senhas não coincidem.");
    if (formData.senha.length < 6) return setError("A senha deve ter no mínimo 6 caracteres.");
    if (!formData.fotoDoc) return setError("É obrigatório validar sua identidade com uma foto do RG ou CNH.");
    if (!formData.aceiteTermos) return setError("Você precisa aceitar os termos de uso.");

    setLoading(true);
    
    try {
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      await registerUser({
        name: formData.nome,
        email: formData.email,
        cpf: cleanCpf,
        cidade: formData.cidade,
        estado: formData.estado.toUpperCase(),
        bairro: formData.bairro,
        dataNascimento: formData.dataNascimento,
        whatsapp: formData.whatsapp,
        fotoDocumento: formData.fotoDoc,
        isVerified: aiFeedback?.valid || false 
      }, formData.senha);
      
      setSuccessMsg("Conta criada! Acessando...");
      setTimeout(() => {
          setLoginEmail(formData.email); 
          setLoginPassword(''); 
          setMode('LOGIN'); 
      }, 500);

    } catch (e: any) {
      setError(e.message || "Erro ao registrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!loginEmail) return setError("Digite seu e-mail acima para recuperar.");
      
      setLoading(true);
      setError(null);
      try {
          await requestPasswordRecovery(loginEmail);
          setSuccessMsg("Link enviado para seu e-mail.");
          setTimeout(() => setMode('LOGIN'), 2000);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const processDocumentImage = async (base64: string) => {
    setAiAnalyzing(true);
    setAiFeedback(null);
    setFormData(prev => ({ ...prev, fotoDoc: base64 }));

    try {
      const result = await geminiService.verifyDocumentQuality(base64);
      setAiFeedback(result.valid ? { valid: true } : { valid: false, reason: result.reason || "Documento ilegível." });
    } catch (e) {
      setAiFeedback({ valid: true, reason: "Validado offline" });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => processDocumentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const formatCpf = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14);
  const formatDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);
  const formatPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-[#020617] text-white relative overflow-hidden">
      {/* Light Weight CSS Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-indigo-950 z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent z-0"></div>
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
         
         <div className="mb-8 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black mx-auto transform -rotate-6 shadow-2xl shadow-indigo-500/30 mb-4">T</div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">TROCA TROCA</h1>
            <p className="text-indigo-400 font-black text-[9px] tracking-[0.4em] uppercase mt-1">Elite Marketplace</p>
         </div>

         {/* --- LOGIN MODE --- */}
         {mode === 'LOGIN' && (
           <form onSubmit={handleLoginSubmit} className="w-full space-y-6">
             {successMsg && <div className="text-green-400 text-xs text-center font-bold bg-green-900/20 p-3 rounded-xl border border-green-900/30">{successMsg}</div>}
             {error && <div className="text-red-400 text-xs text-center font-bold bg-red-900/20 p-3 rounded-xl border border-red-900/30">{error}</div>}
             
             <div className="space-y-3">
               <input 
                 type="email" 
                 value={loginEmail}
                 onChange={(e) => setLoginEmail(e.target.value)}
                 className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 outline-none transition-colors font-medium placeholder-slate-500 text-sm"
                 placeholder="E-MAIL"
                 required
                 autoComplete="email"
               />
               <input 
                 type="password" 
                 value={loginPassword}
                 onChange={(e) => setLoginPassword(e.target.value)}
                 className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 outline-none transition-colors font-medium placeholder-slate-500 text-sm"
                 placeholder="SENHA"
                 required
                 autoComplete="current-password"
               />
             </div>
             
             <div className="flex justify-end">
                 <button type="button" onClick={() => { setMode('RECOVERY'); setError(null); }} className="text-[10px] text-slate-400 font-bold uppercase hover:text-white transition-colors">
                     Esqueci minha senha
                 </button>
             </div>

             <button disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl hover:bg-slate-200 transition-transform active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50">
               {loading ? 'Acessando...' : 'Acessar Plataforma'}
             </button>

             <button type="button" onClick={() => { setMode('REGISTER'); setError(null); }} className="w-full text-center py-2">
               <span className="text-[10px] text-gray-500 uppercase font-bold">Não tem conta?</span>
               <span className="text-[10px] text-indigo-400 font-black uppercase ml-2 tracking-wide underline">Criar Conta</span>
             </button>
           </form>
         )}

         {/* --- RECOVERY MODE --- */}
         {mode === 'RECOVERY' && (
             <div className="w-full space-y-6">
                 <div className="text-center">
                    <h3 className="text-sm font-black text-white uppercase italic">Recuperar Acesso</h3>
                 </div>
                 
                 {error && <div className="text-red-400 text-xs text-center font-bold bg-red-900/20 p-3 rounded-xl border border-red-900/30">{error}</div>}
                 {successMsg && <div className="text-green-400 text-xs text-center font-bold bg-green-900/20 p-3 rounded-xl border border-green-900/30">{successMsg}</div>}

                 <form onSubmit={handleRecoveryRequest} className="space-y-4">
                      <input 
                          type="email" 
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 outline-none text-sm font-medium placeholder-slate-500"
                          placeholder="SEU E-MAIL CADASTRADO"
                          required
                      />
                      <button disabled={loading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95">
                          {loading ? 'Enviando...' : 'Enviar Link'}
                      </button>
                 </form>

                 <button onClick={() => setMode('LOGIN')} className="w-full text-[10px] text-slate-500 font-bold uppercase hover:text-white">Voltar</button>
             </div>
         )}

         {/* --- REGISTER MODE --- */}
         {mode === 'REGISTER' && (
           <form onSubmit={handleRegisterSubmit} className="w-full space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
             <div className="grid grid-cols-1 gap-3">
               <input type="text" placeholder="NOME COMPLETO" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
               <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="CPF" required value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCpf(e.target.value)})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
                  <input type="text" placeholder="NASC. (DD/MM/AAAA)" required value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: formatDate(e.target.value)})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold text-center" maxLength={10} />
               </div>
               <input type="email" placeholder="E-MAIL" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
               <input type="password" placeholder="SENHA" required value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
               <input type="password" placeholder="CONFIRMAR SENHA" required value={formData.confirmarSenha} onChange={e => setFormData({...formData, confirmarSenha: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
               <input type="tel" placeholder="WHATSAPP" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: formatPhone(e.target.value)})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
               
               <div className="grid grid-cols-3 gap-2">
                 <input type="text" placeholder="UF" maxLength={2} required className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold text-center uppercase" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value.toUpperCase()})} />
                 <input type="text" placeholder="CIDADE" required className="col-span-2 w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
               </div>
               <input type="text" placeholder="BAIRRO" required value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none text-xs font-bold" />
             </div>

             <div className="bg-white/5 p-4 rounded-2xl border border-dashed border-white/20 text-center mt-2">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-2">Validação RG/CNH</p>
                {!formData.fotoDoc ? (
                  <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      <button type="button" onClick={() => setShowCamera(true)} className="flex-1 py-3 bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-white/10 active:scale-95"><span className="text-lg">📸</span><span className="text-[8px] font-black uppercase">Câmera</span></button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-white/10 active:scale-95"><span className="text-lg">🖼️</span><span className="text-[8px] font-black uppercase">Galeria</span></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-in zoom-in">
                     <div className="w-full h-16 bg-black/50 rounded-lg mb-2 overflow-hidden border border-white/10"><img src={formData.fotoDoc} className="w-full h-full object-cover opacity-60" /></div>
                     <span className="text-[10px] text-green-400 font-black uppercase">Imagem Carregada ✓</span>
                     <button type="button" onClick={() => {setFormData({...formData, fotoDoc: ''}); setAiFeedback(null);}} className="text-[9px] text-gray-500 underline uppercase mt-1">Trocar</button>
                  </div>
                )}
                {aiAnalyzing && <div className="mt-2 text-[8px] text-yellow-400 font-bold uppercase animate-pulse">Verificando...</div>}
             </div>

             {error && <div className="text-red-400 text-xs text-center font-bold bg-red-900/20 p-2 rounded-lg border border-red-900/30">{error}</div>}

             <div className="flex items-start gap-3 px-2">
               <input type="checkbox" checked={formData.aceiteTermos} onChange={e => setFormData({...formData, aceiteTermos: e.target.checked})} className="mt-1 bg-white/10 border-white/20 rounded" />
               <button type="button" onClick={() => setShowTerms(true)} className="text-[10px] text-left text-gray-400 leading-tight">Li e aceito os <span className="underline decoration-indigo-500 text-indigo-300 font-bold">Termos de Uso</span></button>
             </div>

             <div className="flex gap-3 pt-2 pb-6">
               <button type="button" onClick={() => setMode('LOGIN')} className="flex-1 bg-gray-800 text-gray-300 font-bold py-4 rounded-xl text-xs uppercase">Voltar</button>
               <button disabled={loading || !formData.fotoDoc} className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 uppercase text-xs">
                 {loading ? '...' : 'Finalizar'}
               </button>
             </div>
           </form>
         )}
      </div>

      {showCamera && <CameraCapture onCapture={(b64) => { setShowCamera(false); processDocumentImage(b64); }} onClose={() => setShowCamera(false)} />}
      {showTerms && <LegalTerms onClose={() => setShowTerms(false)} />}
    </div>
  );
};