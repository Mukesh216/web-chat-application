    import { initializeApp } from "firebase/app";  
    import { getFirestore } from "firebase/firestore";

    import dotenv from "dotenv";

    dotenv.config(
        {path:"./.env"}
      );
    
    
    const firebaseConfig = {
      apiKey: process.env.FIREBASEAPIKEY ,
      authDomain: process.env.FIREBASEAUTHDOMAIN ,
      projectId: process.env.FIREBASEPROJECTID ,
      storageBucket: process.env.FIREBASESTORAGEBUCKET ,
      messagingSenderId: process.env.FIREBASEMESSAGINGSENDERID ,
      appId: process.env.FIREBASEAPPID ,
      measurementId: process.env.FIREBASEMEASUREMENTID ,
    };
    
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    
    const db = getFirestore(app);
    
    
    export { app  , db};