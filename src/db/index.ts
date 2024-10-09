import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FacebookAuthProvider, getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAghp31bM2tHMdDQGdRPmgh0E1dg_6yDDA",
  authDomain: "dentcity-727c0.firebaseapp.com",
  projectId: "dentcity-727c0",
  storageBucket: "dentcity-727c0.appspot.com",
  messagingSenderId: "679070095703",
  appId: "1:679070095703:web:1f664c59a7a5e19c718612"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const facebookProvider = new FacebookAuthProvider();

