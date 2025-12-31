import React, { useState } from 'react';
import { useStore } from '../services/mockStore';
import { Ad } from '../types';
import AdsView from './AdsView';
import { Plus, Filter, Trash2, Edit, Eye, Clock, AlertCircle, Video, Zap, Star } from './IconComponents';

export const Trades: React.FC = () => {
  const { currentUser, items, deleteItem } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [boostAd, setBoostAd] = useState<Ad | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'HISTORY'>('ALL');

  // Filter logic
  const myItems = items.filter(i => i.ownerId === currentUser?.id);
  const filteredItems = myItems.filter(i => {
      if (filter === 'ALL') return true;
      if (filter === 'ACTIVE') return i.status === 'ACTIVE';
      if (filter === 'PENDING') return i.status === 'PENDING' || i.status === 'PENDING_AI';
      if (filter === 'HISTORY') return i.status === 'TRADED' || i.status === 'REJECTED';
      return true;
  });

  const handleCreate = () => {
      setEditingAd(null);
      setBoostAd(null);
      setShowCreate(true);
  };

  const handleEdit = (ad: Ad) => {
      if (window.confirm("Editar este anúncio enviará ele novamente para moderação. Deseja continuar?")) {
        setEditingAd(ad);
        setShowCreate(true);
      }
  };

  const handleBoost = (ad: Ad) => {
      setBoostAd(ad);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Tem certeza que deseja EXCLUIR DEFINITIVAMENTE este anúncio? Essa ação não pode ser desfeita.")) {
          try {
            await deleteItem(id);
          } catch (e) {
            alert("Erro ao excluir. Tente novamente.");
          }
      }
  };

  // If we are in "Create/Edit/Boost" mode, render AdsView
  if (showCreate || editingAd || boostAd) {
      return (
          <AdsView 
             user={currentUser}
             onCancel={() => { setShowCreate(false); setEditingAd(null); setBoostAd(null); }}
             onSuccess={() => { setShowCreate(false); setEditingAd(null); setBoostAd(null); }}
             editingAd={editingAd || boostAd}
             initialStep={boostAd ? 'visibility' : undefined}
          />
      );
  }

  // Dashboard View
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#020617] text-white p-6 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Minhas Trocas</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gerencie seus ativos</p>
            </div>
            <button 
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-all border border-indigo-400/20"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
                { id: 'ALL', label: 'Todos' },
                { id: 'ACTIVE', label: 'No Ar' },
                { id: 'PENDING', label: 'Análise' },
                { id: 'HISTORY', label: 'Histórico' }
            ].map(f => (
                <button 
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === f.id ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'}`}
                >
                    {f.label}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-500 font-bold text-sm uppercase">Nenhum item encontrado</p>
                <button onClick={handleCreate} className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                    Criar meu primeiro anúncio
                </button>
            </div>
        ) : (
            filteredItems.map(item => (
                <div key={item.id} className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 hover:bg-slate-800/50 transition-colors group relative overflow-hidden">
                    
                    {/* Top Status Bar (Mobile) */}
                    <div className="flex justify-between items-center md:hidden mb-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            item.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {item.status === 'ACTIVE' ? 'NO AR' : item.status === 'REJECTED' ? 'RECUSADO' : 'EM ANÁLISE'}
                        </span>
                        {item.isHighlight && <Zap className="w-4 h-4 text-amber-500 fill-current" />}
                    </div>

                    <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-32 rounded-2xl bg-black overflow-hidden relative flex-shrink-0 border border-white/5 shadow-lg">
                            {item.videoUrl ? (
                                <video src={item.videoUrl} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <img src={item.imageUrl} className="w-full h-full object-cover opacity-80" />
                            )}
                            {item.status === 'PENDING' || item.status === 'PENDING_AI' ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
                                </div>
                            ) : null}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase italic truncate">{item.title}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{item.category} • {item.condition}</p>
                                <p className="text-xs font-bold text-white mt-1">R$ {item.value}</p>
                                
                                {/* Stats */}
                                <div className="flex gap-3 mt-3 bg-black/20 p-2 rounded-lg inline-flex border border-white/5">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                        <Eye className="w-3 h-3" /> {item.views}
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                        <Star className="w-3 h-3 text-amber-500" /> {item.rating.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            {/* Status Message Desktop */}
                            <div className="hidden md:block mt-2">
                                {item.status === 'PENDING_AI' && (
                                    <span className="text-[9px] text-yellow-500 font-bold uppercase flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Em análise
                                    </span>
                                )}
                                {item.status === 'REJECTED' && (
                                    <span className="text-[9px] text-red-500 font-bold uppercase flex items-center gap-1 truncate">
                                        <AlertCircle className="w-3 h-3" /> {item.rejectionReason || 'Violação de Termos'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 mt-4 md:mt-0 md:border-l md:border-white/5 md:pl-4 justify-end">
                        {item.status === 'ACTIVE' && (
                            <button onClick={() => handleBoost(item)} className="flex-1 md:flex-none px-4 py-2 bg-amber-500 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                                Impulsionar 🚀
                            </button>
                        )}
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)} className="flex-1 md:flex-none p-2 bg-white/5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 flex items-center justify-center gap-1">
                                <Edit className="w-4 h-4" /> <span className="md:hidden text-[9px] font-bold uppercase">Editar</span>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="flex-1 md:flex-none p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/10 flex items-center justify-center gap-1">
                                <Trash2 className="w-4 h-4" /> <span className="md:hidden text-[9px] font-bold uppercase">Excluir</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Trades;