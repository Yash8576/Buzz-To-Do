// src/Signup.jsx

import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function Signup({ switchToLogin, onAuthSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        
        try {
            // Firebase creates the new user and logs them in
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            onAuthSuccess(userCredential.user.email);
        } catch (error) {
            // Handle common Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                setError('This email address is already in use.');
            } else if (error.code === 'auth/invalid-email') {
                setError('The email address is not valid.');
            } else {
                setError(error.message);
            }
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Sign Up</h2>
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
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Sign Up</button>
            <p>
                Already have an account? 
                <span className="auth-link" onClick={switchToLogin}>Login here</span>
            </p>
        </form>
    );
}

export default Signup;