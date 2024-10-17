import React from 'react';

const LeaveRequestsList = ({ leaveRequests }) => {
    return (
        <div>
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
                        {leaveRequests.map((request) => (
                            <tr key={request.id}>
                                <td>{request.agent_name}</td>
                                <td>{request.leave_type}</td>
                                <td>{new Date(request.start_date).toLocaleDateString()}</td>
                                <td>{new Date(request.end_date).toLocaleDateString()}</td>
                                <td>{request.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default LeaveRequestsList;
