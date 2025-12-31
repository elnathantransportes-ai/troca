
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA85bcJPAvuIheB5d2hSwx9yNpMOfxQTsk",
  authDomain: "trocatroca-b5237.firebaseapp.com",
  projectId: "trocatroca-b5237",
  storageBucket: "trocatroca-b5237.firebasestorage.app",
  messagingSenderId: "62894182090",
  appId: "1:62894182090:web:c6cda463c4fecf0695ae33",
  measurementId: "G-VT17JKM6FC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Analytics is disabled to prevent "Installations: Create Installation request failed with error 503"
// This occurs when the Firebase project credentials are valid but the service is unreachable or restricted.
const analytics = null;

export { app, db, auth, storage, analytics };