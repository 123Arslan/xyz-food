import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Header from './Header';
import Home from './Home';
import About from './About';
import Impact from './Impact';
import Contact from './Contact';
import AdminDashboard from './AdminDashboard';
import DonorDashboard from './DonorDashboard';
import Login from './Login';
import SignUp from './SignUp';
import ReceiverDashboard from './ReceiverDashboard';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DonorFoodListingManager from './components/DonorFoodListingManager';

const AppContent = () => {
  const location = useLocation();

  // Conditionally hide public header on the Admin Dashboard page
  const showHeader = location.pathname !== '/admin';

  return (
    <div className="App w-full min-h-screen overflow-x-hidden">
      {showHeader && <Header />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/donor-dashboard"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver-dashboard"
          element={
            <ProtectedRoute allowedRole="receiver">
              <ReceiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="w-full min-h-screen overflow-x-hidden">
          <AppContent />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            toastStyle={{
              backgroundColor: '#059669',
              color: '#ffffff',
            }}
            progressStyle={{
              backgroundColor: '#047857',
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
