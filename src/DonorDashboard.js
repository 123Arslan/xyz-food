import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import './DonorDashboard.css';
import './Home.css';

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState('settings');

  // Forms state matching the exact screenshot requirements
  const [postForm, setPostForm] = useState({
    foodTitle: '',
    foodType: '',
    quantity: '',
    description: '',
    pickupTime: '',
    expiryTime: '',
    pickupLocation: '',
    contactPhone: '',
    foodImageUrl: ''
  });

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
    { id: 1, title: 'First Donation', icon: '🌟', description: 'Made your first donation' },
    { id: 2, title: 'Waste Warrior', icon: '🦸', description: 'Saved over 100 lbs of food' },
    { id: 3, title: 'Community Hero', icon: '🏆', description: 'Fed 50+ people' },
  ];

  const handlePostChange = (e) => setPostForm({ ...postForm, [e.target.name]: e.target.value });
  const handleSettingsChange = (e) => setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    console.log('New Food Listing:', postForm);
    alert('Listing created successfully!');
    setPostForm({
      foodTitle: '', foodType: '', quantity: '', description: '',
      pickupTime: '', expiryTime: '', pickupLocation: '', contactPhone: '', foodImageUrl: ''
    });
  };

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
          <div className="stat-icon">📋</div>
          <div className="stat-value">2</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="donor-card stat-card stat-yellow">
          <div className="stat-icon">🎁</div>
          <div className="stat-value">45</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="donor-card stat-card stat-blue">
          <div className="stat-icon">👨‍👩‍👧‍👦</div>
          <div className="stat-value">230</div>
          <div className="stat-label">People Fed</div>
        </div>
        <div className="donor-card stat-card stat-pink">
          <div className="stat-icon">♻️</div>
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
      <div className="post-food-card">
        {/* Header */}
        <div className="post-food-header">
          <h3>Add New Food Listing</h3>
          <button className="post-food-close">✕</button>
        </div>

        <form onSubmit={handlePostSubmit} className="post-food-form">
          {/* Food Title */}
          <div className="pf-field">
            <label className="pf-label">Food Title *</label>
            <input
              type="text"
              name="foodTitle"
              value={postForm.foodTitle}
              onChange={handlePostChange}
              required
              placeholder="e.g. Homemade Pasta"
              className="pf-input"
            />
          </div>

          {/* Food Type + Quantity - side by side */}
          <div className="pf-row">
            <div className="pf-field">
              <label className="pf-label">Food Type *</label>
              <select
                name="foodType"
                value={postForm.foodType}
                onChange={handlePostChange}
                required
                className="pf-input pf-select"
              >
                <option value="">Select type</option>
                <option value="Cooked Meal">Cooked Meal</option>
                <option value="Raw Ingredients">Raw Ingredients</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Baked Goods">Baked Goods</option>
              </select>
            </div>
            <div className="pf-field">
              <label className="pf-label">Quantity *</label>
              <input
                type="text"
                name="quantity"
                value={postForm.quantity}
                onChange={handlePostChange}
                required
                placeholder="e.g. 5 servings"
                className="pf-input"
              />
            </div>
          </div>

          {/* Description */}
          <div className="pf-field">
            <label className="pf-label">Description</label>
            <textarea
              name="description"
              value={postForm.description}
              onChange={handlePostChange}
              rows="4"
              placeholder="Details about the food..."
              className="pf-input pf-textarea"
            ></textarea>
          </div>

          {/* Pickup Time + Expiry Time - side by side */}
          <div className="pf-row">
            <div className="pf-field">
              <label className="pf-label">Pickup Time</label>
              <input
                type="text"
                name="pickupTime"
                value={postForm.pickupTime}
                onChange={handlePostChange}
                placeholder="e.g. 2-5 PM today"
                className="pf-input"
              />
            </div>
            <div className="pf-field">
              <label className="pf-label">Expiry Time</label>
              <input
                type="datetime-local"
                name="expiryTime"
                value={postForm.expiryTime}
                onChange={handlePostChange}
                className="pf-input"
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="pf-field">
            <label className="pf-label">Pickup Location *</label>
            <div className="pf-location-wrap">
              <span className="pf-location-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                </svg>
              </span>
              <input
                type="text"
                name="pickupLocation"
                value={postForm.pickupLocation}
                onChange={handlePostChange}
                required
                placeholder="Street address or landmark"
                className="pf-input pf-input-icon"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div className="pf-field">
            <label className="pf-label">Contact Phone</label>
            <input
              type="tel"
              name="contactPhone"
              value={postForm.contactPhone}
              onChange={handlePostChange}
              placeholder="+1 (555) 000-0000"
              className="pf-input"
            />
          </div>

          {/* Food Image URL */}
          <div className="pf-field">
            <label className="pf-label">Food Image URL (optional)</label>
            <input
              type="url"
              name="foodImageUrl"
              value={postForm.foodImageUrl}
              onChange={handlePostChange}
              placeholder="https://..."
              className="pf-input"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="pf-submit-btn">
            <span className="pf-submit-icon">+</span>
            Create Listing
          </button>
        </form>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="donor-content-section">
      {/* Active Listings */}
      <div className="listing-card">
        <h3 className="listing-card-title">My Active Listings</h3>
        <div className="listing-table-wrap">
          <table className="listing-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeListings.map(listing => (
                <tr key={listing.id}>
                  <td className="lt-title">{listing.title}</td>
                  <td className="lt-muted">{listing.type}</td>
                  <td className="lt-muted">{listing.quantity}</td>
                  <td>
                    <span className={`lt-badge lt-badge-${listing.status.toLowerCase()}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td>
                    <div className="lt-actions">
                      {/* Edit */}
                      <button className="lt-action-btn lt-edit" onClick={() => console.log('Edit', listing.id)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      {/* Complete */}
                      <button className="lt-action-btn lt-complete" onClick={() => console.log('Complete', listing.id)} title="Complete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </button>
                      {/* Delete */}
                      <button className="lt-action-btn lt-delete" onClick={() => console.log('Delete', listing.id)} title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation History */}
      <div className="listing-card" style={{ marginTop: '30px' }}>
        <h3 className="listing-card-title">Donation History</h3>
        <div className="listing-table-wrap">
          <table className="listing-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Receiver</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donationHistory.map(history => (
                <tr key={history.id}>
                  <td className="lt-title">{history.title}</td>
                  <td className="lt-muted">{history.date}</td>
                  <td className="lt-muted">{history.receiver}</td>
                  <td>
                    <span className="lt-badge lt-badge-completed">{history.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
                <div className="sf-stars">★★★★★</div>
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
                <li>📞 +92 343 0686603</li>
                <li>📧 info@fooddonation.com</li>
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