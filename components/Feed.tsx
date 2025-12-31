import React, { useState } from 'react';
import { useStore } from '../services/mockStore';
import { Item } from '../types';
import { Search, Star, MessageCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';

export const Feed: React.FC<{ onChat: (item: Item) => void }> = ({ onChat }) => {
  const { items, users } = useStore();
  
  // Filter active items, prioritize highlights
  const activeItems = items
    .filter(i => i.status === 'ACTIVE')
    .sort((a, b) => {
        if (a.isHighlight && !b.isHighlight) return -1;
        if (!a.isHighlight && b.isHighlight) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getUser = (id: string) => users.find(u => u.id === id);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 sticky top-0 md:relative z-10 bg-gray-50/95 backdrop-blur-sm py-2 md:py-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Explorar <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-400" />
            </h2>
            <p className="text-sm text-gray-500 hidden md:block">Encontre as melhores ofertas perto de você.</p>
        </div>
        <div className="relative w-full md:w-auto">
            <input 
                type="text" 
                placeholder="O que você procura?" 
                className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm w-full md:w-72 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {activeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Tudo calmo por aqui...</h3>
          <p className="text-gray-500 text-center max-w-xs mt-2">Nenhuma oferta disponível no momento. Que tal ser o primeiro?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeItems.map(item => {
            const owner = getUser(item.ownerId);
            return (
              <div key={item.id} className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col ${item.isHighlight ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-100'}`}>
                {/* Image Section */}
                <div className="relative h-56 bg-gray-100 overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      {item.isHighlight && (
                        <div className="bg-yellow-400 text-yellow-950 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md">
                          <Star className="w-3 h-3 fill-current" /> DESTAQUE
                        </div>
                      )}
                  </div>
                  
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-lg">
                        {item.category}
                    </span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">{item.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={owner?.avatarUrl} alt={owner?.name} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[100px]">{owner?.name}</span>
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                             <Star className="w-3 h-3 text-yellow-500 fill-current"/>
                             <span className="font-medium">{owner?.reputation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                        onClick={() => onChat(item)}
                        className="bg-gray-900 hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center" title="Negociar">
                        <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};