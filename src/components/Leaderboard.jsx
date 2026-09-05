import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../api';
import { useAuth } from '../AuthContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { token, username } = useAuth();
  const [topDonors, setTopDonors] = useState([]);
  const [currentUserMetrics, setCurrentUserMetrics] = useState({
    totalPoints: 0,
    rank: '-',
    badge: 'Silver Donor',
    donations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ─── Fetch Leaderboard Data ───────────────────────────────
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/`, {
          headers: {
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
        });
        const leaderboardData = await response.json();
        if (!response.ok) {
          console.error('[Leaderboard] Failed to load:', response.status, leaderboardData);
          return;
        }
        setTopDonors(leaderboardData);
        
        // Find current user in leaderboard
        const currentUserEntry = leaderboardData.find(donor => 
          donor.name === username || donor.name.includes(username)
        );
        
        if (currentUserEntry) {
          setCurrentUserMetrics({
            totalPoints: currentUserEntry.points,
            rank: currentUserEntry.rank,
            badge: currentUserEntry.badge,
            donations: currentUserEntry.donations,
          });
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, username]);

  // ─── Badge Helper ──────────────────────────────────────────
  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'Platinum Guardian':
        return '💎';
      case 'Golden Hero':
        return '🥇';
      case 'Silver Donor':
        return '🥈';
      default:
        return '🏅';
    }
  };

  const getBadgeClass = (badge) => {
    switch (badge) {
      case 'Platinum Guardian':
        return 'badge-platinum';
      case 'Golden Hero':
        return 'badge-gold';
      case 'Silver Donor':
        return 'badge-silver';
      default:
        return 'badge-default';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // ─── Points Calculation Logic (50 points per donation) ─────
  const calculatePoints = (donations) => donations * 50;

  if (isLoading) {
    return (
      <div className="leaderboard-section">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '9999px', border: '5px solid #e5e7eb', borderTop: '5px solid #10b981' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-section">
      {/* ─── Current User Metrics Card ───────────────────────── */}
      <div className="user-metrics-card">
        <div className="metrics-header">
          <h3 className="metrics-title">🏆 Your Reward Progress</h3>
          <p className="metrics-subtitle">Track your contribution and climb the leaderboard!</p>
        </div>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-icon">⭐</div>
            <div className="metric-content">
              <div className="metric-value">{currentUserMetrics.totalPoints} pts</div>
              <div className="metric-label">Total Points</div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">#{currentUserMetrics.rank}</div>
              <div className="metric-label">Current Rank</div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">{getBadgeIcon(currentUserMetrics.badge)}</div>
            <div className="metric-content">
              <div className="metric-value">{currentUserMetrics.badge}</div>
              <div className="metric-label">Current Badge</div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">🍲</div>
            <div className="metric-content">
              <div className="metric-value">{currentUserMetrics.donations}</div>
              <div className="metric-label">Donations Made</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leaderboard Table ───────────────────────────────── */}
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">🏆 Top 10 Donors Leaderboard</h3>
          <p className="leaderboard-subtitle">Recognizing our most generous community contributors</p>
        </div>

        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="table-rank">Rank</th>
                <th className="table-name">Donor Name</th>
                <th className="table-points">Points</th>
                <th className="table-donations">Donations</th>
                <th className="table-badge">Badge</th>
              </tr>
            </thead>
            <tbody>
              {topDonors.map((donor, index) => (
                <tr 
                  key={donor.id} 
                  className={`leaderboard-row ${donor.name.includes('You') ? 'current-user-row' : ''}`}
                >
                  <td className="table-rank">
                    <span className="rank-badge">{getRankIcon(index + 1)}</span>
                  </td>
                  <td className="table-name">
                    <div className="donor-name">{donor.name}</div>
                  </td>
                  <td className="table-points">
                    <span className="points-value">{donor.points}</span>
                    <span className="points-label">pts</span>
                  </td>
                  <td className="table-donations">
                    <span className="donations-value">{donor.donations}</span>
                    <span className="donations-label">donations</span>
                  </td>
                  <td className="table-badge">
                    <span className={`badge-pill ${getBadgeClass(donor.badge)}`}>
                      {getBadgeIcon(donor.badge)} {donor.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Reward Rules Info ─────────────────────────────── */}
        <div className="reward-rules">
          <h4 className="rules-title">🎁 Reward System Rules</h4>
          <ul className="rules-list">
            <li className="rule-item">
              <span className="rule-icon">➕</span>
              <span className="rule-text">Each successful food donation awards <strong>+50 Points</strong></span>
            </li>
            <li className="rule-item">
              <span className="rule-icon">🥈</span>
              <span className="rule-text"><strong>Silver Donor:</strong> 0-499 points (Entry tier)</span>
            </li>
            <li className="rule-item">
              <span className="rule-icon">🥇</span>
              <span className="rule-text"><strong>Golden Hero:</strong> 500-999 points (Premium tier)</span>
            </li>
            <li className="rule-item">
              <span className="rule-icon">💎</span>
              <span className="rule-text"><strong>Platinum Guardian:</strong> 1000+ points (Ultimate tier)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
