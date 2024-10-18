import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import './styles.css'; // Import your styles

const Login = ({ onLogin }) => {
    const { setUser } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); // Reset error state

        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            onLogin(data.token); // Pass token to parent
            
            // Ensure the backend sends back the user details along with the token
            setUser(data.user); // Set the user context with the user details

            navigate('/dashboard'); // Redirect to dashboard
        } catch (err) {
            setError(err.message); // Set error message
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn">Login</button>
            </form>
            <div className="navigation-buttons">
                <button className="btn" onClick={() => navigate('/signup')}>
                    Don't have an account? Sign Up
                </button>
            </div>
        </div>
    );
};

export default Login;
