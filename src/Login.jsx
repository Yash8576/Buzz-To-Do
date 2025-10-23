// src/Login.jsx

import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function Login({ switchToSignup, onAuthSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Firebase verifies credentials and signs in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            onAuthSuccess(userCredential.user.email);
        } catch (error) {
            // Handle common Firebase errors
            if (error.code === 'auth/invalid-credential') {
                 setError('Invalid email or password. Please try again.');
            } else {
                setError(error.message);
            }
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
            <p>
                Don't have an account? 
                <span className="auth-link" onClick={switchToSignup}>Sign up here</span>
            </p>
        </form>
    );
}

export default Login;