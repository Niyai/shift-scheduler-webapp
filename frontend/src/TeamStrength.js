import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './styles.css'; // Adjust the path if necessary

const TeamStrength = () => {
  const [teamStrengthData, setTeamStrengthData] = useState([]);
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [channel, setChannel] = useState('');

  const fetchTeamStrength = async () => {
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
            }).replace(/ /g, '-'); 

      const response = await axios.get(`http://localhost:5000/api/shifts/team-strength`, {
          params: {
              date: formattedDate,
              hour,
          },
      });

      const data = response.data.channelStrength;
      const formattedData = Object.keys(data).map((key) => ({
        channel: key,
        agents: data[key],
      }));

      setTeamStrengthData(formattedData);
    } catch (error) {
      console.error('Error fetching team strength data:', error);
    }
  };

  useEffect(() => {
    if (date && hour) {
      fetchTeamStrength();
    }
  }, [date, hour]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchTeamStrength();
  };

  return (
    <div className="team-strength-container">
        <h1>Team Strength Overview</h1>

        <form onSubmit={handleFilter}>
            <div>
                <label>Date: </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
                <label>Hour: </label>
                <input type="number" value={hour} onChange={(e) => setHour(e.target.value)} required />
            </div>
            <div>
                <label>Channel: </label>
                <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)} />
            </div>
            <button type="submit">Filter</button>
        </form>

        {teamStrengthData.length > 0 && (
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamStrengthData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="channel" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="agents" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
    </div>
  );
};

export default TeamStrength;
