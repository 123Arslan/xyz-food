import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import { apiRequest, completeTransaction } from '../api';
import './RiderDashboard.css';

// ─── Constants ──────────────────────────────────────────────
// Keyed by the FoodListing.status values returned by the backend.
const RIDER_STATUS_BADGES = {
  'Claimed': { class: 'rider-status-pending', label: 'Pending Pickup', icon: '📦' },
  'Out for Delivery': { class: 'rider-status-onway', label: 'On the Way', icon: '🏍️' },
  'Completed': { class: 'rider-status-delivered', label: 'Delivered', icon: '🎉' },
};

const formatRiderDistance = (distanceKm) => {
  if (typeof distanceKm !== 'number') return 'N/A';
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
};

// ─── Helper Functions ──────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
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

// ═══════════════════════════════════════════════════════════
// ─── RIDER DASHBOARD ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════
const RiderDashboard = () => {
  const { user, token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  // Rider's current coordinates, used to restrict deliveries to a 30km radius
  const [riderLatitude, setRiderLatitude] = useState(null);
  const [riderLongitude, setRiderLongitude] = useState(null);

  // Global Metrics
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [impactScore, setImpactScore] = useState(0);

  // ─── Effects ─────────────────────────────────────────────
  // Request the rider's current location on mount, with an IP-based fallback
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRiderLatitude(position.coords.latitude);
          setRiderLongitude(position.coords.longitude);
        },
        async (error) => {
          console.warn('Rider geolocation unavailable, trying IP-based fallback', error);
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
              setRiderLatitude(data.latitude);
              setRiderLongitude(data.longitude);
            }
          } catch (e) {
            console.warn('IP geolocation fallback failed', e);
          }
        }
      );
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableDeliveries();
    } else {
      fetchMyDeliveries();
    }
  }, [activeTab, riderLatitude, riderLongitude]);

  // ─── API Calls ───────────────────────────────────────────
  const fetchAvailableDeliveries = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const params = {};
    if (riderLatitude != null && riderLongitude != null) {
      params.lat = riderLatitude;
      params.lng = riderLongitude;
    }
    const response = await apiRequest('/rider/available-deliveries/', { params });
    if (response.success) {
      setDeliveries(response.data);
    } else {
      console.error('Error fetching deliveries:', response.error);
      setErrorMsg(response.errorMessage || 'Failed to load available deliveries. Please try again later.');
    }
    setIsLoading(false);
  };

  const fetchMyDeliveries = async () => {
    const response = await apiRequest('/rider/my-deliveries/');
    if (response.success) {
      setMyDeliveries(response.data);
    } else {
      console.error('Error fetching my deliveries:', response.error);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────
  const handleAcceptDelivery = async (deliveryId) => {
    setAcceptingId(deliveryId);
    const response = await apiRequest(`/rider/accept-delivery/${deliveryId}/`, { method: 'POST', body: {} });
    if (response.success) {
      toast.success('🏍️ Delivery accepted! You are now assigned to this delivery.', {
        icon: '✅',
      });
      toast.success('📦 Donor and receiver have been notified!', {
        icon: '🔔',
      });
      await Promise.all([fetchAvailableDeliveries(), fetchMyDeliveries()]);
    } else {
      toast.error(response.errorMessage || response.error?.error || 'Failed to accept delivery.');
    }
    setAcceptingId(null);
  };

  const handleMarkDelivered = async (deliveryId) => {
    const response = await completeTransaction(deliveryId);
    if (response.success) {
      setTotalDeliveries(prev => prev + 1);
      setImpactScore(prev => prev + 50);
      toast.success('🎉 Delivery completed successfully! +50 XP awarded!', {
        icon: '🎉',
      });
      await fetchMyDeliveries();
    } else {
      toast.error(response.errorMessage || response.error?.error || 'Failed to mark as delivered.');
    }
  };

  const handleCallDonor = (phone) => {
    toast.success(`📞 Calling donor at ${phone}`, {
      icon: '📞',
    });
  };

  const handleCallReceiver = (phone) => {
    toast.success(`📱 Calling receiver at ${phone}`, {
      icon: '📱',
    });
  };

  const handleOpenMaps = (pickupLocation, dropoffLocation) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(dropoffLocation)}`;
    window.open(mapsUrl, '_blank');
    toast.success('📍 Opening Google Maps navigation...', {
      icon: '🗺️',
    });
  };

  // ─── Render Functions ────────────────────────────────────
  const renderDeliveryCard = (item, isMyDelivery = false) => {
    const statusBadge = RIDER_STATUS_BADGES[item.status] || RIDER_STATUS_BADGES['Claimed'];
    const foodIcon = getFoodIcon(item.food_type);
    const dropoffLocation = item.dropoff_location || item.pickup_location;

    return (
      <div className="rider-delivery-card" key={item.id}>
        <div className="rider-card-header">
          <div className="rider-card-icon">{foodIcon}</div>
          <div className="rider-card-title-section">
            <h3 className="rider-card-title">{item.food_title}</h3>
            <p className="rider-card-donor">{item.donor_name}</p>
            <span className={`rider-status-badge ${statusBadge.class}`}>
              {statusBadge.icon} {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="rider-card-body">
          <div className="rider-detail-row">
            <span className="rider-detail-label">Food Items</span>
            <span className="rider-detail-value">🍽️ {item.quantity}</span>
          </div>

          <div className="rider-location-section">
            <div className="rider-location-block">
              <div className="rider-location-header">
                <span className="rider-location-icon">📍</span>
                <span className="rider-location-label">Pickup (Donor)</span>
              </div>
              <p className="rider-location-text">{item.pickup_location}</p>
            </div>

            <div className="rider-location-divider">
              <span className="rider-divider-icon">⬇️</span>
            </div>

            <div className="rider-location-block">
              <div className="rider-location-header">
                <span className="rider-location-icon">🏠</span>
                <span className="rider-location-label">Drop-off (Receiver)</span>
              </div>
              <p className="rider-location-text">{dropoffLocation}</p>
            </div>
          </div>

          <div className="rider-time-section">
            <div className="rider-time-item">
              <span className="rider-time-label">Distance</span>
              <span className="rider-time-value">{formatRiderDistance(item.distance)}</span>
            </div>
            <div className="rider-time-item">
              <span className="rider-time-label">Expiry</span>
              <span className="expiry-badge">⏰ {formatDate(item.expiry_time)}</span>
            </div>
          </div>
        </div>

        <div className="rider-card-footer">
          {!isMyDelivery ? (
            <button
              onClick={() => handleAcceptDelivery(item.id)}
              disabled={acceptingId === item.id}
              className="rider-accept-btn"
            >
              {acceptingId === item.id ? '⏳ Accepting...' : '🏍️ Accept Delivery'}
            </button>
          ) : (
            <div className="rider-action-buttons">
              {item.status !== 'Completed' && (
                <button
                  onClick={() => handleMarkDelivered(item.id)}
                  className="rider-action-btn rider-btn-delivered"
                >
                  ✅ Mark as Delivered
                </button>
              )}

              {/* Communication Buttons */}
              <div className="rider-comm-buttons">
                <button
                  onClick={() => handleCallDonor(item.donor_phone)}
                  className="rider-comm-btn rider-call-donor"
                >
                  📞 Call Donor
                </button>
                <button
                  onClick={() => handleCallReceiver(item.receiver_phone)}
                  className="rider-comm-btn rider-call-receiver"
                >
                  📱 Call Receiver
                </button>
                <button
                  onClick={() => handleOpenMaps(item.pickup_location, dropoffLocation)}
                  className="rider-comm-btn rider-maps-btn"
                >
                  📍 Open Maps
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAvailableDeliveries = () => (
    <div className="rider-section">
      <div className="rider-section-header">
        <h2 className="rider-section-title">
          <span className="rider-section-icon">📦</span>
          Available Deliveries Nearby
        </h2>
        <span className="rider-section-subtitle">{deliveries.length} deliveries available</span>
      </div>

      {isLoading ? (
        <div className="rider-loading-state">
          <div className="rider-loading-spinner"></div>
          <p>Loading deliveries...</p>
        </div>
      ) : errorMsg ? (
        <div className="rider-error-state">{errorMsg}</div>
      ) : deliveries.length > 0 ? (
        <div className="rider-deliveries-grid">
          {deliveries.map(item => renderDeliveryCard(item, false))}
        </div>
      ) : (
        <div className="rider-empty-state">
          <div className="rider-empty-icon">📦</div>
          <h3 className="rider-empty-title">No available deliveries</h3>
          <p className="rider-empty-text">Check back later for new delivery opportunities.</p>
        </div>
      )}
    </div>
  );

  const renderMyDeliveries = () => (
    <div className="rider-section">
      <div className="rider-section-header">
        <h2 className="rider-section-title">
          <span className="rider-section-icon">🏍️</span>
          My Active Deliveries
        </h2>
        <span className="rider-section-subtitle">{myDeliveries.length} active deliveries</span>
      </div>

      {myDeliveries.length > 0 ? (
        <div className="rider-deliveries-grid">
          {myDeliveries.map(item => renderDeliveryCard(item, true))}
        </div>
      ) : (
        <div className="rider-empty-state">
          <div className="rider-empty-icon">🏍️</div>
          <h3 className="rider-empty-title">No active deliveries</h3>
          <p className="rider-empty-text">Accept a delivery from the available list to get started.</p>
        </div>
      )}
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────
  return (
    <div className="rider-dashboard-page">
      <div className="rider-container">
        {/* Header */}
        <div className="rider-header">
          <div className="rider-header-content">
            <h1 className="rider-header-title">🏍️ Rider Dashboard</h1>
            <p className="rider-header-subtitle">Volunteer Delivery Network</p>
          </div>
          
          {/* Global Metrics */}
          <div className="rider-metrics">
            <div className="rider-metric-badge">
              <span className="metric-icon">📦</span>
              <span className="metric-label">Total Deliveries:</span>
              <span className="metric-value">{totalDeliveries}</span>
            </div>
            <div className="rider-metric-badge">
              <span className="metric-icon">⭐</span>
              <span className="metric-label">Volunteer Impact:</span>
              <span className="metric-value">+{impactScore} XP</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rider-tab-nav">
          <button
            className={`rider-tab-btn ${activeTab === 'available' ? 'rider-tab-active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            📦 Available Deliveries
          </button>
          <button
            className={`rider-tab-btn ${activeTab === 'my' ? 'rider-tab-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            🏍️ My Deliveries
          </button>
        </div>

        {/* Content */}
        <div className="rider-content">
          {activeTab === 'available' ? renderAvailableDeliveries() : renderMyDeliveries()}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
