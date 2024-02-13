import { useState } from "react";

//firebase imports
import { auth } from "../../../firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { provider } from "../../../firebase";

import { db } from "../../../firebase";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";

import { storage } from "../../../firebase";
import { ref, uploadBytes, uploadString } from "firebase/storage";

const SignUp = () => {

  const [signUpClicked, setSignUpClicked] = useState(false);

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');





  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      allocateUserToDb(user);
      alert('Registration successful:', user);
      setSignUpClicked(false);


    } catch (error) {
      alert('Registration error: invalid email or password');
    }

    setEmail('');
    setPassword('');
  }

  const handleSignUpWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      allocateUserToDb(user);
      alert('Login successful:', user);
      setSignUpClicked(false);



    } catch (error) {
      alert('Login error: invalid email or password');
    }
  }


  const clickSignUp = () => {
    setSignUpClicked(true);
  }

  const allocateUserToDb = async (user) => {

    try {
      const docRef = doc(db, "users", user.uid);

      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        console.log('User already exists in the database.');
        return; // Exit function if user already exists
      }

      await setDoc(docRef, {
        email: user.email,
        uid: user.uid,
        providerData: user.providerData,
        friends: {},
        friendRequests: {},

      });

      const chatHistoryRef = doc(db, "chats", user.uid);
      await setDoc(chatHistoryRef, {});


      const userUid = user.uid;

      // Create a reference to the desired location in Firebase Storage
      const folderPath = `userProfiles/${userUid}/`;

      // Create a placeholder file name that indicates it's a folder
      const placeholderFileName = '.keep'; // or 'folder_marker', or any other name

      // Concatenate the folder path and placeholder file name
      const placeholderFilePath = folderPath + placeholderFileName;

      // Create a reference to the placeholder file
      const placeholderFileRef = ref(storage, placeholderFilePath);

      // Upload a placeholder file with an empty string as content
      const placeholderContent = '';
      await uploadString(placeholderFileRef, placeholderContent);


      console.log('User added to the database.');
    }
    catch (error) {
      console.error("Error adding document: ", error);
    }
  }


  return (
    <div className='text-white font-semibold '>
      <button
        onClick={clickSignUp}
        className='bg-[#070F2B] hover:bg-transparent w-72 md:w-44  xl:w-72  h-14 border hover:border-2 hover:text-black border-cyan-400   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'
      >
        SIGN UP
      </button>


      {signUpClicked && <div className='absolute top-0 left-0 w-full h-full bg-blue-950 bg-opacity-90 flex justify-center items-center'>
        <div className='w-96 h-96 bg-white rounded-md relative flex flex-col justify-center items-center '>
          <h1 className='text-2xl text-black font-bold mb-8'>SIGN UP</h1>
          <button className='absolute top-2 right-2 text-2xl m-2 rounded px-2 text-red-500'
            onClick={() => setSignUpClicked(false)}
          >X</button>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            placeholder='Email'
            className='w-80 h-14 border border-blue-900 text-black mb-4 px-4 rounded-md' />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type='password'
            placeholder='Password' className='w-80 h-14 border text-black border-blue-900 mb-4 px-4 rounded-md' />
          <button
            onClick={handleSignUp}
            className='bg-blue-950 hover:bg-blue-300 w-80 h-12 border hover:border-2 hover:text-blue-900 border-blue-900   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'>
            SIGN UP</button>

          <p className='text-black py-2'>or </p>

          <button
            className='bg-blue-800 hover:bg-blue-300 w-80 h-10 mt-3 border hover:border-2 hover:text-blue-900 border-blue-900   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'
            onClick={handleSignUpWithGoogle}
          >sign up with Google</button>
        </div>
      </div>}
    </div>
  );
};

export default SignUp;
