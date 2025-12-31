import React from 'react';
import { useStore } from '../services/mockStore';
import { UserRole, UserPlan } from '../types';
import { Star, Shield, Award, Calendar, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, logout, items } = useStore();

  if (!currentUser) return null;

  const myActiveItems = items.filter(i => i.ownerId === currentUser.id && i.status === 'ACTIVE').length;
  
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h2>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
          {currentUser.plan === UserPlan.PREMIUM && (
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Award className="w-3 h-3" /> PREMIUM
            </div>
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name} 
              className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white"
            />
            <button onClick={logout} className="md:hidden bg-gray-100 p-2 rounded-full text-gray-600">
                <LogOut className="w-5 h-5"/>
            </button>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900">{currentUser.name}</h3>
          <p className="text-gray-500 text-sm mb-4">{currentUser.email}</p>
          
          <div className="flex gap-2 mb-6">
            {currentUser.role === UserRole.ADMIN && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                <Shield className="w-3 h-3"/> ADMIN
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1">
              <Calendar className="w-3 h-3"/> Membro desde {new Date(currentUser.joinedAt).getFullYear()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-6 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{currentUser.reputation}</div>
              <div className="text-xs text-gray-500 uppercase font-semibold flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Reputação
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{currentUser.tradesCompleted}</div>
              <div className="text-xs text-gray-500 uppercase font-semibold">Trocas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{myActiveItems}</div>
              <div className="text-xs text-gray-500 uppercase font-semibold">Ativos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-6 flex items-center justify-between border border-indigo-100">
        <div>
          <h4 className="font-bold text-indigo-900">Plano {currentUser.plan}</h4>
          <p className="text-sm text-indigo-700">
            {currentUser.plan === UserPlan.FREE ? 'Faça upgrade para ter destaques grátis!' : 'Você tem acesso total aos recursos.'}
          </p>
        </div>
        {currentUser.plan === UserPlan.FREE && (
           <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">Assinar</button>
        )}
      </div>
    </div>
  );
};