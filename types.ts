
export enum ViewState {
  AUTH = 'AUTH',
  MAIN = 'MAIN',
  ADMIN = 'ADMIN'
}

export enum AppTab {
  CATALOGO = 'CATALOGO',
  ANUNCIO = 'ANUNCIO',
  NEGOCIACAO = 'NEGOCIACAO',
  DESAFIO = 'DESAFIO', // Ranking/Podium
  PERFIL = 'PERFIL'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  FINANCEIRO = 'FINANCEIRO'
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export type AdStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'ACTIVE' | 'PENDING_AI' | 'TRADED';
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SENT';
export type AdType = 'TRADE' | 'SELL' | 'BOTH';
export type ProductCondition = 'novo' | 'usado';
export type ProposalStatus = 'OPEN' | 'WON' | 'LOST' | 'PENDING';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  recoveryCode?: string;
  recoveryExpires?: number;
  cpf?: string;
  avatar: string;
  role: UserRole;
  plan: UserPlan;
  accountStatus: AccountStatus;
  documentStatus: DocumentStatus;
  planStartedAt?: number;
  isVerified: boolean;
  reputationScore: number;
  vistoTutorial?: boolean;
  credits: number; 
  balance: number;
  createdAt: number;
  cidade?: string;
  estado?: string;
  bairro?: string;
  dataNascimento?: string;
  whatsapp?: string;
  bio?: string;
  fotoDocumento?: string; // Base64
  
  // Computed/UI fields
  joinedAt: number;
  tradesCompleted: number;
  reputation: number;
  avatarUrl: string;
}

export interface Ad {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRegion: string;
  ownerVerified?: boolean;
  videoUrl: string;
  imageUrl?: string;
  title: string;
  description: string;
  tradeInterest: string;
  value: number;
  type: AdType;
  category: string;
  condition: ProductCondition;
  status: AdStatus;
  moderationReason?: string;
  likes: number;
  rating: number;
  views: number;
  isHighlight: boolean;
  highlightExpiresAt?: number;
  createdAt: number;
  rejectionReason?: string;
}

export interface Proposal {
  id: string;
  adId: string;
  adTitle: string;
  adVideoUrl?: string;
  adOwnerId: string;
  bidderId: string; 
  bidderName: string;
  message: string;
  offerValue?: number;
  offerItems?: string;
  status: ProposalStatus;
  contactUnlocked: boolean;
  createdAt: number;
  lastMessageAt?: number;
}

export interface ChatMessage {
  id: string;
  proposalId: string;
  senderId: string;
  text: string;
  type?: 'text' | 'image'; 
  mediaUrl?: string; 
  createdAt: number;
  read: boolean;
  timestamp: number;
  content?: string; // Alias for text if needed, or update usage
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'UNLOCK_CONTACT' | 'HIGHLIGHT_24H' | 'HIGHLIGHT_7D' | 'PREMIUM_SUB' | 'NEGOTIATION_FEE' | string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentId?: number;
  targetId?: string;
  createdAt: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string;
  details: string;
  timestamp: number;
  type: string;
  message: string;
}

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  confidence: number;
}

export interface Chat {
  id: string;
  participants: string[];
  itemId?: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

export interface Trade {
  id: string;
  adId: string;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: number;
}

export type Item = Ad;
export type Log = AdminLog;
