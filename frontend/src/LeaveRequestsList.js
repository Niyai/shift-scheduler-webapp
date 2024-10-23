import React, { useContext } from 'react';
import { UserContext } from './UserContext';
import { approveLeaveRequest, denyLeaveRequest } from './api';

const LeaveRequestsList = ({ leaveRequests, approveLeaveRequest, denyLeaveRequest }) => {
    const { user } = useContext(UserContext); // Get the current user's information

    console.log('User title:', user.title);

    return (
        <div>
            {user && <p>Logged in as: {user.username}</p>} {/* Display username */}
            {leaveRequests.length === 0 ? (
                <p>No leave requests found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Agent Name</th>
                            <th>Leave Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.map((request) => {
                            console.log('Leave request status:', request.status); // Log status here
                            
                            return (
                                <tr key={request.id}>
                                    <td>{request.agent_name}</td>
                                    <td>{request.leave_type}</td>
                                    <td>{new Date(request.start_date).toLocaleDateString()}</td>
                                    <td>{new Date(request.end_date).toLocaleDateString()}</td>
                                    <td>{request.status}</td>
                                    {/* Show Approve/Deny buttons if status is Pending and user is a Manager */}
                                    {user && user.title === 'Manager' && request.status === 'pending' && (
                                        <td className="actions">
                                            <button className="small-btn" onClick={() => approveLeaveRequest(request.id)}>Approve</button>
                                            <button className="small-btn" onClick={() => denyLeaveRequest(request.id)}>Deny</button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default LeaveRequestsList;
