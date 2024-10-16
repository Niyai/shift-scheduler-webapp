import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import TeamStrength from './TeamStrength';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/teamstrength" element={<TeamStrength />} />
      </Routes>
    </Router>
  );
};

export default App;
