import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Login.css';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { toast } from 'react-toastify';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); 

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log("User logged in:", user); 
      
      if (user && user.uid) {
        localStorage.setItem('uid', user.uid);
      }
      toast.success("User logged in successfully!", { position: "top-center" });
      navigate("/profile");
    } catch (error) {
      console.error("Login error:", error.message);
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  const handleCreateNew = () => {
    navigate("/register");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <h1 className="heading">housing.in</h1>
      <form className="login-form" onSubmit={handleLogin}>
       
        <div className="form-group">
          <input
            type="text"
            id="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        
        <div className="form-group password-container">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password-visibility"
            onClick={togglePasswordVisibility}
            aria-label="Toggle password visibility"
            role="button"
            tabIndex="0"
          >
            {showPassword ? <IoMdEye /> : <IoMdEyeOff />}
          </span>
        </div>

        
        <button type="submit" className="login-button">Login</button>

       
        <p className="signup-link">
          <a href="/register">Forgotten Password?</a>
        </p>

       
        <button
          type="button"
          className="create-button"
          onClick={handleCreateNew}
        >
          Create New
        </button>
      </form>
    </div>
  );
};

export default Login;