import React, { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import TeamStrength from './TeamStrength';
import Logs from './Logs';
import LeaveTab from './LeaveTab';

const Dashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('teamstrength');

    return (
        <div className="dashboard">
            {/* Navigation tabs */}
            <div className="tabs">
                <button onClick={() => setActiveTab('teamstrength')}>Team Strength</button>
                <button onClick={() => setActiveTab('logs')}>Logs</button>
                <button onClick={() => setActiveTab('leave')}>Leave Planner</button>
            </div>

            {/* Content based on active tab */}
            <div className="tab-content">
                {activeTab === 'teamstrength' && <TeamStrength user={user} />}
                {activeTab === 'logs' && <Logs user={user} />}
                {activeTab === 'leave' && <LeaveTab user={user} />}
            </div>
        </div>
    );
};

export default Dashboard;
