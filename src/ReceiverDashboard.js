import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import './ReceiverDashboard.css';
import './Home.css';
import { claimFood, completeTransaction, getMyClaims, getAvailableFood, postFeedback, resolveMediaUrl } from './api';
import ChatWindow from './components/ChatWindow';

// ─── Constants ──────────────────────────────────────────────
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

const resolveFoodImageSrc = (item) => {
  if (!item) return DEFAULT_FOOD_IMAGE;
  const raw = item.food_image || item.food_image_url || item.image || item.image_url || item.foodImage;
  return resolveMediaUrl(raw) || DEFAULT_FOOD_IMAGE;
};

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

// ─── Mock Location Coordinates ───────────────────────────────
const LOCATION_COORDINATES = {
  'Lahore': { lat: 31.5204, lng: 74.3587 },
  'Karachi': { lat: 24.8607, lng: 67.0011 },
  'Islamabad': { lat: 33.6844, lng: 73.0479 },
  'Rawalpindi': { lat: 33.5651, lng: 73.0169 },
  'Faisalabad': { lat: 31.4504, lng: 73.1350 },
  'Multan': { lat: 30.1575, lng: 71.5249 },
  'Daska': { lat: 32.3236, lng: 74.3523 },
  'Downtown Central Park': { lat: 31.5204, lng: 74.3587 },
  'default': { lat: 31.5204, lng: 74.3587 },
};

// ─── Custom Marker Icons ─────────────────────────────────────
const donorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const receiverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ─── Helper Functions ──────────────────────────────────────
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

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

// ─── Expiry Calculation Helper Functions ─────────────────────
const getExpiryThresholdHours = (foodType) => {
  if (!foodType) return 24; // Default: 24 hours
  const type = foodType.toLowerCase();
  if (type.includes('cooked') || type.includes('meal')) {
    return 12; // Cooked Food: 12 hours
  } else if (type.includes('veg') || type.includes('fruit') || type.includes('vegetable')) {
    return 48; // Veggies/Fruits: 48 hours
  } else {
    return 24; // Default/Others: 24 hours
  }
};

const calculateExpiryInfo = (item) => {
  const cookedTime = item.pickup_time || item.created_at;
  if (!cookedTime) {
    return { isExpiringSoon: false, hoursRemaining: null, freshnessStatus: 'Unknown' };
  }

  const cookedDate = new Date(cookedTime);
  const now = new Date();
  const thresholdHours = getExpiryThresholdHours(item.food_type);
  const expiryDate = new Date(cookedDate.getTime() + thresholdHours * 60 * 60 * 1000);
  const hoursRemaining = (expiryDate - now) / (1000 * 60 * 60);
  const isExpiringSoon = hoursRemaining > 0 && hoursRemaining < 2; // Less than 2 hours

  let freshnessStatus = 'Fresh';
  if (hoursRemaining <= 0) {
    freshnessStatus = 'Expired';
  } else if (hoursRemaining < 2) {
    freshnessStatus = 'Critical';
  } else if (hoursRemaining < 6) {
    freshnessStatus = 'Warning';
  } else if (hoursRemaining < 12) {
    freshnessStatus = 'Good';
  }

  return { isExpiringSoon, hoursRemaining, freshnessStatus, expiryDate };
};

// ─── Distance Calculation Helper ─────────────────────────────
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const getCoordinatesFromLocation = (locationText) => {
  if (!locationText) return LOCATION_COORDINATES.default;
  
  const locationLower = locationText.toLowerCase();
  for (const [city, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (locationLower.includes(city.toLowerCase())) {
      return coords;
    }
  }
  return LOCATION_COORDINATES.default;
};

const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
};

const estimateTravelTime = (distanceKm) => {
  const avgSpeed = 30; // km/h average speed in city
  const timeHours = distanceKm / avgSpeed;
  const timeMinutes = Math.round(timeHours * 60);
  if (timeMinutes < 60) {
    return `${timeMinutes} mins`;
  }
  const hours = Math.floor(timeMinutes / 60);
  const mins = timeMinutes % 60;
  return `${hours}h ${mins}m`;
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

// ═══════════════════════════════════════════════════════════
// ─── RECEIVER DASHBOARD ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════
const ReceiverDashboard = () => {
  // ─── State ──────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('receiverCity') || 'Lahore';
  });
  const [foodItems, setFoodItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('food');
  const [claimingId, setClaimingId] = useState(null);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Feedback states
  const [feedbackFoodId, setFeedbackFoodId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Search and Filter States
  const [searchLocation, setSearchLocation] = useState('');
  const [foodType, setFoodType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Coordinates States
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);

  // Map View State
  const [expandedMapItem, setExpandedMapItem] = useState(null);

  // Profile Settings State
  const [profileForm, setProfileForm] = useState({
    fullName: 'Ahmed Khan',
    city: 'Lahore',
    phone: '',
    avatarUrl: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // ─── Profile Settings Handler ─────────────────────────────
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    // Simulate API call
    setTimeout(() => {
      setSavingProfile(false);
      toast.success('Profile updated successfully!');
      // Update selected city if changed
      if (profileForm.city !== selectedCity) {
        setSelectedCity(profileForm.city);
      }
    }, 1000);
  };

  // ─── Effects ─────────────────────────────────────────────
  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Save city to localStorage
  useEffect(() => {
    localStorage.setItem('receiverCity', selectedCity);
  }, [selectedCity]);

  // Request browser geolocation on mount
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

  // Fetch data on filter changes
  useEffect(() => {
    fetchAvailableFood();
  }, [searchLocation, foodType, userLatitude, userLongitude]);

  useEffect(() => {
    if (activeTab === 'claims') {
      fetchMyClaims();
    } else if (activeTab === 'food') {
      fetchAvailableFood();
    }
  }, [activeTab]);

  // ─── API Calls ───────────────────────────────────────────
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
      const response = await getAvailableFood(params);
      if (response.success) {
        setFoodItems(response.data);
      } else {
        setErrorMsg(response.errorMessage || 'Failed to load food listings. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching food listings:', err);
      setErrorMsg(err?.message || 'Failed to load food listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyClaims = async () => {
    setLoadingClaims(true);
    try {
      const response = await getMyClaims();
      if (response.success) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = user.id;

        const mappedClaims = response.data
          .filter(donation => {
            const listing = donation.food_listing || {};
            // Keep claims that have a valid claim status (Pending, Claimed, Picked Up, Completed, Ready for Pickup, Out for Delivery)
            const validStatus = ['Pending', 'Claimed', 'Picked Up', 'Completed', 'Ready for Pickup', 'Out for Delivery'].includes(listing.status);
            
            // Check association with current user ID
            const receiverUser = donation.receiver || {};
            const isAssocWithUser = !currentUserId || !receiverUser.id || receiverUser.id === currentUserId;

            return validStatus && isAssocWithUser;
          })
          .map(donation => {
            const listing = donation.food_listing || {};
            const donorUser = donation.donor || {};
            const donorProfile = donorUser.profile || {};
            return {
              id: donation.id,
              foodId: listing.id,
              name: listing.food_title || 'Food Item',
              donor: donorProfile.full_name || donorUser.username || 'Donor',
              donorId: donorUser.id,
              donorPhone: donorProfile.contact_phone || listing.contact_phone || 'N/A',
              donorInstructions: donorProfile.instructions || listing.description || 'No instructions provided.',
              status: listing.status || 'Pending',
              icon: getFoodIcon(listing.food_type),
              rating: 0,
              feedbackSubmitted: false,
              foodImage: resolveFoodImageSrc(listing),
            };
          });
        setClaims(mappedClaims);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────
  const mealsAvailable = foodItems.reduce((sum, item) => {
    const num = parseInt(item.quantity) || 1;
    return sum + num;
  }, 0);
  const mealsClaimed = claims.filter(c => c.status !== 'Completed').length;
  const mealsFed = claims.filter(c => c.status === 'Completed').length;

  // ─── Process Food Items with Expiry Info & Sorting ───────────
  const processedFoodItems = useMemo(() => {
    const unclaimed = foodItems.filter(item => item.status === 'Available');
    const itemsWithExpiry = unclaimed.map(item => {
      const donorCoords = (item.latitude != null && item.longitude != null)
        ? { lat: item.latitude, lng: item.longitude }
        : getCoordinatesFromLocation(item.pickup_location);
      const userCoords = userLatitude && userLongitude
        ? { lat: userLatitude, lng: userLongitude }
        : LOCATION_COORDINATES[selectedCity] || LOCATION_COORDINATES.default;

      // Prefer the exact distance computed by the backend (Haversine, at the
      // DB layer, from the receiver's real coordinates). Fall back to a
      // client-side estimate only when the API didn't return one (e.g. no
      // geolocation available yet).
      const distance = typeof item.distance === 'number'
        ? item.distance
        : calculateDistance(userCoords.lat, userCoords.lng, donorCoords.lat, donorCoords.lng);

      return {
        ...item,
        expiryInfo: calculateExpiryInfo(item),
        distanceInfo: {
          distanceKm: distance,
          distanceText: formatDistance(distance),
          travelTime: estimateTravelTime(distance),
          donorCoords,
          userCoords,
        },
      };
    });

    // Sort: Critical expiring items first, then by freshness status
    return itemsWithExpiry.sort((a, b) => {
      // If one is expiring soon and the other isn't, expiring comes first
      if (a.expiryInfo.isExpiringSoon && !b.expiryInfo.isExpiringSoon) return -1;
      if (!a.expiryInfo.isExpiringSoon && b.expiryInfo.isExpiringSoon) return 1;

      // Then sort by hours remaining (ascending)
      if (a.expiryInfo.hoursRemaining !== null && b.expiryInfo.hoursRemaining !== null) {
        return a.expiryInfo.hoursRemaining - b.expiryInfo.hoursRemaining;
      }

      return 0;
    });
  }, [foodItems, userLatitude, userLongitude, selectedCity]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleClaim = async (foodId) => {
    setClaimingId(foodId);
    try {
      const item = foodItems.find(f => f.id === foodId);
      if (!item) {
        setToast({ icon: '❌', message: 'Food item not found.' });
        return;
      }

      const response = await claimFood(foodId);
      if (response.success) {
        setToast({ icon: '✅', message: `"${item.food_title || item.name}" claimed successfully!` });
        // Hook Type 2: Donor Alert - Simulate notification to donor
        toast.success('✅ Your food listing has been claimed!', {
          icon: '🔔',
        });
        await fetchAvailableFood();
        await fetchMyClaims();
        setActiveTab('claims');
      } else {
        const errMsg = response.errorMessage || response.error?.error || response.error?.detail || 'Failed to claim food.';
        setToast({ icon: '❌', message: errMsg });
      }
    } catch (err) {
      setToast({ icon: '❌', message: 'An error occurred while claiming.' });
    } finally {
      setClaimingId(null);
    }
  };

  const handleCompleteTransaction = async (foodId) => {
    try {
      const response = await completeTransaction(foodId);
      if (response.success) {
        setToast({ icon: '✅', message: 'Transaction marked as completed!' });
        await fetchMyClaims();
        // Open the feedback modal
        setFeedbackFoodId(foodId);
        setFeedbackRating(0);
        setFeedbackComment('');
        setShowFeedbackSuccess(false);
      } else {
        const errMsg = response.errorMessage || response.error?.error || response.error?.detail || 'Failed to complete transaction.';
        setToast({ icon: '❌', message: errMsg });
      }
    } catch (err) {
      setToast({ icon: '❌', message: 'An error occurred.' });
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) {
      alert("Rating is mandatory. Please select 1-5 stars.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const response = await postFeedback({
        rating: feedbackRating,
        comment: feedbackComment,
        food_id: feedbackFoodId,
      });

      if (!response.success) {
        alert(
          response.errorMessage ||
            response.error?.error ||
            response.error?.rating?.[0] ||
            'Failed to submit feedback. Please try again.'
        );
        return;
      }

      setShowFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackFoodId(null);
        setShowFeedbackSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePickup = (claimId) => {
    setClaims(prev =>
      prev.map(c =>
        c.id === claimId ? { ...c, status: 'Picked Up' } : c
      )
    );
    setToast({ icon: '📦', message: 'Marked as picked up! Please leave your feedback.' });
  };

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

  const handleNavigation = (section) => {
    setToast({ icon: '🔗', message: `Navigating to ${section}...` });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'claim-status-pending';
      case 'Ready for Pickup': return 'claim-status-ready';
      case 'Picked Up': return 'claim-status-pickedup';
      case 'Completed': return 'claim-status-completed';
      default: return '';
    }
  };

  // ─── Render Functions ────────────────────────────────────
  const renderFoodList = () => (
    <div className="receiver-section">
      {/* Search and Filter Section */}
      <div className="search-filter-card">
        <div className="search-filter-inner">
          <div className="search-filter-field">
            <label className="search-filter-label">📍 Search Location</label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Enter pickup location or city..."
              className="search-filter-input"
            />
          </div>

          <div className="search-filter-field">
            <label className="search-filter-label">🍽️ Food Type</label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="search-filter-select"
            >
              <option value="All">All Food Types</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Cooked Food">Cooked Food</option>
              <option value="Dry Rations">Dry Rations</option>
            </select>
          </div>

          <button onClick={fetchAvailableFood} className="search-filter-btn">
            🔍 Search
          </button>
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
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading food listings...</p>
        </div>
      ) : errorMsg ? (
        <div className="error-state">{errorMsg}</div>
      ) : foodItems.length > 0 ? (
        <div className="receiver-food-grid">
          {processedFoodItems.map(item => (
            <div 
              className={`food-item-card ${item.expiryInfo.isExpiringSoon && item.status === 'Available' ? 'critical-expiry-border' : ''}`} 
              key={item.id}
            >
              <div className="food-item-image-wrapper">
                {item.expiryInfo.isExpiringSoon && item.status === 'Available' && (
                  <div className="critical-expiry-badge">⚠️ EXPIRING SOON!</div>
                )}
                <img
                  src={resolveFoodImageSrc(item)}
                  alt={item.food_title}
                  className="food-item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_FOOD_IMAGE;
                  }}
                />
                <span className={`food-item-badge ${
                  item.food_type === 'Veg' ? 'badge-veg' :
                  item.food_type === 'Non-Veg' ? 'badge-nonveg' :
                  item.food_type === 'Cooked' ? 'badge-cooked' :
                  'badge-other'
                }`}>
                  {item.food_type === 'Cooked' ? 'Cooked Food' : 
                   item.food_type === 'Dry' ? 'Dry Rations' : 
                   item.food_type || 'Food'}
                </span>
              </div>

              <div className="food-item-content">
                <h3 className="food-item-title">{item.food_title}</h3>
                <p className="food-item-description">{item.description || "No description provided."}</p>
                
                <div className="food-item-details">
                  <div className="food-item-detail">
                    <span className="food-item-detail-label">Quantity</span>
                    <span className="food-item-detail-value">📦 {item.quantity}</span>
                  </div>
                  <div className="food-item-detail">
                    <span className="food-item-detail-label">Contact</span>
                    <span className="food-item-detail-value">📞 {item.contact_phone}</span>
                  </div>
                </div>

                <div className="food-item-location">
                  <span className="food-item-location-label">Pickup Location</span>
                  <p className="food-item-location-text">📍 {item.pickup_location}</p>
                  {item.distanceInfo && (
                    <div className="distance-badge">
                      📍 {item.distanceInfo.distanceText} | Est. travel: {item.distanceInfo.travelTime}
                    </div>
                  )}
                </div>

                <div className="food-item-times">
                  <div className="food-item-time">
                    <span>Pickup:</span>
                    <span className="food-item-time-value">{formatDate(item.pickup_time)}</span>
                  </div>
                  <div className="food-item-time">
                    <span>Expiry:</span>
                    <span className="food-item-time-expiry">{formatDate(item.expiry_time)}</span>
                  </div>
                </div>
              </div>

              <div className="food-item-footer">
                <button
                  onClick={() => setExpandedMapItem(expandedMapItem === item.id ? null : item.id)}
                  className="food-item-map-btn"
                >
                  {expandedMapItem === item.id ? '🗺️ Hide Map' : '🗺️ View Route'}
                </button>
                <button
                  onClick={() => handleClaim(item.id)}
                  disabled={claimingId === item.id}
                  className="food-item-claim-btn"
                >
                  {claimingId === item.id ? '⏳ Claiming...' : '🍽️ Claim Food'}
                </button>
              </div>

              {expandedMapItem === item.id && item.distanceInfo && (
                <div className="food-item-map-container">
                  <MapContainer
                    center={[
                      (item.distanceInfo.userCoords.lat + item.distanceInfo.donorCoords.lat) / 2,
                      (item.distanceInfo.userCoords.lng + item.distanceInfo.donorCoords.lng) / 2
                    ]}
                    zoom={12}
                    style={{ height: '300px', width: '100%', borderRadius: '12px' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[item.distanceInfo.userCoords.lat, item.distanceInfo.userCoords.lng]} icon={receiverIcon}>
                      <Popup>Your Location</Popup>
                    </Marker>
                    <Marker position={[item.distanceInfo.donorCoords.lat, item.distanceInfo.donorCoords.lng]} icon={donorIcon}>
                      <Popup>Donor Pickup Location</Popup>
                    </Marker>
                    <Polyline
                      positions={[
                        [item.distanceInfo.userCoords.lat, item.distanceInfo.userCoords.lng],
                        [item.distanceInfo.donorCoords.lat, item.distanceInfo.donorCoords.lng]
                      ]}
                      color="#059669"
                      weight={4}
                      opacity={0.7}
                    />
                  </MapContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-title">No available food listings found</h3>
          <p className="empty-state-text">Try adjusting your search filters or check back later.</p>
        </div>
      )}
    </div>
  );

  const renderMyClaims = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">📋</span>
          My Claims
        </h2>
        <span className="receiver-section-subtitle">{claims.length} total</span>
      </div>

      {loadingClaims ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your claims...</p>
        </div>
      ) : claims.length > 0 ? (
        <div className="my-claims-grid">
          {claims.map(claim => (
            <div key={claim.id} className={`claim-card ${claim.status === 'Completed' ? 'completed' : ''}`}>
              {/* Food Image Header */}
              <div className="claim-image-header">
                <img 
                  src={claim.foodImage || DEFAULT_FOOD_IMAGE} 
                  alt={claim.name}
                  className="claim-food-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_FOOD_IMAGE;
                  }}
                />
                <span className={`claim-status-badge ${getStatusClass(claim.status)}`}>
                  {claim.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="claim-card-body">
                {/* Title & Donor Info */}
                <div className="claim-header-info">
                  <h4 className="claim-title">{claim.name}</h4>
                  <p className="claim-donor">Donor: {claim.donor}</p>
                </div>

                {/* Coordination Metadata */}
                {claim.status === 'Pending' && (
                  <div className="claim-coordination">
                    <div className="coordination-item">
                      <span className="coordination-icon">📞</span>
                      <div className="coordination-content">
                        <span className="coordination-label">Contact</span>
                        <span className="coordination-value">{claim.donorPhone}</span>
                      </div>
                    </div>
                    <div className="coordination-item">
                      <span className="coordination-icon">📝</span>
                      <div className="coordination-content">
                        <span className="coordination-label">Instructions</span>
                        <span className="coordination-value">{claim.donorInstructions}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                {claim.status === 'Picked Up' && !claim.feedbackSubmitted && (
                  <div className="claim-feedback-section">
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

                {claim.feedbackSubmitted && (
                  <div className="feedback-submitted">
                    <span className="feedback-icon">✅</span>
                    <span className="feedback-text">Feedback submitted — {claim.rating}/5 stars</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="claim-actions">
                  {claim.status === 'Pending' && claim.donorId && (
                    <div className="action-buttons-row">
                      <button
                        className="claim-btn claim-btn-chat"
                        onClick={() => setChatTarget({
                          listingId: claim.foodId,
                          receiverId: claim.donorId,
                          otherUserName: claim.donor,
                          listingTitle: claim.name,
                        })}
                      >
                        💬 Chat Now
                      </button>
                      <button
                        className="claim-btn claim-btn-message"
                        onClick={() => setChatTarget({
                          listingId: claim.foodId,
                          receiverId: claim.donorId,
                          otherUserName: claim.donor,
                          listingTitle: claim.name,
                        })}
                      >
                        ✉️ Message
                      </button>
                    </div>
                  )}

                  {claim.status === 'Pending' && (
                    <div className="action-buttons-row">
                      <button
                        className="claim-btn claim-btn-complete"
                        onClick={() => handleCompleteTransaction(claim.foodId)}
                      >
                        ✅ Mark Completed
                      </button>
                    </div>
                  )}

                  {(claim.status === 'Pending' || claim.status === 'Ready for Pickup') && (
                    <div className="action-buttons-row">
                      <button
                        className="claim-btn claim-btn-pickup"
                        onClick={() => handlePickup(claim.id)}
                      >
                        📦 Picked Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 className="empty-state-title">No claims yet</h3>
          <p className="empty-state-text">Browse available food and claim what you need.</p>
        </div>
      )}
    </div>
  );

  const renderProfileSettings = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">⚙️</span>
          Profile Settings
        </h2>
      </div>

      <div className="profile-settings-container">
        <form onSubmit={handleSaveProfile} className="profile-settings-form">
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <span className="avatar-initials">{profileForm.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="profile-avatar-upload">
              <label htmlFor="avatarUrl" className="avatar-upload-label">
                <span className="upload-icon">📷</span>
                Update Avatar
              </label>
              <input
                type="url"
                id="avatarUrl"
                name="avatarUrl"
                value={profileForm.avatarUrl}
                onChange={handleProfileChange}
                placeholder="Enter image URL"
                className="avatar-url-input"
              />
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label htmlFor="fullName" className="profile-form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                className="profile-form-input"
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="city" className="profile-form-label">City</label>
              <select
                id="city"
                name="city"
                value={profileForm.city}
                onChange={handleProfileChange}
                className="profile-form-select"
                required
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="profile-form-group">
              <label htmlFor="phone" className="profile-form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="Enter your phone number"
                className="profile-form-input"
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              type="submit"
              disabled={savingProfile}
              className="profile-save-btn"
            >
              {savingProfile ? (
                <>
                  <span className="btn-spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="receiver-section">
      <div className="receiver-section-header">
        <h2 className="receiver-section-title">
          <span className="section-icon">🤝</span>
          Need Help?
        </h2>
      </div>

      <div className="help-grid">
        <div className="help-card help-card-mosque">
          <div className="help-card-icon">🕌</div>
          <h3 className="help-card-title">Nearest Mosque</h3>
          <p className="help-card-text">
            Badshahi Mosque, Walled City,<br />
            {selectedCity}
          </p>
          <button className="help-card-btn help-btn-mosque">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
            </svg>
            Get Directions
          </button>
        </div>

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Call Now
          </button>
        </div>

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Request Volunteer
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────
  return (
    <div className="receiver-dashboard-page">
      {/* ─── Hero Header ─── */}
      <div className="receiver-hero">
        <div className="receiver-hero-inner">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="rh-bell-dot"></span>
            </button>
          </div>

          <div className="rh-city-row">
            <span className="rh-city-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
              </svg>
              Your City
            </span>
            <select
              className="rh-city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="rh-tabs-row">
            <nav className="rh-tabs">
              {[
                { key: 'food', label: 'Available Food' },
                { key: 'claims', label: 'My Claims' },
                { key: 'profile', label: 'Profile Settings' },
                { key: 'help', label: 'Help & Support' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rh-tab ${activeTab === tab.key ? 'rh-tab-active' : ''}`}
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

        {activeTab === 'food' && renderFoodList()}
        {activeTab === 'claims' && renderMyClaims()}
        {activeTab === 'profile' && renderProfileSettings()}
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

      {/* ─── Feedback Modal ─── */}
      {feedbackFoodId !== null && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            {showFeedbackSuccess ? (
              <div className="feedback-success">
                <div className="feedback-success-icon">✨</div>
                <h3>Thank you!</h3>
                <p>Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                <div className="feedback-form-header">
                  <h3>Share Your Experience</h3>
                  <button
                    type="button"
                    onClick={() => setFeedbackFoodId(null)}
                    className="feedback-close-btn"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="feedback-form-text">
                  Please rate this food donation. Your feedback helps build trust in our community.
                </p>
                
                <div className="feedback-rating-section">
                  <label className="feedback-rating-label">Rating *</label>
                  <div className="feedback-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`feedback-star ${star <= feedbackRating ? 'feedback-star-filled' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="feedback-comment-section">
                  <label className="feedback-comment-label">Comment</label>
                  <textarea
                    rows="3"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Write a brief comment about the food quality, quantity, packaging..."
                    className="feedback-comment-input"
                  />
                </div>
                
                <div className="feedback-form-actions">
                  <button
                    type="button"
                    onClick={() => setFeedbackFoodId(null)}
                    className="feedback-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="feedback-submit-btn"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className="receiver-toast">
          <span className="receiver-toast-icon">{toast.icon}</span>
          {toast.message}
        </div>
      )}

      {/* ─── Chat Window ─── */}
      {chatTarget && (
        <ChatWindow
          listingId={chatTarget.listingId}
          receiverId={chatTarget.receiverId}
          otherUserName={chatTarget.otherUserName}
          listingTitle={chatTarget.listingTitle}
          onClose={() => setChatTarget(null)}
        />
      )}
    </div>
  );
};

export default ReceiverDashboard;