import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Forms state
  const [postForm, setPostForm] = useState({ title: '', description: '', location: '' });
  const [settingsForm, setSettingsForm] = useState({ oldPassword: '', newPassword: '', notifications: true });

  // Mock Data
  const monthlyDonations = [
    { month: 'Jan', donations: 120 }, { month: 'Feb', donations: 250 },
    { month: 'Mar', donations: 380 }, { month: 'Apr', donations: 500 },
    { month: 'May', donations: 420 }, { month: 'Jun', donations: 300 }
  ];

  const activeListings = [
    { id: 1, title: 'Leftover Bread', status: 'Available', donor: 'John Doe' },
    { id: 2, title: 'Fresh Veggies', status: 'Claimed', donor: 'Jane Smith' },
    { id: 3, title: 'Cooked Meals', status: 'Available', donor: 'Restaurant A' },
  ];

  const donationHistory = [
    { id: 101, title: '50 Boxed Lunches', date: '2026-04-10', receiver: 'Shelter B' },
    { id: 102, title: 'Bakery Items', date: '2026-04-15', receiver: 'Community Center' },
  ];

  const users = {
    admins: [{ id: 1, name: 'Admin 1', email: 'admin1@test.com' }],
    donors: [{ id: 2, name: 'John Doe', email: 'john@test.com' }, { id: 3, name: 'Restaurant A', email: 'rest@test.com' }],
    receivers: [{ id: 4, name: 'Shelter B', email: 'shelter@test.com' }]
  };

  const feedbacks = [
    { id: 1, text: "The fresh produce really helped our community kitchen this week. Thank you!", author: "Shelter B" },
    { id: 2, text: "Very smooth process claiming the food. The app works great.", author: "Community Center" }
  ];

  const topDonors = [
    { id: 1, name: 'Restaurant A', medal: '🥇', donations: 150 },
    { id: 2, name: 'John Doe', medal: '🥈', donations: 85 },
    { id: 3, name: 'Jane Smith', medal: '🥉', donations: 40 },
  ];

  const handlePostChange = (e) => setPostForm({ ...postForm, [e.target.name]: e.target.value });
  const handleSettingsChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettingsForm({ ...settingsForm, [e.target.name]: value });
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    console.log('Admin posted listing:', postForm);
    alert('Listing posted successfully!');
    setPostForm({ title: '', description: '', location: '' });
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    console.log('Settings updated:', settingsForm);
    alert('Settings saved successfully!');
    setSettingsForm({ oldPassword: '', newPassword: '', notifications: settingsForm.notifications });
  };

  const renderOverview = () => (
    <div className="admin-content-section">
      <div className="stats-grid">
        <div className="admin-card stat-card"><div className="stat-value">2</div><div className="stat-label">Total Users</div></div>
        <div className="admin-card stat-card"><div className="stat-value">8</div><div className="stat-label">Total Listings</div></div>
        <div className="admin-card stat-card"><div className="stat-value">1</div><div className="stat-label">Completed</div></div>
        <div className="admin-card stat-card"><div className="stat-value">0</div><div className="stat-label">Open Complaints</div></div>
      </div>

      <h3 className="section-title">Listings by Status</h3>
      <div className="stats-grid status-grid">
        <div className="admin-card stat-card status-available"><div className="stat-value">3</div><div className="stat-label">Available</div></div>
        <div className="admin-card stat-card status-claimed"><div className="stat-value">4</div><div className="stat-label">Claimed</div></div>
        <div className="admin-card stat-card status-completed"><div className="stat-value">1</div><div className="stat-label">Completed</div></div>
      </div>

      <div className="admin-card chart-card">
        <h3 className="card-title">Monthly Donations</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyDonations} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="donations" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-content-section">
      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="card-title">Users by Role</h3>
          
          <div className="role-list-section">
            <h4 className="role-title">Admins</h4>
            <ul className="user-list">
              {users.admins.map(u => <li key={u.id}>{u.name} <span>({u.email})</span></li>)}
            </ul>
          </div>
          <div className="role-list-section">
            <h4 className="role-title">Donors</h4>
            <ul className="user-list">
              {users.donors.map(u => <li key={u.id}>{u.name} <span>({u.email})</span></li>)}
            </ul>
          </div>
          <div className="role-list-section">
            <h4 className="role-title">Receivers</h4>
            <ul className="user-list">
              {users.receivers.map(u => <li key={u.id}>{u.name} <span>({u.email})</span></li>)}
            </ul>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="card-title">Top Donors Badges</h3>
          <div className="badges-list">
            {topDonors.map(donor => (
              <div key={donor.id} className="badge-item">
                <span className="badge-medal">{donor.medal}</span>
                <div className="badge-info">
                  <strong>{donor.name}</strong>
                  <p>{donor.donations} Donations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="admin-content-section">
      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="card-title">Post Food (On behalf of Donor)</h3>
          <form onSubmit={handlePostSubmit} className="admin-form">
            <div className="form-group">
              <label>Title</label>
              <input type="text" name="title" value={postForm.title} onChange={handlePostChange} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={postForm.description} onChange={handlePostChange} required rows="3"></textarea>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={postForm.location} onChange={handlePostChange} required />
            </div>
            <button type="submit" className="admin-btn">Post Listing</button>
          </form>
        </div>

        <div className="admin-card span-full">
          <h3 className="card-title">Active Listings</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Donor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeListings.map(listing => (
                  <tr key={listing.id}>
                    <td>#{listing.id}</td>
                    <td>{listing.title}</td>
                    <td>{listing.donor}</td>
                    <td><span className={`status-badge ${listing.status.toLowerCase()}`}>{listing.status}</span></td>
                    <td className="action-btns">
                      <button className="edit-btn">Edit</button>
                      <button className="complete-btn">Complete</button>
                      <button className="delete-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card span-full">
          <h3 className="card-title">Donation History</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Receiver</th>
                </tr>
              </thead>
              <tbody>
                {donationHistory.map(history => (
                  <tr key={history.id}>
                    <td>#{history.id}</td>
                    <td>{history.title}</td>
                    <td>{history.date}</td>
                    <td>{history.receiver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-content-section">
      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="card-title">Account Settings</h3>
          <form onSubmit={handleSettingsSubmit} className="admin-form">
            <div className="form-group">
              <label>Old Password</label>
              <input type="password" name="oldPassword" value={settingsForm.oldPassword} onChange={handleSettingsChange} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" name="newPassword" value={settingsForm.newPassword} onChange={handleSettingsChange} />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="notifications" checked={settingsForm.notifications} onChange={handleSettingsChange} />
                Enable Email Notifications
              </label>
            </div>
            <button type="submit" className="admin-btn">Save Settings</button>
          </form>
        </div>

        <div className="admin-card">
          <h3 className="card-title">Receiver Feedback</h3>
          <div className="feedback-list">
            {feedbacks.map(fb => (
              <div key={fb.id} className="feedback-item">
                <p className="feedback-text">"{fb.text}"</p>
                <span className="feedback-author">- {fb.author}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-page">
      <div className="admin-sidebar">
        <h2 className="admin-logo">Admin Panel</h2>
        <ul className="admin-nav">
          <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</li>
          <li className={activeTab === 'listings' ? 'active' : ''} onClick={() => setActiveTab('listings')}>Listings & Forms</li>
          <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users & Badges</li>
          <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings & Feedback</li>
        </ul>
      </div>
      
      <div className="admin-main-content">
        <div className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="admin-profile">Admin User</div>
        </div>
        
        <div className="admin-content-body">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
