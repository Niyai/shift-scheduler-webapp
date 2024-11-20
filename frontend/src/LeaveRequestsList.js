import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import {
  approveLeaveRequest,
  denyLeaveRequest,
  deleteLeaveRequest,
  editLeaveRequest,
} from "./api";
import EditLeaveModal from "./EditLeaveModal";
import LeaveTab from "./LeaveTab";

const LeaveRequestsList = ({
  leaveRequests,
  approveLeaveRequest,
  denyLeaveRequest,
}) => {
  const { user } = useContext(UserContext); // Get the current user's information

  console.log("User title:", user.title);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (updatedRequest) => {
    try {
      // Call the editLeaveRequest function and pass the updated request data
      await editLeaveRequest(selectedLeaveRequest.id, updatedRequest);

      // Update the leave requests state with the updated request
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === selectedLeaveRequest.id
            ? { ...request, ...updatedRequest }
            : request
        )
      );

      // Close the modal after saving
      setIsModalOpen(false);

      console.log("Leave request updated successfully!");
    } catch (error) {
      console.error("Error updating leave request:", error);
    }
  };

  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
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
              console.log("Leave request status:", request.status); // Log status here

              return (
                <tr key={request.id}>
                  <td>{request.agent_name}</td>
                  <td>{request.leave_type}</td>
                  <td>{new Date(request.start_date).toLocaleDateString()}</td>
                  <td>{new Date(request.end_date).toLocaleDateString()}</td>
                  <td>{request.status}</td>
                  {/* Show Approve/Deny buttons if status is Pending and user is a Manager */}
                  {user &&
                    user.title === "Manager" &&
                    request.status === "pending" && (
                      <td className="actions">
                        <button
                          className="small-btn"
                          onClick={() => approveLeaveRequest(request.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="small-btn"
                          onClick={() => denyLeaveRequest(request.id)}
                        >
                          Deny
                        </button>
                      </td>
                    )}
                  {user &&
                    user.title === "Agent" &&
                    request.status === "pending" && (
                      <td className="actions">
                        <button
                          className="small-btn"
                          onClick={() => {
                            setSelectedLeaveRequest(request); // Set the selected leave request
                            setIsModalOpen(true); // Open the modal
                          }}
                        >
                          Edit
                        </button>
                        {/* Render the modal */}
                        {isModalOpen && (
                          <EditLeaveModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            leaveRequest={selectedLeaveRequest}
                            onSave={handleSave}
                          />
                        )}
                        <button
                          className="small-btn"
                          onClick={() => deleteLeaveRequest(request.id)}
                        >
                          Delete
                        </button>
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
