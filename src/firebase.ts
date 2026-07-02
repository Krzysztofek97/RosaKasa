import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsFbFTOdoRwyhuCUgfzcJ5SKzkGf1jD_8",
  authDomain: "rosakasa-50e82.firebaseapp.com",
  projectId: "rosakasa-50e82",
  storageBucket: "rosakasa-50e82.firebasestorage.app",
  messagingSenderId: "283206211260",
  appId: "1:283206211260:web:5492809acc5fc0563ba2b9",
  measurementId: "G-ZVW1TS160P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
