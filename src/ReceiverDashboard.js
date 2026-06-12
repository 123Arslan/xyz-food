import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  if (!type) return 'food-type-cooked';
  switch (type.toLowerCase()) {
    case 'cooked':
    case 'cooked meal':
    case 'cooked food':
      return 'food-type-cooked';
    case 'raw':
    case 'veg':
    case 'non-veg':
    case 'raw ingredients':
      return 'food-type-raw';
    case 'packaged':
    case 'packaged food':
    case 'dry':
    case 'dry rations':
      return 'food-type-packaged';
    case 'baked':
    case 'baked goods':
      return 'food-type-baked';
    default:
      return 'food-type-cooked';
  }
};

const getFoodIcon = (type) => {
  if (!type) return '🍛';
  switch (type.toLowerCase()) {
    case 'cooked':
    case 'cooked meal':
    case 'cooked food':
      return '🍛';
    case 'raw':
    case 'veg':
    case 'non-veg':
    case 'raw ingredients':
      return '🥬';
    case 'packaged':
    case 'packaged food':
    case 'dry':
    case 'dry rations':
      return '📦';
    case 'baked':
    case 'baked goods':
      return '🍞';
    default:
      return '🍽️';
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
  const [foodItems, setFoodItems] = useState([]);
  const [claims, setClaims] = useState(INITIAL_CLAIMS);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('food');

  // Search and Filter States
  const [searchLocation, setSearchLocation] = useState('');
  const [foodType, setFoodType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Coordinates States
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Request browser geolocation on mount, fallback to IP geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
        },
        async (error) => {
          console.warn("Receiver geolocation unavailable, trying IP-based fallback", error);
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
              setUserLatitude(data.latitude);
              setUserLongitude(data.longitude);
            }
          } catch (e) {
            console.warn("IP geolocation fallback failed", e);
          }
        }
      );
    }
  }, []);

  // Fetch food listings from backend
  const fetchAvailableFood = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = {
        location: searchLocation,
        food_type: foodType
      };
      if (userLatitude && userLongitude) {
        params.lat = userLatitude;
        params.lng = userLongitude;
      }
      const response = await axios.get('http://localhost:8000/api/get-food/', { params });
      setFoodItems(response.data);
    } catch (err) {
      console.error('Error fetching food listings:', err);
      setErrorMsg('Failed to load food listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger automatic fetch on filter inputs or coordinates change
  useEffect(() => {
    fetchAvailableFood();
  }, [searchLocation, foodType, userLatitude, userLongitude]);

  // Date formatter helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

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
      name: item.food_title || item.name || 'Food Item',
      donor: item.user?.profile?.full_name || item.user?.username || item.donor || 'Donor',
      status: 'Pending',
      icon: getFoodIcon(item.food_type || item.type),
      rating: 0,
      feedbackSubmitted: false,
    };
    setClaims(prev => [newClaim, ...prev]);
    setToast({ icon: '✅', message: `"${item.food_title || item.name}" claimed successfully!` });
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
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Location Input */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Search Location
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                📍
              </span>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter pickup location or city..."
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Food Type Filter Dropdown */}
          <div className="w-full md:w-64">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Food Type
            </label>
            <div className="relative">
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              >
                <option value="All">All Food Types</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Cooked Food">Cooked Food</option>
                <option value="Dry Rations">Dry Rations</option>
              </select>
            </div>
          </div>

          {/* Search Action Button */}
          <div className="w-full md:w-auto">
            <button
              onClick={fetchAvailableFood}
              className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>🔍</span> Search
            </button>
          </div>
        </div>
      </div>

      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">🍽️</span>
          Available Food Listings
        </h2>
        <span className="receiver-section-subtitle">{foodItems.length} items found</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading food listings...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center my-6">
          {errorMsg}
        </div>
      ) : foodItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {foodItems.map(item => (
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1" key={item.id}>
              {/* Image Header with Badge */}
              <div className="relative h-48 w-full bg-gray-50 overflow-hidden border-b border-gray-100">
                {item.food_image_url ? (
                  <img
                    src={item.food_image_url}
                    alt={item.food_title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"; // fallback
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <span className="text-4xl mb-2">🍛</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70">No Image</span>
                  </div>
                )}
                {/* Food Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                    item.food_type === 'Veg' ? 'bg-green-100 text-green-800' :
                    item.food_type === 'Non-Veg' ? 'bg-red-100 text-red-800' :
                    item.food_type === 'Cooked' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.food_type === 'Cooked' ? 'Cooked Food' : item.food_type === 'Dry' ? 'Dry Rations' : item.food_type}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{item.food_title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description || "No description provided."}</p>
                  
                  {/* Qty & Contact */}
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</span>
                      <span className="text-sm font-bold text-gray-700">📦 {item.quantity}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone</span>
                      <span className="text-sm font-bold text-gray-700">📞 {item.contact_phone}</span>
                    </div>
                  </div>

                  {/* Pickup Location */}
                  <div className="mb-4">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup Location</span>
                    <p className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="mt-0.5">📍</span>
                      <span className="line-clamp-2">{item.pickup_location}</span>
                    </p>
                  </div>
                </div>

                {/* Card Footer: Times & Claim Button */}
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex flex-col gap-1.5 mb-4 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Pickup Time:</span>
                      <span className="font-semibold text-gray-700">{formatDate(item.pickup_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry Time:</span>
                      <span className="font-semibold text-red-600">{formatDate(item.expiry_time)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaim(item.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow text-center flex items-center justify-center gap-2"
                  >
                    Claim Food
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-2xl text-center p-8">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No available food listings found</h3>
          <p className="text-gray-500 max-w-sm">No available food listings found at the moment.</p>
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