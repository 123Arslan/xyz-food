import React, { useState } from 'react';
import './App.css';
import Header from './Header';
import Home from './Home';
import About from './About';
import Impact from './Impact';
import Contact from './Contact';
import Login from './Login';
import SignUp from './SignUp';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const handleNavigate = (action) => {
    if (['home', 'about', 'impact', 'contact', 'login', 'signup'].includes(action)) {
      setActiveTab(action);
    } else {
      // Future navigation logic for other pages
      console.log(`Navigating to ${action}`);
    }
  };

  return (
    <div className="App">
      <Header onNavigate={handleNavigate} />
      {activeTab === 'home' && <Home />}
      {activeTab === 'about' && <About />}
      {activeTab === 'impact' && <Impact />}
      {activeTab === 'contact' && <Contact />}
      {activeTab === 'login' && <Login onSwitch={() => setActiveTab('signup')} />}
      {activeTab === 'signup' && <SignUp onSwitch={() => setActiveTab('login')} />}
    </div>
  );
}

export default App;
