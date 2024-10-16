import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import { fetchProtectedData } from './api';
import TeamStrength from './TeamStrength';
import SignUp from './SignUp';
import Logs from './Logs';


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    // Check for existing token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true); // Set auth if token exists
        }
    }, []);

    const handleLogin = (token) => {
        localStorage.setItem('token', token); // Store token
        setIsAuthenticated(true); // Set auth state to true
    };

    useEffect(() => {
        const getData = async () => {
            try {
                const result = await fetchProtectedData(); // Fetch protected data
                setUserData(result);
            } catch (err) {
                setError('Failed to fetch data');
            }
        };

        // Fetch data only if authenticated
        if (isAuthenticated) {
            getData();
        }
    }, [isAuthenticated]);

    return (
        <div>
            <h1>Shift Scheduler</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <Routes>
                {/* If not authenticated, show login */}
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
		<Route path="/signup" element={<SignUp />} /> {/* New sign-up route */}
                {/* Protected route for the dashboard */}
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard data={userData} /> : <Navigate to="/login" />} 
                />

                {/* TeamStrength under its own route */}
                <Route 
                    path="/dashboard/teamstrength" 
                    element={isAuthenticated ? <TeamStrength /> : <Navigate to="/login" />} 
                />
		<Route path="/dashboard/logs" element={isAuthenticated ? <Logs /> : <Navigate to="/login" />} />
                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </div>
    );
}

export default App;
