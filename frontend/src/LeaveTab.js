import React, { useState, useEffect } from 'react';
import { getAgents, createLeaveRequest, getLeaveRequests } from './api'; // Import API calls
import LeaveRequestsList from './LeaveRequestsList'; // Component to display leave requests

const LeaveTab = ({ user }) => {
    const [agents, setAgents] = useState([]);
    const [agentName, setAgentName] = useState('');
    const [leaveType, setLeaveType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all'); // To filter by leave status

    // Fetch list of agents when the component mounts
    useEffect(() => {
        const fetchAgents = async () => {
            const agentsData = await getAgents();
            setAgents(agentsData);
        };
        fetchAgents();
    }, []);

    // Fetch leave requests
    useEffect(() => {
        const fetchLeaveRequests = async () => {
            const leaveRequestsData = await getLeaveRequests(statusFilter);
            setLeaveRequests(leaveRequestsData);
        };
        fetchLeaveRequests();
    }, [statusFilter]);

    // Handle leave request submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agentName || !leaveType || !startDate || !endDate) {
            alert('Please fill all fields');
            return;
        }

        try {
            await createLeaveRequest({ agentName, leaveType, startDate, endDate });
            alert('Leave request submitted successfully!');
            setAgentName('');
            setLeaveType('');
            setStartDate('');
            setEndDate('');
        } catch (error) {
            console.error('Error submitting leave request:', error);
            alert('Failed to submit leave request.');
        }
    };

    return (
        <div>
            <h2>Leave Planner</h2>
            
            {/* Leave Request Form */}
            <form onSubmit={handleSubmit}>
                <label>Agent Name:</label>
                <select value={agentName} onChange={(e) => setAgentName(e.target.value)}>
                    <option value="">Select Agent</option>
                    {agents.map((agent) => (
                        <option key={agent.name} value={agent.name}>
                            {agent.name}
                        </option>
                    ))}
                </select>

                <label>Leave Type:</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                    <option value="">Select Leave Type</option>
                    <option value="Annual">Annual</option>
                    <option value="Sick">Sick</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Compassionate">Compassionate</option>
                    <option value="Bonus">Bonus</option>
                </select>

                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                <label>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                <button type="submit">Submit Leave Request</button>
            </form>

            {/* Leave Requests Section */}
            <h3>Leave Requests</h3>
            <div>
                <label>Filter by status: </label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                </select>
            </div>
            <LeaveRequestsList leaveRequests={leaveRequests} />
        </div>
    );
};

export default LeaveTab;
