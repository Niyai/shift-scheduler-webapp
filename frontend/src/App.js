// src/App.js
import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import { fetchProtectedData } from './api';
import TeamStrength from './TeamStrength';
import SignUp from './SignUp';
import Logs from './Logs';
import { UserProvider } from './UserContext';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Check for existing token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true); // Set auth if token exists
        }
    }, []);

    const handleLogin = async (token) => {
        localStorage.setItem('token', token); // Store token
        setIsAuthenticated(true); // Set auth state to true
        
        // Fetch and store user data
        const userId = localStorage.getItem('userId'); // Ensure this is set during login
        if (userId) {
            try {
                const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
                localStorage.setItem('userData', JSON.stringify(response.data)); // Store user data if needed
            } catch (error) {
                console.error('Error fetching user data', error);
                setError('Failed to fetch user data');
            }
        }
    };

    return (
        <UserProvider>
            <div>
                <h1>Shift Scheduler</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route 
                        path="/dashboard/*" 
                        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/dashboard/teamstrength" 
                        element={isAuthenticated ? <TeamStrength /> : <Navigate to="/login" />} 
                    />
                    <Route path="/dashboard/logs" element={isAuthenticated ? <Logs /> : <Navigate to="/login" />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
		<ToastContainer />
            </div>
        </UserProvider>
    );
}

export default App;
