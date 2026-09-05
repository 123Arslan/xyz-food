import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import { apiRequest } from '../api';
import './RiderDashboard.css';

// ─── Constants ──────────────────────────────────────────────
const RIDER_STATUS_BADGES = {
  'Pending': { class: 'rider-status-pending', label: 'Pending Pickup', icon: '📦' },
  'Accepted': { class: 'rider-status-accepted', label: 'Accepted', icon: '✅' },
  'On the Way': { class: 'rider-status-onway', label: 'On the Way', icon: '🏍️' },
  'Delivered': { class: 'rider-status-delivered', label: 'Delivered', icon: '🎉' },
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
  
  // Global Metrics
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [impactScore, setImpactScore] = useState(0);

  // ─── Effects ─────────────────────────────────────────────
  useEffect(() => {
    // Initialize with simulation data
    initializeSimulationData();
  }, []);

  // ─── Simulation Data Initialization ───────────────────────
  const initializeSimulationData = () => {
    const simulatedDeliveries = [
      {
        id: 'del-001',
        donorName: 'PC Hotel Sialkot',
        pickupLocation: 'PC Hotel Sialkot, Main Boulevard, Sialkot',
        dropoffLocation: 'Al-Shifa Shelter Home, Civil Lines, Sialkot',
        distance: '2.4 km',
        foodItems: 'Chicken Biryani - 40 Packs',
        status: 'Available',
        expiryTime: 'Expires in 45 mins',
        food_type: 'cooked meal',
        food_title: 'Chicken Biryani',
        quantity: '40 packs',
        pickup_time: new Date().toISOString(),
        expiry_time: new Date(Date.now() + 45 * 60000).toISOString(),
        rider_status: 'Pending',
        donorPhone: '+92 300 1234567',
        receiverPhone: '+92 301 7654321'
      },
      {
        id: 'del-002',
        donorName: 'Marquee Hall',
        pickupLocation: 'Marquee Hall, GT Road, Gujranwala',
        dropoffLocation: 'Edhi Center, Sialkot Road, Gujranwala',
        distance: '3.8 km',
        foodItems: 'Mixed Rice & Curry - 25 Portions',
        status: 'Available',
        expiryTime: 'Expires in 30 mins',
        food_type: 'cooked meal',
        food_title: 'Mixed Rice & Curry',
        quantity: '25 portions',
        pickup_time: new Date().toISOString(),
        expiry_time: new Date(Date.now() + 30 * 60000).toISOString(),
        rider_status: 'Pending',
        donorPhone: '+92 300 2345678',
        receiverPhone: '+92 301 8765432'
      },
      {
        id: 'del-003',
        donorName: 'Fresh Bakery',
        pickupLocation: 'Fresh Bakery, Sadar Bazaar, Sialkot',
        dropoffLocation: 'Orphanage Home, Paris Road, Sialkot',
        distance: '1.2 km',
        foodItems: 'Bread & Pastries - 60 Items',
        status: 'Available',
        expiryTime: 'Expires in 1 hour',
        food_type: 'baked goods',
        food_title: 'Bread & Pastries',
        quantity: '60 items',
        pickup_time: new Date().toISOString(),
        expiry_time: new Date(Date.now() + 60 * 60000).toISOString(),
        rider_status: 'Pending',
        donorPhone: '+92 300 3456789',
        receiverPhone: '+92 301 9876543'
      }
    ];
    
    setDeliveries(simulatedDeliveries);
  };

  // ─── API Calls ───────────────────────────────────────────
  const fetchAvailableDeliveries = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const response = await apiRequest('/rider/available-deliveries/');
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
  const handleAcceptDelivery = (deliveryId) => {
    setAcceptingId(deliveryId);
    
    // Find the delivery to accept
    const deliveryToAccept = deliveries.find(d => d.id === deliveryId);
    if (deliveryToAccept) {
      // Move from available to active
      const updatedDelivery = {
        ...deliveryToAccept,
        rider_status: 'Accepted',
        status: 'In Transit'
      };
      
      setDeliveries(deliveries.filter(d => d.id !== deliveryId));
      setMyDeliveries([...myDeliveries, updatedDelivery]);
      
      toast.success(`🏍️ Delivery accepted! You are now assigned to this delivery.`, {
        icon: '✅',
      });
      
      // Simulate notification
      toast.success('📦 Donor and receiver have been notified!', {
        icon: '🔔',
      });
    }
    
    setAcceptingId(null);
  };

  const handleUpdateStatus = (deliveryId, newStatus) => {
    if (newStatus === 'Delivered') {
      // Update metrics
      setTotalDeliveries(prev => prev + 1);
      setImpactScore(prev => prev + 50);
      
      // Remove from active deliveries
      setMyDeliveries(myDeliveries.filter(d => d.id !== deliveryId));
      
      toast.success('🎉 Delivery completed successfully! +50 XP awarded!', {
        icon: '🎉',
      });
    } else {
      // Update status locally
      const updatedMyDeliveries = myDeliveries.map(d =>
        d.id === deliveryId ? { ...d, rider_status: newStatus } : d
      );
      setMyDeliveries(updatedMyDeliveries);

      toast.success(`Status updated to: ${newStatus}`, {
        icon: '✅',
      });
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
    const statusBadge = RIDER_STATUS_BADGES[item.rider_status] || RIDER_STATUS_BADGES['Pending'];
    const foodIcon = getFoodIcon(item.food_type);

    return (
      <div className="rider-delivery-card" key={item.id}>
        <div className="rider-card-header">
          <div className="rider-card-icon">{foodIcon}</div>
          <div className="rider-card-title-section">
            <h3 className="rider-card-title">{item.food_title}</h3>
            <p className="rider-card-donor">{item.donorName}</p>
            <span className={`rider-status-badge ${statusBadge.class}`}>
              {statusBadge.icon} {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="rider-card-body">
          <div className="rider-detail-row">
            <span className="rider-detail-label">Food Items</span>
            <span className="rider-detail-value">🍽️ {item.foodItems || item.quantity}</span>
          </div>

          <div className="rider-location-section">
            <div className="rider-location-block">
              <div className="rider-location-header">
                <span className="rider-location-icon">📍</span>
                <span className="rider-location-label">Pickup (Donor)</span>
              </div>
              <p className="rider-location-text">{item.pickupLocation || item.pickup_location}</p>
            </div>

            <div className="rider-location-divider">
              <span className="rider-divider-icon">⬇️</span>
            </div>

            <div className="rider-location-block">
              <div className="rider-location-header">
                <span className="rider-location-icon">🏠</span>
                <span className="rider-location-label">Drop-off (Receiver)</span>
              </div>
              <p className="rider-location-text">{item.dropoffLocation || item.pickup_location}</p>
            </div>
          </div>

          <div className="rider-time-section">
            <div className="rider-time-item">
              <span className="rider-time-label">Distance</span>
              <span className="rider-time-value">{item.distance || 'N/A'}</span>
            </div>
            <div className="rider-time-item">
              <span className="rider-time-label">Expiry</span>
              <span className={`expiry-badge ${item.expiryTime?.includes('30') || item.expiryTime?.includes('45') ? 'urgent' : ''}`}>
                ⏰ {item.expiryTime || formatDate(item.expiry_time)}
              </span>
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
              {item.rider_status === 'Accepted' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'On the Way')}
                  className="rider-action-btn rider-btn-onway"
                >
                  🚚 Mark as Picked Up
                </button>
              )}
              {item.rider_status === 'On the Way' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'Delivered')}
                  className="rider-action-btn rider-btn-delivered"
                >
                  ✅ Mark as Delivered
                </button>
              )}
              
              {/* Communication Buttons */}
              <div className="rider-comm-buttons">
                <button
                  onClick={() => handleCallDonor(item.donorPhone)}
                  className="rider-comm-btn rider-call-donor"
                >
                  📞 Call Donor
                </button>
                <button
                  onClick={() => handleCallReceiver(item.receiverPhone)}
                  className="rider-comm-btn rider-call-receiver"
                >
                  📱 Call Receiver
                </button>
                <button
                  onClick={() => handleOpenMaps(item.pickupLocation, item.dropoffLocation)}
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
