import React from 'react';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            {/* Other dashboard components, navigation, etc. */}
            <Outlet /> {/* Renders child routes */}
        </div>
    );
};

export default Dashboard;
