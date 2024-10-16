import axios from 'axios';

// Create an instance of axios with default settings
const api = axios.create({
    baseURL: 'http://localhost:5000',
});

// Function to fetch protected data using the stored token
export const fetchProtectedData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No token found');
    }

    const response = await api.get('/protected/data', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data; // Return the data
};
