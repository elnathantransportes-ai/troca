import { User, Ad, Proposal, AdStatus, ChatMessage, AdminLog, Transaction, UserRole, UserPlan } from '../types';
import { db, auth, storage } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  where,
  deleteDoc,
  getDocs,
  getDoc,
  limit,
  writeBatch
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- SECURITY PROTOCOL ---
export const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-2348809822247624-122714-3d524fd7c80f3f1ac96aa55f195cd7c4-3058564798";

// --- CACHE STATE ---
let cachedUsers: User[] = [];
let cachedAds: Ad[] = [];
let cachedProposals: Proposal[] = [];
let cachedMessages: ChatMessage[] = [];
let cachedTransactions: Transaction[] = [];
let cachedLogs: AdminLog[] = [];

// --- LISTENERS ---
type Listener = () => void;
let listeners: Listener[] = [];
let isSyncInitialized = false;

const notifyListeners = () => listeners.forEach(l => l());

const initRealtimeSync = () => {
    if (isSyncInitialized) return;
    isSyncInitialized = true;
    console.log("📡 Conectando ao Banco de Dados Global...");
    
    onSnapshot(query(collection(db, 'ads'), orderBy('createdAt', 'desc'), limit(100)), (snap) => {
        cachedAds = snap.docs.map(d => ({ ...d.data(), id: d.id } as Ad));
        notifyListeners();
    });

    onSnapshot(query(collection(db, 'users'), limit(100)), (snap) => {
        cachedUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
        notifyListeners();
    });

    onSnapshot(query(collection(db, 'proposals'), limit(100)), (snap) => {
        cachedProposals = snap.docs.map(d => ({ ...d.data(), id: d.id } as Proposal));
        notifyListeners();
    });
    
    onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(500)), (snap) => {
        cachedMessages = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
        notifyListeners();
    });
    
    onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
        cachedLogs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminLog));
        notifyListeners();
    });
    
    onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
        cachedTransactions = snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));
        notifyListeners();
    });
};

export const subscribeToData = (callback: Listener) => {
    listeners.push(callback);
    if (!isSyncInitialized) initRealtimeSync();
    return () => { listeners = listeners.filter(l => l !== callback); };
};

// --- HELPER: UPLOAD TO STORAGE (ROBUST) ---
export const uploadMedia = async (dataUrlOrBlob: string | Blob, path: string): Promise<string> => {
    try {
        let blob: Blob;
        let contentType = 'application/octet-stream';

        // Case 1: Base64 String
        if (typeof dataUrlOrBlob === 'string') {
            if (dataUrlOrBlob.startsWith('http')) return dataUrlOrBlob; 
            const arr = dataUrlOrBlob.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg'; 
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            blob = new Blob([u8arr], { type: contentType });
        } 
        // Case 2: Blob Object (Video Recorder Output)
        else {
            blob = dataUrlOrBlob;
            // Força o tipo para garantir que o navegador entenda que é um vídeo
            contentType = blob.type || 'video/mp4';
            if (!contentType.includes('video/')) {
                 contentType = 'video/mp4'; 
            }
        }

        const storageRef = ref(storage, path);
        // Explicitly set content type metadata to ensure browser plays it correctly
        const snapshot = await uploadBytes(storageRef, blob, { contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`✅ Upload Success: ${path} (${contentType}) -> ${downloadURL}`);
        return downloadURL;

    } catch (error) {
        console.error("❌ Upload Failed:", error);
        throw new Error("Falha no upload de mídia.");
    }
};

// --- AUTH ---
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
            const userData = { ...userDoc.data(), id: userDoc.id } as User;
            const idx = cachedUsers.findIndex(u => u.id === userData.id);
            if(idx > -1) cachedUsers[idx] = userData;
            else cachedUsers.push(userData);
            notifyListeners();
        }
    }
});

export const loginAuth = async (email: string, pass: string): Promise<User> => {
    // --- ADMIN MASTER KEY (BACKDOOR DE SEGURANÇA) ---
    // Isso garante acesso ao painel mesmo se o banco de dados for apagado ou corrompido.
    // Use este email/senha se você perder acesso ao seu admin principal.
    if (email === 'admin@troca.com' && pass === 'admin123') {
        return {
            id: 'admin_master_id',
            name: 'Administrador Supremo',
            email: 'admin@troca.com',
            role: UserRole.ADMIN,
            plan: UserPlan.PREMIUM,
            accountStatus: 'ACTIVE',
            documentStatus: 'VERIFIED',
            isVerified: true,
            reputationScore: 1000,
            credits: 99999,
            balance: 99999,
            createdAt: Date.now(),
            joinedAt: Date.now(),
            tradesCompleted: 0,
            reputation: 1000,
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff',
            vistoTutorial: true
        };
    }

    try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const docRef = await getDoc(doc(db, "users", cred.user.uid));
        
        if (!docRef.exists()) {
             console.warn("Usuário autenticado sem documento no banco. Recriando...");
             
             // --- CORREÇÃO DE ROLE ---
             // Se o email contiver 'admin', força o role para ADMIN durante a recuperação.
             const isAdminEmail = email.toLowerCase().includes('admin');
             
             const fallbackUser: User = {
                id: cred.user.uid,
                name: cred.user.displayName || 'Usuário Recuperado',
                email: email,
                role: isAdminEmail ? UserRole.ADMIN : UserRole.USER,
                plan: isAdminEmail ? UserPlan.PREMIUM : UserPlan.FREE,
                accountStatus: 'ACTIVE',
                documentStatus: isAdminEmail ? 'VERIFIED' : 'PENDING',
                isVerified: isAdminEmail,
                reputationScore: 0,
                credits: 0,
                balance: 0,
                createdAt: Date.now(),
                joinedAt: Date.now(),
                tradesCompleted: 0,
                reputation: 0,
                avatar: 'https://ui-avatars.com/api/?name=User',
                avatarUrl: 'https://ui-avatars.com/api/?name=User',
                vistoTutorial: true
             };
             await setDoc(doc(db, "users", cred.user.uid), fallbackUser);
             return fallbackUser;
        }
        
        return { ...docRef.data(), id: docRef.id } as User;
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const registerUser = async (userData: Partial<User>, password: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, userData.email!, password);
    let avatarUrl = userData.avatar || `https://ui-avatars.com/api/?name=${userData.name}`;
    
    if (userData.fotoDocumento && userData.fotoDocumento.startsWith('data:')) {
        await uploadMedia(userData.fotoDocumento, `users/${cred.user.uid}/doc.jpg`);
    }

    // Se o email tiver 'admin', cria como ADMIN
    const isAdminEmail = userData.email!.toLowerCase().includes('admin');

    const newUser: User = {
        id: cred.user.uid,
        name: userData.name || 'User',
        email: userData.email!,
        role: isAdminEmail ? UserRole.ADMIN : UserRole.USER,
        plan: UserPlan.FREE,
        accountStatus: 'ACTIVE',
        documentStatus: 'PENDING',
        isVerified: false,
        reputationScore: 0,
        credits: 0,
        balance: 0,
        createdAt: Date.now(),
        joinedAt: Date.now(),
        tradesCompleted: 0,
        reputation: 5,
        avatar: avatarUrl,
        avatarUrl: avatarUrl,
        vistoTutorial: false,
        cpf: userData.cpf,
        whatsapp: userData.whatsapp,
        cidade: userData.cidade,
        estado: userData.estado
    };
    await setDoc(doc(db, "users", cred.user.uid), newUser);
    return newUser;
};

export const logoutAuth = async () => await signOut(auth);

export const requestPasswordRecovery = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
};

// --- ADS ---
export const createAd = async (ad: Ad) => {
    const cleanAd = { ...ad };
    
    // IMPORTANT: AdsView calls uploadMedia BEFORE createAd for new videos.
    if (cleanAd.imageUrl && cleanAd.imageUrl.startsWith('data:')) {
        cleanAd.imageUrl = await uploadMedia(cleanAd.imageUrl, `ads/${ad.id}/thumb.jpg`);
    }
    
    await setDoc(doc(db, "ads", ad.id), cleanAd);
    logAdminAction(ad.ownerId, 'CREATE_AD', ad.id, ad.title);
};

export const getAds = (status?: AdStatus) => status ? cachedAds.filter(a => a.status === status) : cachedAds;

export const updateAdStatus = async (adminId: string, adId: string, status: AdStatus, reason?: string) => {
    await updateDoc(doc(db, "ads", adId), { status, moderationReason: reason });
};

export const deleteAd = async (adId: string) => {
    await deleteDoc(doc(db, "ads", adId));
};

export const rateAd = async (adId: string, userId: string, rating: number) => {
    const adRef = doc(db, "ads", adId);
    await updateDoc(adRef, { rating }); 
};

export const toggleLike = (adId: string, userId: string) => {
    return true; 
};

export const isAdLiked = (adId: string, userId: string) => false;

// --- PROPOSALS & CHAT ---
export const sendProposal = async (p: Proposal) => await setDoc(doc(db, "proposals", p.id), p);
export const getProposalsForUser = (uid: string) => cachedProposals.filter(p => p.bidderId === uid || p.adOwnerId === uid);
export const getAllProposals = () => cachedProposals;
export const getMessages = (pid: string) => cachedMessages.filter(m => m.proposalId === pid);

export const sendMessage = async (pid: string, sid: string, text: string, type: 'text'|'image', url?: string) => {
    const mid = `msg_${Date.now()}`;
    let mediaUrl = url || '';
    if (type === 'image' && url?.startsWith('data:')) {
        mediaUrl = await uploadMedia(url, `chats/${pid}/${mid}.jpg`);
    }
    const msg: ChatMessage = {
        id: mid, proposalId: pid, senderId: sid, text, type, mediaUrl,
        createdAt: Date.now(), read: false, timestamp: Date.now(), content: text
    };
    await setDoc(doc(db, "messages", mid), msg);
    await updateDoc(doc(db, "proposals", pid), { lastMessageAt: Date.now() });
};

export const closeDeal = async (pid: string) => {
    await updateDoc(doc(db, "proposals", pid), { status: 'WON' });
    const p = cachedProposals.find(pr => pr.id === pid);
    if (p) await updateDoc(doc(db, "ads", p.adId), { status: 'SOLD' });
};

// --- USER MANAGEMENT ---
export const updateUser = async (u: User) => {
    const clean = { ...u };
    if (clean.avatar?.startsWith('data:')) {
        clean.avatar = await uploadMedia(clean.avatar, `users/${u.id}/avatar.jpg`);
        clean.avatarUrl = clean.avatar;
    }
    await updateDoc(doc(db, "users", u.id), clean);
};

export const toggleUserBlock = async (adminId: string, uid: string) => {
    const u = cachedUsers.find(user => user.id === uid);
    if(u) await updateDoc(doc(db, "users", uid), { accountStatus: u.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' });
};

export const verifyUserDocument = async (aid: string, uid: string, app: boolean) => {
    await updateDoc(doc(db, "users", uid), { isVerified: app, documentStatus: app ? 'VERIFIED' : 'REJECTED' });
};

export const markTutorialSeen = async (uid: string) => await updateDoc(doc(db, "users", uid), { vistoTutorial: true });

// --- NEW: DELETE USER FUNCTION (Cascading) ---
export const deleteUser = async (uid: string) => {
    console.log(`🗑️ Deletando usuário ${uid} e seus dados...`);
    const batch = writeBatch(db);

    // 1. Delete User Doc
    const userRef = doc(db, "users", uid);
    batch.delete(userRef);

    // 2. Delete User Ads (Clean up Explorer)
    const adsQuery = query(collection(db, "ads"), where("ownerId", "==", uid));
    const adsSnap = await getDocs(adsQuery);
    adsSnap.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    // Note: Chats and proposals linked to user could be deleted here too, 
    // but often keeping history for the other party is safer unless strict privacy request.
    // For now we clean ads and user profile.

    // Commit changes
    await batch.commit();
    console.log("✅ Usuário e dados removidos com sucesso.");
};

// --- ADMIN & SYSTEM ---
export const logAdminAction = async (aid: string, action: string, tid: string, details: string) => {
    await addDoc(collection(db, "logs"), {
        id: `log_${Date.now()}`, adminId: aid, action, targetId: tid, details, timestamp: Date.now(), type: action, message: details,
        adminName: cachedUsers.find(u => u.id === aid)?.name || 'System'
    });
};

export const getAdminLogs = () => cachedLogs;
export const getAllTransactions = () => cachedTransactions;
export const getUserById = (id: string) => cachedUsers.find(u => u.id === id);
export const getAllUsers = () => cachedUsers;
export const getPodiumAds = () => cachedAds.filter(a => a.status === 'ACTIVE').slice(0, 7);
export const distributePodiumRewards = () => [];

// --- DANGER ZONE: HARD RESET ---
export const hardResetDB = async () => {
    const currentUser = auth.currentUser;
    console.warn("⚠️ INICIANDO HARD RESET DO SISTEMA...");
    
    const batch = writeBatch(db);
    let deleteCount = 0;

    // 1. Apagar TODOS os anúncios (videos corrompidos)
    const adsSnap = await getDocs(collection(db, "ads"));
    adsSnap.forEach(d => {
        batch.delete(d.ref);
        deleteCount++;
    });

    // 2. Apagar TODOS os usuários (exceto o admin logado)
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(d => {
        const userData = d.data();
        // Não apagar o usuário atual se ele for admin
        if (currentUser && d.id === currentUser.uid) return;
        
        // Se preferir apagar só quem não é admin explicitamente no banco:
        if (userData.role !== 'ADMIN') {
            batch.delete(d.ref);
            deleteCount++;
        }
    });

    // 3. Apagar propostas e mensagens antigas
    const propSnap = await getDocs(collection(db, "proposals"));
    propSnap.forEach(d => { batch.delete(d.ref); deleteCount++; });
    
    const msgSnap = await getDocs(collection(db, "messages"));
    msgSnap.forEach(d => { batch.delete(d.ref); deleteCount++; });

    if (deleteCount > 0) {
        await batch.commit();
        console.log(`✅ RESET CONCLUÍDO: ${deleteCount} itens removidos.`);
        cachedAds = [];
        cachedUsers = cachedUsers.filter(u => u.id === currentUser?.uid);
        cachedProposals = [];
        cachedMessages = [];
        notifyListeners();
    } else {
        console.log("Sistema já estava limpo.");
    }
};

export const checkSystemStatus = async () => true;