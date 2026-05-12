import React, { useState } from 'react';
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
      {activeTab === 'login' && <Login onSwitch={() => setActiveTab('signup')} />}
      {activeTab === 'signup' && <SignUp onSwitch={() => setActiveTab('login')} />}
    </div>
  );
}

export default App;
