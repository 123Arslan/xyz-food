import React, { useState, useEffect } from 'react';
import './ReceiverDashboard.css';
import './Home.css';

// ─── Mock Data ───────────────────────────────────────────────
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

const INITIAL_FOOD_ITEMS = [
  {
    id: 1,
    name: 'Chicken Biryani',
    type: 'Cooked Meal',
    donor: 'Al-Madina Restaurant',
    quantity: '15 servings',
    timeLeft: '2 hrs left',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    name: 'Fresh Vegetables Pack',
    type: 'Raw Ingredients',
    donor: 'Green Farm Market',
    quantity: '10 packs',
    timeLeft: '5 hrs left',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    name: 'Assorted Bakery Items',
    type: 'Baked Goods',
    donor: 'City Bakery',
    quantity: '20 pieces',
    timeLeft: '3 hrs left',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    name: 'Canned Food Bundle',
    type: 'Packaged Food',
    donor: 'Hope Foundation',
    quantity: '8 bundles',
    timeLeft: '12 hrs left',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 5,
    name: 'Dal Chawal',
    type: 'Cooked Meal',
    donor: 'Saylani Welfare',
    quantity: '25 servings',
    timeLeft: '1 hr left',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 6,
    name: 'Fruit Basket',
    type: 'Raw Ingredients',
    donor: 'FreshCo Mart',
    quantity: '12 baskets',
    timeLeft: '8 hrs left',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
  },
];

const INITIAL_CLAIMS = [
  {
    id: 101,
    name: 'Naan & Curry Pack',
    donor: 'Karachi Foods',
    status: 'Ready for Pickup',
    icon: '🥘',
    rating: 0,
    feedbackSubmitted: false,
  },
  {
    id: 102,
    name: 'Rice Bags (5kg)',
    donor: 'Edhi Foundation',
    status: 'Completed',
    icon: '🍚',
    rating: 4,
    feedbackSubmitted: true,
  },
];

// ─── Helper: food type → CSS class ──────────────────────────
const getFoodTypeClass = (type) => {
  switch (type) {
    case 'Cooked Meal': return 'food-type-cooked';
    case 'Raw Ingredients': return 'food-type-raw';
    case 'Packaged Food': return 'food-type-packaged';
    case 'Baked Goods': return 'food-type-baked';
    default: return 'food-type-cooked';
  }
};

const getFoodIcon = (type) => {
  switch (type) {
    case 'Cooked Meal': return '🍛';
    case 'Raw Ingredients': return '🥬';
    case 'Packaged Food': return '📦';
    case 'Baked Goods': return '🍞';
    default: return '🍽️';
  }
};

// ─── Star Rating Component ──────────────────────────────────
const StarRating = ({ rating, onRate, disabled }) => {
  const [hoverIndex, setHoverIndex] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star-btn ${star <= rating ? 'star-filled' : ''} ${star <= hoverIndex && !disabled ? 'star-hover' : ''}`}
          onClick={() => !disabled && onRate(star)}
          onMouseEnter={() => !disabled && setHoverIndex(star)}
          onMouseLeave={() => setHoverIndex(0)}
          disabled={disabled}
          type="button"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ─── RECEIVER DASHBOARD ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const ReceiverDashboard = () => {
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [foodItems, setFoodItems] = useState(INITIAL_FOOD_ITEMS);
  const [claims, setClaims] = useState(INITIAL_CLAIMS);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('food');

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ─── Stats ────────────────────────────────────────────────
  const mealsAvailable = foodItems.reduce((sum, item) => {
    const num = parseInt(item.quantity) || 1;
    return sum + num;
  }, 0);
  const mealsClaimed = claims.filter(c => c.status !== 'Completed').length;
  const mealsFed = claims.filter(c => c.status === 'Completed').length;

  // ─── Claim a food item ────────────────────────────────────
  const handleClaim = (foodId) => {
    const item = foodItems.find(f => f.id === foodId);
    if (!item) return;

    // Remove from food list
    setFoodItems(prev => prev.filter(f => f.id !== foodId));

    // Add to claims with Pending status
    const newClaim = {
      id: Date.now(),
      name: item.name,
      donor: item.donor,
      status: 'Pending',
      icon: getFoodIcon(item.type),
      rating: 0,
      feedbackSubmitted: false,
    };
    setClaims(prev => [newClaim, ...prev]);
    setToast({ icon: '✅', message: `"${item.name}" claimed successfully!` });
  };

  // ─── Mark as Picked Up ────────────────────────────────────
  const handlePickup = (claimId) => {
    setClaims(prev =>
      prev.map(c =>
        c.id === claimId ? { ...c, status: 'Picked Up' } : c
      )
    );
    setToast({ icon: '📦', message: 'Marked as picked up! Please leave your feedback.' });
  };

  // ─── Submit Rating ────────────────────────────────────────
  const handleRate = (claimId, stars) => {
    setClaims(prev =>
      prev.map(c =>
        c.id === claimId ? { ...c, rating: stars } : c
      )
    );
  };

  const handleSubmitFeedback = (claimId) => {
    setClaims(prev =>
      prev.map(c =>
        c.id === claimId ? { ...c, feedbackSubmitted: true, status: 'Completed' } : c
      )
    );
    setToast({ icon: '⭐', message: 'Thank you for your feedback!' });
  };

  // ─── Navigation Handlers (for footer links) ───────────────
  const handleNavigation = (section) => {
    setToast({ icon: '🔗', message: `Navigating to ${section}...` });
    // Here you can add actual navigation logic using React Router if needed
    // Example: navigate(`/${section.toLowerCase()}`);
  };

  // ─── Get status CSS class ─────────────────────────────────
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'claim-status-pending';
      case 'Ready for Pickup': return 'claim-status-ready';
      case 'Picked Up': return 'claim-status-pickedup';
      case 'Completed': return 'claim-status-completed';
      default: return '';
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ─── RENDER: Food List ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const renderFoodList = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">🍽️</span>
          Available Food
        </h2>
        <span className="receiver-section-subtitle">{foodItems.length} items near you</span>
      </div>

      {foodItems.length > 0 ? (
        <div className="food-list-grid">
          {foodItems.map(item => (
            <div className="food-card" key={item.id}>
              <img
                src={item.image}
                alt={item.name}
                className="food-card-img"
                loading="lazy"
              />
              <div className="food-card-body">
                <span className={`food-card-type ${getFoodTypeClass(item.type)}`}>
                  {item.type}
                </span>
                <h3 className="food-card-name">{item.name}</h3>
                <p className="food-card-donor">
                  <span>👤</span> {item.donor}
                </p>
                <p className="food-card-qty">📦 {item.quantity}</p>
                <div className="food-card-footer">
                  <span className="food-card-time">⏰ {item.timeLeft}</span>
                  <button
                    className="food-claim-btn"
                    onClick={() => handleClaim(item.id)}
                    id={`claim-btn-${item.id}`}
                  >
                    Claim
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="food-empty-state">
          <div className="food-empty-icon">🔍</div>
          <h3 className="food-empty-title">No food available right now</h3>
          <p className="food-empty-text">Check back soon — new listings appear frequently!</p>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // ─── RENDER: My Claims ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const renderMyClaims = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">📋</span>
          My Claims
        </h2>
        <span className="receiver-section-subtitle">{claims.length} total</span>
      </div>

      {claims.length > 0 ? (
        <div className="claims-list">
          {claims.map(claim => (
            <div className="claim-card" key={claim.id}>
              <div className="claim-card-icon">{claim.icon}</div>
              <div className="claim-card-info">
                <h4 className="claim-card-name">{claim.name}</h4>
                <p className="claim-card-donor">From: {claim.donor}</p>

                {/* Show star rating + feedback ONLY after Picked Up */}
                {claim.status === 'Picked Up' && !claim.feedbackSubmitted && (
                  <div className="feedback-row">
                    <span className="feedback-label">Rate your experience:</span>
                    <StarRating
                      rating={claim.rating}
                      onRate={(stars) => handleRate(claim.id, stars)}
                      disabled={false}
                    />
                    {claim.rating > 0 && (
                      <button
                        className="feedback-submit-btn"
                        onClick={() => handleSubmitFeedback(claim.id)}
                      >
                        Submit Feedback
                      </button>
                    )}
                  </div>
                )}

                {/* Show submitted feedback */}
                {claim.feedbackSubmitted && (
                  <div className="feedback-row">
                    <div className="feedback-submitted">
                      <span>✅</span> Feedback submitted — {claim.rating}/5 stars
                    </div>
                  </div>
                )}
              </div>

              <div className="claim-card-right">
                <span className={`claim-status ${getStatusClass(claim.status)}`}>
                  <span className="claim-status-dot"></span>
                  {claim.status}
                </span>

                {/* Show "Picked Up" button for Ready for Pickup & Pending */}
                {(claim.status === 'Pending' || claim.status === 'Ready for Pickup') && (
                  <button
                    className="claim-action-btn claim-pickup-btn"
                    onClick={() => handlePickup(claim.id)}
                  >
                    Picked Up
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="food-empty-state">
          <div className="food-empty-icon">📭</div>
          <h3 className="food-empty-title">No claims yet</h3>
          <p className="food-empty-text">Browse available food and claim what you need.</p>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // ─── RENDER: Help Section ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const renderHelp = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">🤝</span>
          Need Help?
        </h2>
      </div>

      <div className="help-grid">
        {/* Nearest Mosque */}
        <div className="help-card help-card-mosque">
          <div className="help-card-icon">🕌</div>
          <h3 className="help-card-title">Nearest Mosque</h3>
          <p className="help-card-text">
            Badshahi Mosque, Walled City,<br />
            {selectedCity}
          </p>
          <button className="help-card-btn help-btn-mosque">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3"></circle>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
            </svg>
            Get Directions
          </button>
        </div>

        {/* Helpline */}
        <div className="help-card help-card-helpline">
          <div className="help-card-icon">📞</div>
          <h3 className="help-card-title">Helpline</h3>
          <p className="help-card-text">
            24/7 Support Available<br />
            +92 343 0686603
          </p>
          <button
            className="help-card-btn help-btn-helpline"
            onClick={() => setToast({ icon: '📞', message: 'Calling helpline...' })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Call Now
          </button>
        </div>

        {/* Volunteer */}
        <div className="help-card help-card-volunteer">
          <div className="help-card-icon">🙋</div>
          <h3 className="help-card-title">Call a Volunteer</h3>
          <p className="help-card-text">
            Can't pick up? A volunteer<br />
            can deliver to you.
          </p>
          <button
            className="help-card-btn help-btn-volunteer"
            onClick={() => setToast({ icon: '🙋', message: 'Connecting you with a volunteer...' })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Request Volunteer
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // ─── MAIN RENDER ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="receiver-dashboard-page" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ─── Hero Header ─── */}
      <div className="receiver-hero">
        <div className="receiver-hero-inner">
          {/* Profile Row */}
          <div className="rh-profile-row">
            <div className="rh-profile-left">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Profile"
                className="rh-avatar"
              />
              <div className="rh-info">
                <span className="rh-welcome">Assalamu Alaikum 👋</span>
                <div className="rh-name-row">
                  <h1 className="rh-name">Ahmed Khan</h1>
                  <span className="rh-badge">Receiver</span>
                </div>
              </div>
            </div>
            <button className="rh-bell" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="rh-bell-dot"></span>
            </button>
          </div>

          {/* City Selector */}
          <div className="rh-city-row">
            <span className="rh-city-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
              </svg>
              Your City
            </span>
            <select
              className="rh-city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              id="city-selector"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="rh-tabs-row">
            <nav className="rh-tabs">
              {[
                { key: 'food', label: 'Available Food' },
                { key: 'claims', label: 'My Claims' },
                { key: 'help', label: 'Help & Support' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rh-tab ${activeTab === tab.key ? 'rh-tab-active' : ''}`}
                  id={`tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="receiver-content-area">
        {/* Stats Cards (always visible) */}
        <div className="receiver-stats-grid">
          <div className="receiver-stat-card rsc-meals-available">
            <div className="rsc-icon-wrap">🍲</div>
            <div className="rsc-info">
              <div className="rsc-value">{mealsAvailable}</div>
              <div className="rsc-label">Meals Available Today</div>
            </div>
          </div>
          <div className="receiver-stat-card rsc-meals-claimed">
            <div className="rsc-icon-wrap">📝</div>
            <div className="rsc-info">
              <div className="rsc-value">{mealsClaimed}</div>
              <div className="rsc-label">Claimed by Me</div>
            </div>
          </div>
          <div className="receiver-stat-card rsc-meals-fed">
            <div className="rsc-icon-wrap">🎉</div>
            <div className="rsc-info">
              <div className="rsc-value">{mealsFed}</div>
              <div className="rsc-label">Total Meals Fed</div>
            </div>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'food' && renderFoodList()}
        {activeTab === 'claims' && renderMyClaims()}
        {activeTab === 'help' && renderHelp()}
      </div>

      {/* ─── Footer ─── */}
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
                <li><button onClick={() => handleNavigation('Home')} className="footer-link-btn">Home</button></li>
                <li><button onClick={() => handleNavigation('About Us')} className="footer-link-btn">About Us</button></li>
                <li><button onClick={() => handleNavigation('Our Impact')} className="footer-link-btn">Our Impact</button></li>
                <li><button onClick={() => handleNavigation('Contact Us')} className="footer-link-btn">Contact Us</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Support</h3>
              <ul>
                <li><button onClick={() => handleNavigation('Contact us')} className="footer-link-btn">Contact us</button></li>
                <li><button onClick={() => handleNavigation('FAQ')} className="footer-link-btn">FAQ</button></li>
                <li><button onClick={() => handleNavigation('Privacy Policy')} className="footer-link-btn">Privacy Policy</button></li>
                <li><button onClick={() => handleNavigation('Terms of Service')} className="footer-link-btn">Terms of Service</button></li>
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

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className="receiver-toast">
          <span className="receiver-toast-icon">{toast.icon}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ReceiverDashboard;