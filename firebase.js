    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

import { getAuth  , GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyBiz01b3vIMp9qSoPFLopJW1Sr6vXR13Ws",
  authDomain: "chatapp-d719d.firebaseapp.com",
  projectId: "chatapp-d719d",
  storageBucket: "chatapp-d719d.appspot.com",
  messagingSenderId: "750869219856",
  appId: "1:750869219856:web:46e3190a35ac0ca2ddd895",
  measurementId: "G-TYKZ5T8YWW"
  // databaseURL: "https://chatapp-d719d-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);


export { app , auth , provider , db , storage};