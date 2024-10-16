import React, { useEffect, useState } from 'react';
import './Logs.css'; // Optional: if you want to add custom styles

function Logs() {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/shifts/shifts/log');
                if (!response.ok) {
                    throw new Error('Failed to fetch logs');
                }
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="logs-tab">
            <h2>Logs</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Change Details</th>
                        <th>Timestamp</th>
                        <th>Email Status</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td>{log.change_details}</td>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{log.email_status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Logs;
