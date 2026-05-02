import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Impact.css';

const Impact = () => {
  // Dynamic stats array
  const impactStats = [
    {
      id: 1,
      icon: '📦',
      number: '102',
      label: 'Total Listings'
    },
    {
      id: 2,
      icon: '❤️',
      number: '15,200+',
      label: 'Meals Delivered'
    },
    {
      id: 3,
      icon: '📍',
      number: '4',
      label: 'Active Claims'
    },
    {
      id: 4,
      icon: '🌱',
      number: '4.2 tons',
      label: 'Food Waste Reduced'
    }
  ];

  // Chart 1 Data: Monthly Donations Growth
  const monthlyData = [
    { month: 'Jan', donations: 150 },
    { month: 'Feb', donations: 300 },
    { month: 'Mar', donations: 450 },
    { month: 'Apr', donations: 600 },
    { month: 'May', donations: 450 },
    { month: 'Jun', donations: 300 }
  ];

  // Chart 2 Data: Food Types Donated
  const foodTypeData = [
    { name: 'Cooked Meals', value: 35 },
    { name: 'Packaged Food', value: 25 },
    { name: 'Fruits & Veggies', value: 20 },
    { name: 'Bakery', value: 12 },
    { name: 'Other', value: 8 }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="impact-page">
      {/* Hero Section */}
      <div className="impact-hero-section">
        <div className="impact-container">
          <h1 className="impact-title">Our Impact</h1>
          <p className="impact-description">
            Every donation makes a difference. Here's how our community is changing lives and reducing waste.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <section className="impact-stats-section">
        <div className="impact-stats-container">
          <div className="impact-stats-grid">
            {impactStats.map((stat) => (
              <div key={stat.id} className="impact-stat-card">
                <div className="impact-stat-icon">{stat.icon}</div>
                <h3 className="impact-stat-number">{stat.number}</h3>
                <p className="impact-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="impact-charts-section">
        <div className="impact-charts-container">
          <h2 className="charts-section-title">Data Insights</h2>
          <div className="charts-grid">
            
            {/* Chart 1: Bar Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Monthly Donations Growth</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="donations" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Donut Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Food Types Donated</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={foodTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {foodTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* FOOTER SECTION */}
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

export default Impact;
