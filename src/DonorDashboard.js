import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import './DonorDashboard.css';
import './Home.css';
import DonorFoodListingManager from './components/DonorFoodListingManager';

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState('settings');

  // Forms state
  const [settingsForm, setSettingsForm] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    oldPassword: '',
    newPassword: ''
  });


  // Mock Data
  const monthlyDonations = [
    { month: 'Jan', donations: 15 },
    { month: 'Feb', donations: 25 },
    { month: 'Mar', donations: 18 },
    { month: 'Apr', donations: 30 },
    { month: 'May', donations: 22 },
    { month: 'Jun', donations: 40 }
  ];

  const activeListings = [
    { id: 1, title: 'Homemade Pasta', type: 'Cooked Meal', quantity: '5 servings', status: 'Available' },
    { id: 2, title: 'Fresh Veggies', type: 'Raw Ingredients', quantity: '10 lbs', status: 'Claimed' },
  ];

  const donationHistory = [
    { id: 101, title: 'Boxed Lunches', date: '2026-04-10', receiver: 'Shelter B', status: 'Completed' },
    { id: 102, title: 'Bakery Items', date: '2026-04-15', receiver: 'Community Center', status: 'Completed' },
  ];

  const feedbacks = [
    { id: 1, text: "The pasta was delicious and perfectly packaged. Thank you!", author: "Shelter B" },
    { id: 2, text: "Fresh veggies were amazing quality.", author: "Community Center" }
  ];

  const badges = [
    { id: 1, title: 'First Donation', icon: '🏅', description: 'Made your first donation' },
    { id: 2, title: 'Waste Warrior', icon: '♻️', description: 'Saved over 100 lbs of food' },
    { id: 3, title: 'Community Hero', icon: '🌟', description: 'Fed 50+ people' },
  ];

  const handleSettingsChange = (e) => setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    console.log('Settings updated:', settingsForm);
    alert('Profile updated successfully!');
    setSettingsForm({ ...settingsForm, oldPassword: '', newPassword: '' });
  };

  const renderOverview = () => (
    <div className="donor-content-section">
      {/* Stats Cards - each with unique pastel background */}
      <div className="stats-grid">
        <div className="donor-card stat-card stat-green">
          <div className="stat-icon">LISTINGS</div>
          <div className="stat-value">2</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="donor-card stat-card stat-yellow">
          <div className="stat-icon">DONATIONS</div>
          <div className="stat-value">45</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="donor-card stat-card stat-blue">
          <div className="stat-icon">PEOPLE FED</div>
          <div className="stat-value">230</div>
          <div className="stat-label">People Fed</div>
        </div>
        <div className="donor-card stat-card stat-pink">
          <div className="stat-icon">WASTE</div>
          <div className="stat-value">120 lbs</div>
          <div className="stat-label">Waste Reduced</div>
        </div>
      </div>

      {/* Donation Trends Chart */}
      <div className="donor-grid">
        <div className="donor-card chart-card span-full">
          <h3 className="card-title">My Donation Trends</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyDonations} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="donations" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="donor-card span-full">
          <h3 className="card-title">My Badges & Achievements</h3>
          <div className="badges-list-row">
            {badges.map(badge => (
              <div key={badge.id} className="badge-card text-center">
                <div className="badge-icon-large">{badge.icon}</div>
                <h4 className="badge-title">{badge.title}</h4>
                <p className="badge-desc">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPostFood = () => (
    <div className="donor-content-section">
      <DonorFoodListingManager showCreate={true} showManage={false} />
    </div>
  );

  const renderListings = () => (
    <div className="donor-content-section">
      <DonorFoodListingManager showCreate={false} showManage={true} />
    </div>
  );

  const renderSettings = () => (
    <div className="donor-content-section">
      <div className="settings-grid">
        {/* Left: Profile Settings */}
        <div className="settings-card">
          <h3 className="settings-card-title">Profile Settings</h3>
          <form onSubmit={handleSettingsSubmit} className="settings-form">
            <div className="sf-field">
              <label className="sf-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={settingsForm.name}
                onChange={handleSettingsChange}
                className="sf-input"
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={settingsForm.email}
                onChange={handleSettingsChange}
                className="sf-input"
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Profile Picture URL</label>
              <input
                type="url"
                name="profilePic"
                value={settingsForm.profilePic}
                onChange={handleSettingsChange}
                className="sf-input"
              />
            </div>
            <div className="sf-field sf-field-gap">
              <label className="sf-label">Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={settingsForm.oldPassword}
                onChange={handleSettingsChange}
                className="sf-input"
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={settingsForm.newPassword}
                onChange={handleSettingsChange}
                className="sf-input"
              />
            </div>
            <button type="submit" className="sf-save-btn">Save Profile</button>
          </form>
        </div>

        {/* Right: Receiver Feedback */}
        <div className="settings-card">
          <h3 className="settings-card-title">Receiver Feedback</h3>
          <div className="sf-feedback-list">
            {feedbacks.map((fb, index) => (
              <div key={fb.id} className={`sf-feedback-item ${index < feedbacks.length - 1 ? 'sf-feedback-border' : ''}`}>
                <div className="sf-stars">⭐⭐⭐⭐⭐</div>
                <p className="sf-feedback-text">"{fb.text}"</p>
                <span className="sf-feedback-author">— {fb.author}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="donor-dashboard-page bg-slate-50 font-sans min-h-screen">
      {/* Hero Header */}
      <div className="donor-hero">
        <div className="donor-hero-inner">
          {/* Profile Row */}
          <div className="dh-profile-row">
            <div className="dh-profile-left">
              <img
                src={settingsForm.profilePic}
                alt="Profile"
                className="dh-avatar"
              />
              <div className="dh-info">
                <span className="dh-welcome">Welcome back!</span>
                <div className="dh-name-row">
                  <h1 className="dh-name">{settingsForm.name}</h1>
                  <span className="dh-badge">Active Donor</span>
                </div>
              </div>
            </div>
            <button className="dh-bell" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
          </div>

          {/* Tabs Row */}
          <div className="dh-tabs-row">
            <nav className="dh-tabs">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'post', label: 'Post Food' },
                { key: 'listings', label: 'My Listings' },
                { key: 'settings', label: 'Settings & Feedback' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`dh-tab ${activeTab === tab.key ? 'dh-tab-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'post' && renderPostFood()}
        {activeTab === 'listings' && renderListings()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Footer - same as Home page */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <h2>FOOD DONATION</h2>
              <p>Making a difference in communities by rescuing surplus food and feeding those in need.</p>
            </div>

            <div className="footer-col">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Impact</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Support</h3>
              <ul>
                <li><a href="#">Contact us</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>

            <div className="footer-col contact-col">
              <h3>Contact Us</h3>
              <ul>
                <li>123 Food Street, Green Town, Pakistan</li>
                <li>☎ +92 343 0686603</li>
                <li>✉ info@fooddonation.com</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Food Donation Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DonorDashboard;
