import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FarmDetail from './pages/FarmDetail';
import Insights from './pages/Insights';
import Devices from './pages/Devices';
import History from './pages/History';
import HowItWorks from './pages/HowItWorks';
import Farms from './pages/Farms';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/farms/:id" element={<FarmDetail />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/history" element={<History />} />
            <Route path="/devices" element={<Devices />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
