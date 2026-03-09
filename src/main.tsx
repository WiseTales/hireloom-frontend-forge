import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import CareersPage from './pages/CareersPage';
import JobDetailPage from './pages/JobDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import TeamManagementPage from './pages/TeamManagementPage';
import InviteAcceptPage from './pages/InviteAcceptPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/careers/:companySlug" element={<CareersPage />} />
        <Route path="/careers/:companySlug/:jobId" element={<JobDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
