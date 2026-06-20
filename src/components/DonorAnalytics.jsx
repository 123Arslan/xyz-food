import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './DonorAnalytics.css';

const DonorAnalytics = () => {
  // ─── Mock Data ─────────────────────────────────────────────
  const monthlyDonationData = useMemo(() => [
    { month: 'Jan', weight: 45, meals: 180 },
    { month: 'Feb', weight: 52, meals: 208 },
    { month: 'Mar', weight: 38, meals: 152 },
    { month: 'Apr', weight: 65, meals: 260 },
    { month: 'May', weight: 58, meals: 232 },
    { month: 'Jun', weight: 72, meals: 288 },
  ], []);

  const impactTimelineData = useMemo(() => [
    { date: 'Jan', peopleFed: 150 },
    { date: 'Feb', peopleFed: 195 },
    { date: 'Mar', peopleFed: 175 },
    { date: 'Apr', peopleFed: 245 },
    { date: 'May', peopleFed: 220 },
    { date: 'Jun', peopleFed: 290 },
  ], []);

  // ─── Analytics Stats ───────────────────────────────────────
  const totalMealsDonated = useMemo(() => {
    return monthlyDonationData.reduce((sum, item) => sum + item.meals, 0);
  }, [monthlyDonationData]);

  const totalWeightDonated = useMemo(() => {
    return monthlyDonationData.reduce((sum, item) => sum + item.weight, 0);
  }, [monthlyDonationData]);

  const totalPeopleFed = useMemo(() => {
    return impactTimelineData.reduce((sum, item) => sum + item.peopleFed, 0);
  }, [impactTimelineData]);

  const averageRating = 4.9;

  return (
    <div className="donor-analytics-section">
      {/* ─── Analytics Header ───────────────────────────────── */}
      <div className="analytics-header">
        <h2 className="analytics-title">📊 Your Donation Analytics</h2>
        <p className="analytics-subtitle">Track your impact and contribution to the community</p>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────── */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card stat-meals">
          <div className="stat-icon">🍲</div>
          <div className="stat-content">
            <div className="stat-value">{totalMealsDonated}</div>
            <div className="stat-label">Total Meals Donated</div>
          </div>
        </div>

        <div className="analytics-stat-card stat-weight">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div className="stat-value">{totalWeightDonated} kg</div>
            <div className="stat-label">Total Food Weight</div>
          </div>
        </div>

        <div className="analytics-stat-card stat-impact">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-value">{totalPeopleFed}</div>
            <div className="stat-label">Lives Impacted</div>
          </div>
        </div>

        <div className="analytics-stat-card stat-rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{averageRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {/* ─── Charts Grid ─────────────────────────────────────── */}
      <div className="analytics-charts-grid">
        {/* Monthly Food Weight/Meals Chart */}
        <div className="analytics-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Food Donations</h3>
            <p className="chart-subtitle">Weight (kg) and Meals donated per month</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyDonationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  name="Weight (kg)"
                  stroke="#059669" 
                  fill="#059669" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="meals" 
                  name="Meals"
                  stroke="#047857" 
                  fill="#047857" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Timeline Chart */}
        <div className="analytics-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Impact Timeline</h3>
            <p className="chart-subtitle">People fed over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={impactTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="peopleFed" 
                  name="People Fed"
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', r: 4 }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorAnalytics;
