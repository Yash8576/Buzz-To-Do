// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyD2LXtQ00F3Wt9tCxwHZjTXTQbAKMpRUuU",
  authDomain: "buzz-to-do.firebaseapp.com",
  projectId: "buzz-to-do",
  storageBucket: "buzz-to-do.firebasestorage.app",
  messagingSenderId: "605272755203",
  appId: "1:605272755203:web:987dfee84dc0c72b205236",
  measurementId: "G-RQMCXYHJSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app); // For user login/signup
export const db = getFirestore(app); // For the database (tasks)