import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/mockStore';
import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { Chat as ChatType } from '../types';

export const Chat: React.FC = () => {
  const { chats, currentUser, users, items, sendMessage } = useStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myChats = chats.filter(c => currentUser && c.participants.includes(currentUser.id));
  
  const selectedChat = chats.find(c => c.id === selectedChatId);
  const selectedItem = items.find(i => i.id === selectedChat?.itemId);

  const getOtherUser = (chat: ChatType) => {
    const otherId = chat.participants.find(p => p !== currentUser?.id);
    return users.find(u => u.id === otherId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;
    sendMessage(selectedChatId, inputText);
    setInputText('');
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen bg-white">
      {/* Sidebar List */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`}>
        <div className="p-4 border-b font-bold text-lg text-gray-800">Mensagens</div>
        <div className="overflow-y-auto flex-1">
          {myChats.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">Nenhuma conversa iniciada.</div>}
          {myChats.sort((a,b) => b.lastUpdated - a.lastUpdated).map(chat => {
            const other = getOtherUser(chat);
            const item = items.find(i => i.id === chat.itemId);
            return (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChatId(chat.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedChatId === chat.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={other?.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{other?.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{item?.title}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{chat.messages[chat.messages.length - 1]?.content || 'Inicie a conversa...'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full`}>
            {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
            <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChatId(null)} className="md:hidden text-gray-500 text-sm font-medium">← Voltar</button>
                <img src={getOtherUser(selectedChat)?.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                <div>
                    <h3 className="font-bold text-gray-800">{getOtherUser(selectedChat)?.name}</h3>
                    <span className="text-xs text-indigo-600 font-medium">Negociando: {selectedItem?.title}</span>
                </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {selectedChat.messages.map(msg => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                placeholder="Digite sua mensagem..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-transform active:scale-95">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col text-gray-400 bg-gray-50">
          <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
          <p>Selecione uma conversa para negociar com segurança.</p>
        </div>
      )}
    </div>
  );
};