// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Your Firebase config with the keys you provided
const firebaseConfig = {
  apiKey: "AIzaSyDSnrfJadWuLI2_JlLIEbyseVl-1mpjzqo",
  authDomain: "aquaauctions1.firebaseapp.com",
  projectId: "aquaauctions1",
  storageBucket: "aquaauctions1.firebasestorage.app", // ⚠ double-check in Firebase console, often ends with ".appspot.com"
  messagingSenderId: "699684215742",
  appId: "1:699684215742:web:383b8d991243d3f6da77ef",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
