import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, getDocs, orderBy, startAt, endAt, collectionGroup } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

const firebaseConfig = {
  apiKey: "AIzaSyDbmHvb95aeE4qf5rOo9v8hlnHVGHAoYPQ",
  authDomain: "mapt-by-battery-nexus.firebaseapp.com",
  projectId: "mapt-by-battery-nexus",
  storageBucket: "mapt-by-battery-nexus.firebasestorage.app",
  messagingSenderId: "912952720219",
  appId: "1:912952720219:web:c319624a81223d0f52387e",
  measurementId: "G-X0D42JKM7M",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Generate a random referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export {
  app,
  db,
  auth,
  storage,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  startAt,
  endAt,
  collectionGroup,
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
  generateReferralCode
};
