import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBsFbFTOdoRwyhuCUgfzcJ5SKzkGf1jD_8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rosakasa-50e82.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rosakasa-50e82",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rosakasa-50e82.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "283206211260",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:283206211260:web:5492809acc5fc0563ba2b9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZVW1TS160P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
