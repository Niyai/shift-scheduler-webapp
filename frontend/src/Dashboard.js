import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import TeamStrength from './TeamStrength';
import Logs from './Logs';

function Dashboard({ data }) {
    return (
        <div>
            <h2>Dashboard</h2>
            <nav>
                <Link to="/dashboard/teamstrength" className="dashboard-tab">Team Strength</Link> | 
                <Link to="/dashboard/logs" className="dashboard-tab">Logs</Link> {/* Add Logs tab */}
            </nav>
            <div>
                <Routes>
                    <Route path="teamstrength" element={<TeamStrength />} />
                    <Route path="logs" element={<Logs />} />
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;
