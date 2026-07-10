import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDaYC13xZlScRcJ5mTgiRC6EpRWy-QUImU',
  authDomain: 'scripture-quest-7e3d5.firebaseapp.com',
  projectId: 'scripture-quest-7e3d5',
  storageBucket: 'scripture-quest-7e3d5.firebasestorage.app',
  messagingSenderId: '25147385914',
  appId: '1:25147385914:web:c9ff546cf58260ee0ced03',
  measurementId: 'G-GSLZRN6WKD',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);
export const firebaseAuth = initializeFirebaseAuth();
export const firebaseDb = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp);

function initializeFirebaseAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch (error) {
    console.warn('Firebase Auth was already initialized, reusing existing instance.', error);
    return getAuth(firebaseApp);
  }
}
