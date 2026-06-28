import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjzmo0A4KhOkrqFQdOyCEek6bsPF-UVPQ",
  authDomain: "gds-departmental-exam-studyhub.firebaseapp.com",
  projectId: "gds-departmental-exam-studyhub",
  storageBucket: "gds-departmental-exam-studyhub.firebasestorage.app",
  messagingSenderId: "759916756080",
  appId: "1:759916756080:web:7f2c0e66458bd007e888b5"
};

// INIT
const app = initializeApp(firebaseConfig);

// SERVICES
const auth = getAuth(app);
const db = getFirestore(app);

// GLOBAL EXPORTS (OLD STYLE ONLY)
window.app = app;
window.auth = auth;
window.db = db;

window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOut = signOut;
window.sendPasswordResetEmail = sendPasswordResetEmail;
