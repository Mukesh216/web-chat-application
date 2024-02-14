    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

import { getAuth  , GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";






const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASEAPIKEY ,
  authDomain: import.meta.env.VITE_FIREBASEAUTHDOMAIN ,
  projectId: import.meta.env.VITE_FIREBASEPROJECTID ,
  storageBucket: import.meta.env.VITE_FIREBASESTORAGEBUCKET ,
  messagingSenderId: import.meta.env.VITE_FIREBASEMESSAGINGSENDERID ,
  appId: import.meta.env.VITE_FIREBASEAPPID ,
  measurementId: import.meta.env.VITE_FIREBASEMEASUREMENTID ,
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);


export { app , auth , provider , db , storage};