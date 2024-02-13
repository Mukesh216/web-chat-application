// Login.jsx

import { useState } from 'react';
import { auth } from '../../../firebase';
import { signInWithEmailAndPassword , createUserWithEmailAndPassword , GoogleAuthProvider , signInWithPopup} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

const Login = () => {

  const [loginClicked, setLoginClicked] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [registerClicked, setRegisterClicked] = useState(false);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert('Login successful:', user);
      setLoginClicked(false);
      window.location.href = '/home';
    } catch (error) {
      alert('Login error: invalid email or password');
    }

    setEmail('');
    setPassword('');
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
      alert('Register successful:', user , "Please login to continue");
      setRegisterClicked(false);

    } catch (error) {
      alert('Register error: invalid email or password');
    }

    setRegisterEmail('');
    setRegisterPassword('');
  };



  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

      // The signed-in user info.
      const user = result.user;

     console.log("success");

     window.location.href = '/home';

      // IdP data available using getAdditionalUserInfo(result)
      // ...

      console.log('Google Sign-In successful:', user);
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Google Sign-In error:', errorCode, errorMessage);

      // The email of the user's account used.
      const email = error.email;

      // Get the credential using GoogleAuthProvider directly
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...

      // Note: If you don't need the credential, you can omit the line above.
    }
  }



  const registerButtonClicked = () => {
    setLoginClicked(false);
    setRegisterClicked(true);
  }



  const loginButtonClicked = () => {
    setLoginClicked(true);
  }

  return (
    <div className='text-white font-semibold '>
      <button
        onClick={loginButtonClicked}
        className='bg-[#070F2B] hover:bg-transparent w-72 md:w-44 xl:w-72 h-14 border hover:border-2 hover:text-black border-cyan-400   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'
      >
        LOGIN</button>


      {loginClicked && <div className='absolute top-0 left-0 w-full h-full bg-blue-950 bg-opacity-90 flex justify-center items-center'>
        <div className='w-96 h-96  bg-white rounded-md relative flex flex-col justify-center items-center '>
          <h1 className='text-2xl text-black font-bold mb-8'>LOGIN</h1>
          <button className='absolute top-2 right-2 text-2xl m-2 rounded  px-2 text-red-500'
            onClick={() => setLoginClicked(false)}
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
          onClick={handleLogin}
          className='bg-blue-950 hover:bg-blue-300 w-80 h-12 border hover:border-2 hover:text-blue-900 border-blue-900   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'>
            LOGIN</button>

            <button
            className='bg-blue-800 hover:bg-blue-300 w-80 h-10 mt-3 border hover:border-2 hover:text-blue-900 border-blue-900   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'
            onClick={handleSignInWithGoogle}
            >sign in with Google</button>            
            <a 
            onClick={registerButtonClicked}
            className='text-blue-900 mt-4 hover:underline'>
              Don&apos;t have an account? Register
            </a>
        </div>
      </div>}

      {registerClicked && <div className='absolute top-0 left-0 w-full h-full bg-blue-950 bg-opacity-90 flex justify-center items-center'>
        <div className='w-96 h-96 bg-white rounded-md relative flex flex-col justify-center items-center'>
          <h1 className='text-2xl text-black font-bold mb-8'>REGISTER HERE !</h1>
          <button className='absolute top-2 right-2 text-2xl m-2 rounded border border-black px-2 text-red-500'
            onClick={() => setRegisterClicked(false)}
          >X</button>
          <input
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            type='email'
            placeholder='Email'
            className='w-80 h-14 border border-blue-900 mb-4 px-4 rounded-md text-black ' />
          <input
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            type='password'
            placeholder='Password' className='w-80 h-14 border border-blue-900 mb-4 px-4 text-black  rounded-md' />
          <button 
          onClick={handleRegister}
          className='bg-blue-950 hover:bg-blue-300 w-80 h-12 border hover:border-2 hover:text-blue-900 border-blue-900   transition-all ease-in-out duration-300 text-white font-bold py-2 px-12 rounded-md tracking-wider'>
            REGISTER</button>

    
        </div>
      </div>}

    </div>
  )
}

export default Login