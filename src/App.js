import React, { useState, useEffect } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const accountType = user.profile?.account_type?.toLowerCase();
        if (accountType === 'donor') {
          setActiveTab('donor_dashboard');
        } else if (accountType === 'receiver') {
          setActiveTab('receiver_dashboard');
        } else if (accountType === 'admin') {
          setActiveTab('admin');
        }
      } catch (e) {
        console.error("Error restoring auth session:", e);
      }
    }
  }, []);

  const handleNavigate = (action) => {
    if (['home', 'about', 'impact', 'contact', 'admin', 'donor_dashboard', 'receiver_dashboard', 'login', 'signup'].includes(action)) {
      setActiveTab(action);
    } else {
      // Future navigation logic for other pages
      console.log(`Navigating to ${action}`);
    }
  };

  return (
    <div className="App">
      {activeTab !== 'admin' && <Header onNavigate={handleNavigate} />}
      {activeTab === 'home' && <Home onNavigate={handleNavigate} />}
      {activeTab === 'about' && <About />}
      {activeTab === 'impact' && <Impact />}
      {activeTab === 'contact' && <Contact />}
      {activeTab === 'admin' && <AdminDashboard />}
      {activeTab === 'donor_dashboard' && <DonorDashboard />}
      {activeTab === 'receiver_dashboard' && <ReceiverDashboard />}
      {activeTab === 'login' && <Login onSwitch={() => setActiveTab('signup')} onNavigate={handleNavigate} />}
      {activeTab === 'signup' && <SignUp onSwitch={() => setActiveTab('login')} onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
