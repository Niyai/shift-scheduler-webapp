import React, { useState, useEffect } from "react";
import { getAgents, createLeaveRequest, getLeaveRequests } from "./api"; // Import API calls
import LeaveRequestsList from "./LeaveRequestsList"; // Component to display leave requests
import { UserContext } from "./UserContext";
import EditLeaveModal from "./EditLeaveModal";
import {
  approveLeaveRequest,
  denyLeaveRequest,
  editLeaveRequest,
  deleteLeaveRequest,
} from "./api";
import { toast } from "react-toastify";

const LeaveTab = ({ user }) => {
  const [agents, setAgents] = useState([]);
  const [agentName, setAgentName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // To filter by leave status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const handleEditClick = (leaveRequest) => {
    setSelectedLeaveRequest(leaveRequest);
    setIsModalOpen(true); // Open the modal when "Edit" is clicked
  };
  const handleSave = async (id, updatedLeaveDetails) => {
    try {
      await editLeaveRequest(id, updatedLeaveDetails); // Call API to update leave request

      // Update leave requests in state
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === id ? { ...request, ...updatedLeaveDetails } : request
        )
      );

      toast.success("Leave request updated successfully!");
      setIsModalOpen(false); // Close modal after saving
    } catch (error) {
      toast.error("Error updating leave request!");
    }
  };

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
      alert("Please fill all fields");
      return;
    }

    try {
      await createLeaveRequest({ agentName, leaveType, startDate, endDate });
      alert("Leave request submitted successfully!");
      setAgentName("");
      setLeaveType("");
      setStartDate("");
      setEndDate("");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("Failed to submit leave request.");
    }
  };

  // Approve request and show a success notification
  const handleApprove = async (id) => {
    try {
      await approveLeaveRequest(id);
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === id ? { ...request, status: "Approved" } : request
        )
      );
      toast.success("Leave request approved successfully!"); // Show success notification
    } catch (error) {
      toast.error("Error approving leave request!"); // Show error notification
    }
  };

  // Deny request and show a success notification
  const handleDeny = async (id) => {
    try {
      await denyLeaveRequest(id);
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === id ? { ...request, status: "Denied" } : request
        )
      );
      toast.success("Leave request denied successfully!"); // Show success notification
    } catch (error) {
      toast.error("Error denying leave request!"); // Show error notification
    }
  };

  // In LeaveTab.js

  const handleEdit = async (id) => {
    // Example form values; you should collect these from your form inputs (e.g., state or controlled inputs)
    const updatedRequest = {
      leaveType: "Annual Leave", // User input for leave type
      startDate: "2024-10-24", // User input for start date
      endDate: "2024-10-28", // User input for end date
      status: "Approved", // Optionally updated status
    };

    try {
      await editLeaveRequest(id, updatedRequest); // Call API with new details

      // Update the state to reflect the changes in the UI
      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === id ? { ...request, ...updatedRequest } : request
        )
      );

      toast.success("Leave request updated successfully!"); // Success notification
    } catch (error) {
      toast.error("Error updating leave request!"); // Error notification
    }
  };

  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this leave request?"
      );
      if (!confirmed) return;
      await deleteLeaveRequest(id);
      setLeaveRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== id)
      );
      toast.success("Leave request deleted successfully!"); // Show success notification
    } catch (error) {
      toast.error("Error deleting leave request!"); // Show error notification
    }
  };

  return (
    <div>
      <h2>Leave Planner</h2>
      <div className="leave-request-container">
        {/* Leave Request Form */}
        <form onSubmit={handleSubmit}>
          <label>Agent Name:</label>
          <select
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          >
            <option value="">Select Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.name}>
                {agent.name}
              </option>
            ))}
          </select>
          <label>Leave Type:</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="">Select Leave Type</option>
            <option value="Annual">Annual</option>
            <option value="Sick">Sick</option>
            <option value="Maternity">Maternity</option>
            <option value="Compassionate">Compassionate</option>
            <option value="Bonus">Bonus</option>
          </select>

          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button type="submit">Submit Leave Request</button>
        </form>
      </div>

      {/* Leave Requests Section */}
      <h3>Leave Requests</h3>
      <div>
        <label>Filter by status: </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
      </div>
      <LeaveRequestsList
        leaveRequests={leaveRequests}
        approveLeaveRequest={approveLeaveRequest}
        denyLeaveRequest={denyLeaveRequest}
        editLeaveRequest={editLeaveRequest}
        deleteLeaveRequest={deleteLeaveRequest}
      />
    </div>
  );
};

export default LeaveTab;
