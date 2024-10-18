// src/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
export const UserContext = createContext();

// Context Provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token'); // Assuming you use token for auth
            const userId = localStorage.getItem('userId'); // Adjust according to your logic
            if (token && userId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` } // Ensure to send token if required
                    });
                    setUser(response.data);
                    console.log('Fetched User:', response.data); // Log fetched user data
                } catch (error) {
                    console.error('Error fetching user', error);
                }
            } else {
                console.log('No token or userId found'); // Log when no token or userId is found
            }
        };
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
