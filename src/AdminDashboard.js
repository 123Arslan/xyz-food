import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';
import { getAdminStats, getAdminListings, deleteAdminListing, getAdminUsers, toggleBanUser } from './api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Forms state
  const [postForm, setPostForm] = useState({ title: '', description: '', location: '' });
  const [settingsForm, setSettingsForm] = useState({ oldPassword: '', newPassword: '', notifications: true });

  // API Data state
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock Data for charts
  const monthlyDonations = [
    { month: 'Jan', donations: 120 }, { month: 'Feb', donations: 250 },
    { month: 'Mar', donations: 380 }, { month: 'Apr', donations: 500 },
    { month: 'May', donations: 420 }, { month: 'Jun', donations: 300 }
  ];

  const feedbacks = [
    { id: 1, text: "The fresh produce really helped our community kitchen this week. Thank you!", author: "Shelter B" },
    { id: 2, text: "Very smooth process claiming the food. The app works great.", author: "Community Center" }
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, listingsRes, usersRes] = await Promise.all([
        getAdminStats(),
        getAdminListings(),
        getAdminUsers()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (listingsRes.success) setListings(listingsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const result = await deleteAdminListing(listingId);
      if (result.success) {
        setListings(listings.filter(l => l.id !== listingId));
        alert('Listing deleted successfully');
      } else {
        alert('Failed to delete listing: ' + (result.error?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting listing');
      console.error(err);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const result = await toggleBanUser(userId);
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: result.data.is_active } : u));
        alert(result.data.message);
      } else {
        alert('Failed to update user status: ' + (result.error?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating user status');
      console.error(err);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.post(`http://localhost:8000/api/admin/users/${userId}/approve/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      alert(response.data.message);
      setUsers(users.map(u => u.id === userId ? { ...u, account_status: 'Active' } : u));
    } catch (err) {
      alert('Failed to approve user');
      console.error(err);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.post(`http://localhost:8000/api/admin/users/${userId}/reject/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      alert(response.data.message);
      setUsers(users.map(u => u.id === userId ? { ...u, account_status: 'Rejected' } : u));
    } catch (err) {
      alert('Failed to reject user');
      console.error(err);
    }
  };

  // Group users by account type
  const usersByRole = users.reduce((acc, user) => {
    const role = user.account_type || 'Donor';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {});

  // Calculate top donors based on listings count
  const donorStats = users
    .filter(u => u.account_type === 'Donor' || u.account_type === 'Organization')
    .map(u => ({
      ...u,
      donationCount: listings.filter(l => l.user === u.id).length
    }))
    .sort((a, b) => b.donationCount - a.donationCount)
    .slice(0, 3)
    .map((d, i) => ({
      id: d.id,
      name: d.full_name || d.username,
      medal: i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉',
      donations: d.donationCount
    }));

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
      {loading ? (
        <div className="admin-card"><p>Loading...</p></div>
      ) : error ? (
        <div className="admin-card"><p className="error">{error}</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="admin-card stat-card"><div className="stat-value">{stats?.total_users || 0}</div><div className="stat-label">Total Users</div></div>
            <div className="admin-card stat-card"><div className="stat-value">{stats?.total_food || 0}</div><div className="stat-label">Available Food</div></div>
            <div className="admin-card stat-card"><div className="stat-value">{stats?.total_donations || 0}</div><div className="stat-label">Completed Donations</div></div>
            <div className="admin-card stat-card"><div className="stat-value">{listings.length}</div><div className="stat-label">Total Listings</div></div>
          </div>

          <h3 className="section-title">Listings by Status</h3>
          <div className="stats-grid status-grid">
            <div className="admin-card stat-card status-available"><div className="stat-value">{stats?.status_stats?.available || 0}</div><div className="stat-label">Available</div></div>
            <div className="admin-card stat-card status-claimed"><div className="stat-value">{stats?.status_stats?.pending || 0}</div><div className="stat-label">Pending</div></div>
            <div className="admin-card stat-card status-completed"><div className="stat-value">{stats?.status_stats?.completed || 0}</div><div className="stat-label">Completed</div></div>
          </div>
        </>
      )}

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
      {loading ? (
        <div className="admin-card"><p>Loading...</p></div>
      ) : error ? (
        <div className="admin-card"><p className="error">{error}</p></div>
      ) : (
        <div className="admin-grid">
          <div className="admin-card">
            <h3 className="card-title">Users by Role</h3>
            
            {Object.entries(usersByRole).map(([role, roleUsers]) => (
              <div key={role} className="role-list-section">
                <h4 className="role-title">{role}s</h4>
                <ul className="user-list">
                  {roleUsers.map(u => (
                    <li key={u.id}>
                      {u.full_name || u.username} 
                      <span>({u.email})</span>
                      <span className={`status-indicator ${u.is_active ? 'active' : 'banned'}`}>
                        {u.is_active ? 'Active' : 'Banned'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <h3 className="card-title">Top Donors Badges</h3>
            <div className="badges-list">
              {donorStats.length > 0 ? donorStats.map(donor => (
                <div key={donor.id} className="badge-item">
                  <span className="badge-medal">{donor.medal}</span>
                  <div className="badge-info">
                    <strong>{donor.name}</strong>
                    <p>{donor.donations} Donations</p>
                  </div>
                </div>
              )) : <p>No donor data available</p>}
            </div>
          </div>
        </div>
      )}
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
          <h3 className="card-title">All Listings</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(listing => (
                    <tr key={listing.id}>
                      <td>#{listing.id}</td>
                      <td>{listing.food_title}</td>
                      <td>{listing.food_type}</td>
                      <td>{listing.pickup_location}</td>
                      <td><span className={`status-badge ${listing.status.toLowerCase()}`}>{listing.status}</span></td>
                      <td className="action-btns">
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listings.length === 0 && <p>No listings found</p>}
            </div>
          )}
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
          <h3 className="card-title">User Management</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.full_name || user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.account_type}</td>
                      <td><span className={`status-badge ${user.account_status === 'Active' ? 'active' : user.account_status === 'Rejected' ? 'rejected' : 'pending'}`}>{user.account_status || 'Pending'}</span></td>
                      <td className="action-btns">
                        {user.account_status === 'Pending' && (
                          <>
                            <button 
                              className="approve-btn"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          className={user.is_active ? 'ban-btn' : 'unban-btn'}
                          onClick={() => handleToggleBan(user.id)}
                        >
                          {user.is_active ? 'Ban' : 'Unban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p>No users found</p>}
            </div>
          )}
        </div>

        <div className="admin-card span-full">
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
