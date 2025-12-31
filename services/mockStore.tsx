import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Item, Chat, Trade, Log, Transaction, Ad, Proposal, ChatMessage } from '../types';
import { 
  getAllUsers, 
  getAds, 
  getAllProposals, 
  getAllTransactions, 
  getAdminLogs, 
  subscribeToData,
  registerUser,
  loginAuth,
  createAd as firebaseCreateAd,
  updateAdStatus,
  sendMessage as firebaseSendMessage,
  toggleUserBlock as firebaseToggleBlock,
  verifyUserDocument as firebaseVerifyDoc,
  hardResetDB,
  markTutorialSeen as firebaseMarkTutorial,
  logoutAuth,
  getMessages,
  uploadMedia as firebaseUploadMedia,
  deleteAd as firebaseDeleteAd,
  deleteUser as firebaseDeleteUser
} from './mockFirebase';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  items: Item[];
  chats: Chat[];
  trades: Trade[];
  transactions: Transaction[];
  logs: Log[];
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  setSessionUser: (user: User) => void; 
  logout: () => void;
  addItem: (item: any) => Promise<void>;
  createAd: (ad: Item) => Promise<void>;
  updateItemStatus: (id: string, status: Item['status'], reason?: string) => void;
  deleteItem: (id: string) => Promise<void>;
  deleteUserMember: (uid: string) => Promise<void>;
  addChat: (itemId: string, participantIds: string[]) => string;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image', mediaUrl?: string) => void;
  markTutorialSeen: () => void;
  toggleUserBlock: (adminId: string, userId: string) => void;
  verifyUserDocument: (adminId: string, userId: string, approved: boolean) => void;
  resetSystem: () => Promise<void>;
  isLoading: boolean;
  uploadMedia: (file: Blob, path: string) => Promise<string>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core function to map Firestore raw data to UI state
  const loadData = () => {
    const allUsers = getAllUsers();
    const allAds = getAds(); // Gets all ads regardless of status for store, components filter later
    const allProposals = getAllProposals();
    const allTransactions = getAllTransactions();
    const allLogs = getAdminLogs();

    setUsers(allUsers);
    setItems(allAds);
    setTransactions(allTransactions);
    setLogs(allLogs);
    
    // Sync Current User Session with Realtime Data
    if (currentUser) {
        const updatedUser = allUsers.find(u => u.id === currentUser.id);
        if (updatedUser) {
            if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                setCurrentUser(updatedUser);
            }
        }
    }

    const constructedChats: Chat[] = allProposals.map(p => {
        const msgs = getMessages(p.id);
        return {
            id: p.id,
            participants: [p.bidderId, p.adOwnerId],
            itemId: p.adId,
            messages: msgs,
            lastUpdated: p.lastMessageAt || p.createdAt
        };
    });
    
    setChats(constructedChats);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToData(() => {
        loadData();
    });
    return () => unsubscribe();
  }, []); 

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
        const user = await loginAuth(email, pass);
        setSessionUser(user);
        return true;
    } catch (e) {
        console.error("Login failed", e);
        return false;
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    try {
        const user = await registerUser({ name, email }, pass);
        setSessionUser(user);
        return true;
    } catch (e) {
        console.error("Register failed", e);
        return false;
    }
  };

  const setSessionUser = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('tt_session_id', user.id);
  };

  const logout = async () => {
      await logoutAuth();
      setCurrentUser(null);
      localStorage.removeItem('tt_session_id');
  };

  const addItem = async (itemData: any) => {
      if (!currentUser) return;
      const ad: Ad = {
          ...itemData,
          id: `ad_${Date.now()}`,
          ownerId: currentUser.id,
          createdAt: Date.now(),
          status: 'PENDING', 
          likes: 0, rating: 0, views: 0, isHighlight: false,
          ownerName: currentUser.name,
          ownerAvatar: currentUser.avatarUrl
      };
      // Optimistic update
      setItems(prev => [ad, ...prev]);
      await firebaseCreateAd(ad);
  };

  const createAd = async (ad: Item) => {
      // Optimistic update
      setItems(prev => [ad, ...prev]);
      await firebaseCreateAd(ad);
  };

  const updateItemStatus = (id: string, status: Item['status'], reason?: string) => {
      // Optimistic Update: Update UI immediately
      setItems(prevItems => prevItems.map(item => 
          item.id === id ? { ...item, status: status, moderationReason: reason } : item
      ));
      
      // Call Backend
      updateAdStatus(currentUser?.id || 'sys', id, status, reason);
  };

  const deleteItem = async (id: string) => {
      try {
          // Optimistic update
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          await firebaseDeleteAd(id);
      } catch (e) {
          console.error("Failed to delete item", e);
          // If needed, reload data here to revert
          loadData();
          throw e;
      }
  };

  const deleteUserMember = async (uid: string) => {
      try {
          // Optimistic update
          setUsers(prevUsers => prevUsers.filter(u => u.id !== uid));
          // Remove ads from deleted user optimistically
          setItems(prevItems => prevItems.filter(i => i.ownerId !== uid));
          
          await firebaseDeleteUser(uid);
      } catch (e) {
          console.error("Failed to delete user", e);
          loadData();
          throw e;
      }
  };

  const toggleUserBlock = (adminId: string, userId: string) => {
      // Optimistic Update
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, accountStatus: u.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' };
          }
          return u;
      }));
      firebaseToggleBlock(adminId, userId);
  };

  const verifyUserDocument = (adminId: string, userId: string, approved: boolean) => {
      // Optimistic Update
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { 
                  ...u, 
                  isVerified: approved, 
                  documentStatus: approved ? 'VERIFIED' : 'REJECTED' 
              };
          }
          return u;
      }));
      firebaseVerifyDoc(adminId, userId, approved);
  };

  const markTutorialSeen = () => {
      if (currentUser) firebaseMarkTutorial(currentUser.id);
  };

  const resetSystem = async () => {
      try {
        await hardResetDB();
        setItems([]);
        setUsers([]);
        setChats([]);
        await logout();
      } catch (e) {
        console.error("System reset failed", e);
        alert("Erro ao resetar o sistema. Verifique o console.");
      }
  };

  const addChat = () => "0"; 
  
  const sendMessage = (chatId: string, content: string, type: 'text'|'image' = 'text', mediaUrl?: string) => {
      if (currentUser) {
          firebaseSendMessage(chatId, currentUser.id, content, type, mediaUrl);
      }
  };

  const uploadMedia = async (file: Blob, path: string) => {
      return firebaseUploadMedia(file, path);
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, items, chats, trades, transactions, logs,
      login, register, logout, setSessionUser,
      addItem, createAd, updateItemStatus, deleteItem, deleteUserMember, addChat, sendMessage,
      markTutorialSeen, toggleUserBlock, verifyUserDocument,
      resetSystem, isLoading, uploadMedia
    }}>
      {children}
    </StoreContext.Provider>
  );
};