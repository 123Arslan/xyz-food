import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { getFoodListings, createFoodListing, updateFoodListing, deleteFoodListing, completeTransaction } from '../api';
import { useAuth } from '../AuthContext';
import ChatWindow from './ChatWindow';
import DonorAnalytics from './DonorAnalytics';
import './DonorFoodListingManager.css';

/* ── Form state uses snake_case keys matching Django model attributes directly ── */
const initialFormState = {
  food_title: '',
  food_type: '',
  quantity: '',
  description: '',
  pickup_time: '',
  expiry_time: '',
  pickup_location: '',
  contact_phone: '',
  food_image_url: '',
  latitude: null,
  longitude: null,
};

/* ── Date helpers ── */
const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const formatDateTimeForBackend = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) return '';
  const [datePart, timePart] = dateTimeLocalValue.split('T');
  if (!datePart || !timePart) return dateTimeLocalValue;
  const [hour, minute] = timePart.split(':');
  return `${datePart}T${hour}:${minute}:00Z`;
};

const DonorFoodListingManager = ({ showCreate = true, showManage = true }) => {
  const { isAuthenticated } = useAuth();
  const [postForm, setPostForm] = useState(initialFormState);
  const [foodListings, setFoodListings] = useState([]);
  const [editingListingId, setEditingListingId] = useState(null);
  const [editingForm, setEditingForm] = useState(initialFormState);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('error'); // 'error' | 'success'
  const [loading, setLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  
  // Image input state
  const [imageInputMode, setImageInputMode] = useState('url'); // 'url' | 'upload'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadFoodListings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPostForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.warn("Browser geolocation permission denied or unavailable.", error);
        }
      );
    }
  }, []);

  const handleLocationBlur = async () => {
    if (!postForm.pickup_location.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postForm.pickup_location)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPostForm(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
        setStatusMessage('Location geocoded successfully!');
        setStatusType('success');
      }
    } catch (err) {
      console.warn("Nominatim geocoding failed", err);
    }
  };

  /* ── Data loading ── */
  const loadFoodListings = async () => {
    setLoading(true);
    setStatusMessage('');
    const response = await getFoodListings();
    if (response.success) {
      // Handle both array and paginated ({ results: [] }) API responses
      const listings = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      setFoodListings(listings);
    } else {
      setStatusMessage('Unable to load your listings.');
      setStatusType('error');
    }
    setLoading(false);
  };

  /* ── Form handlers ── */
  const handlePostChange = (event) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
    
    // Handle URL preview
    if (name === 'food_image_url' && value) {
      setImagePreviewUrl(value);
    } else if (name === 'food_image_url' && !value) {
      setImagePreviewUrl('');
    }
  };

  /* ── Image file handlers ── */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleImageModeChange = (mode) => {
    setImageInputMode(mode);
    // Clear previous state when switching modes
    if (mode === 'url') {
      setImageFile(null);
      setImagePreviewUrl(postForm.food_image_url);
    } else {
      setPostForm(prev => ({ ...prev, food_image_url: '' }));
      setImagePreviewUrl('');
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditingForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Validation (uses snake_case keys) ── */
  const validateForm = (form) => {
    if (!form.food_title.trim()) return 'Please enter a food title.';
    if (!form.food_type) return 'Please select a food type.';
    if (!form.quantity.trim()) return 'Please enter the quantity available.';
    if (!form.description.trim()) return 'Please enter a food description.';
    if (!form.pickup_time) return 'Please select the pickup time (Cooked Time).';
    if (!form.expiry_time) return 'Please select the expiry time.';
    if (!form.pickup_location.trim()) return 'Please enter a pickup address.';
    if (!form.contact_phone.trim()) return 'Please enter a contact phone number.';
    
    // Validate image based on mode
    if (imageInputMode === 'url' && !form.food_image_url.trim()) {
      return 'Please enter the food image URL.';
    }
    if (imageInputMode === 'upload' && !imageFile) {
      return 'Please upload a food image.';
    }
    
    return '';
  };

  /* ── Form Validity Check for Submit Button ── */
  const isFormValid = useMemo(() => {
    const hasImage = imageInputMode === 'url' 
      ? postForm.food_image_url.trim()
      : imageFile;
    
    return (
      postForm.food_title.trim() &&
      postForm.food_type &&
      postForm.quantity.trim() &&
      postForm.description.trim() &&
      postForm.pickup_time &&
      postForm.expiry_time &&
      postForm.pickup_location.trim() &&
      postForm.contact_phone.trim() &&
      hasImage
    );
  }, [postForm, imageInputMode, imageFile]);

  /* ── Build the API payload — keys already match Django model ── */
  const buildPayload = (form) => {
    const payload = {
      food_title: form.food_title,
      food_type: form.food_type,
      quantity: form.quantity,
      description: form.description,
      pickup_time: formatDateTimeForBackend(form.pickup_time),
      expiry_time: formatDateTimeForBackend(form.expiry_time),
      pickup_location: form.pickup_location,
      contact_phone: form.contact_phone,
      latitude: form.latitude,
      longitude: form.longitude,
    };
    
    // Handle image based on mode
    if (imageInputMode === 'url') {
      payload.food_image_url = form.food_image_url;
    } else if (imageFile) {
      // For file upload, we'll include the file in FormData
      payload.imageFile = imageFile;
    }
    
    return payload;
  };

  /* ── Create ── */
  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    const validationError = validateForm(postForm);
    if (validationError) {
      setStatusMessage(validationError);
      setStatusType('error');
      return;
    }

    setStatusMessage('Posting Listing...');
    setStatusType('success');

    let response;
    
    // Handle file upload with FormData
    if (imageInputMode === 'upload' && imageFile) {
      const formData = new FormData();
      formData.append('food_title', postForm.food_title);
      formData.append('food_type', postForm.food_type);
      formData.append('quantity', postForm.quantity);
      formData.append('description', postForm.description);
      formData.append('pickup_time', formatDateTimeForBackend(postForm.pickup_time));
      formData.append('expiry_time', formatDateTimeForBackend(postForm.expiry_time));
      formData.append('pickup_location', postForm.pickup_location);
      formData.append('contact_phone', postForm.contact_phone);
      formData.append('food_image', imageFile);
      if (postForm.latitude) formData.append('latitude', postForm.latitude);
      if (postForm.longitude) formData.append('longitude', postForm.longitude);
      
      response = await createFoodListing(formData, true);
    } else {
      // Handle URL submission
      const payload = buildPayload(postForm);
      response = await createFoodListing(payload);
    }
    
    if (response.success) {
      setStatusMessage('Food listing created successfully!');
      setStatusType('success');
      setPostForm(initialFormState);
      setImageFile(null);
      setImagePreviewUrl('');
      setImageInputMode('url');
      loadFoodListings();
      // Hook Type 1: Receiver Alert - Simulate notification to receivers
      toast.success('🍲 New food available near you!', {
        icon: '🔔',
      });
    } else {
      const message =
        response.error?.detail ||
        response.error?.non_field_errors?.[0] ||
        response.error?.error ||
        JSON.stringify(response.error);
      setStatusMessage(message);
      setStatusType('error');
    }
  };

  /* ── Edit — populate form directly from snake_case API response ── */
  const handleEditClick = (listing) => {
    setEditingListingId(listing.id);
    setEditingForm({
      food_title: listing.food_title || '',
      food_type: listing.food_type || '',
      quantity: listing.quantity || '',
      description: listing.description || '',
      pickup_time: toDateTimeLocal(listing.pickup_time),
      expiry_time: toDateTimeLocal(listing.expiry_time),
      pickup_location: listing.pickup_location || '',
      contact_phone: listing.contact_phone || '',
      food_image_url: listing.food_image_url || '',
    });
    setStatusMessage('');
  };

  /* ── Save edit ── */
  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingListingId) return;
    setStatusMessage('');

    const validationError = validateForm(editingForm);
    if (validationError) {
      setStatusMessage(validationError);
      setStatusType('error');
      return;
    }

    const payload = buildPayload(editingForm);
    const response = await updateFoodListing(editingListingId, payload);
    if (response.success) {
      setStatusMessage('Listing updated successfully.');
      setStatusType('success');
      setEditingListingId(null);
      loadFoodListings();
    } else {
      const message =
        response.error?.detail ||
        response.error?.error ||
        JSON.stringify(response.error) ||
        'Failed to update listing.';
      setStatusMessage(message);
      setStatusType('error');
    }
  };

  /* ── Delete ── */
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setStatusMessage('');
    const response = await deleteFoodListing(listingId);
    if (response.success) {
      setStatusMessage('Listing deleted successfully.');
      setStatusType('success');
      loadFoodListings();
    } else {
      setStatusMessage('Failed to delete listing.');
      setStatusType('error');
    }
  };

  const handleCompleteTransaction = async (foodId) => {
    if (!window.confirm('Mark this transaction as completed?')) return;
    setStatusMessage('Completing transaction...');
    setStatusType('success');
    const response = await completeTransaction(foodId);
    if (response.success) {
      setStatusMessage('Transaction marked as completed.');
      setStatusType('success');
      loadFoodListings();
    } else {
      const errMsg = response.error?.error || response.error?.detail || 'Failed to complete transaction.';
      setStatusMessage(errMsg);
      setStatusType('error');
    }
  };

  /* ── Helper: status → CSS class ── */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available': return 'donor-status-available';
      case 'Pending': return 'donor-status-pending';
      case 'Completed': return 'donor-status-completed';
      default: return 'donor-status-default';
    }
  };

  const getStatusDotClass = (status) => {
    switch (status) {
      case 'Available': return 'donor-card-status-dot donor-card-status-dot-white';
      case 'Pending': return 'donor-card-status-dot donor-card-status-dot-amber';
      case 'Completed': return 'donor-card-status-dot donor-card-status-dot-indigo';
      default: return 'donor-card-status-dot donor-card-status-dot-gray';
    }
  };

  /* ── Unauthenticated guard ── */
  if (!isAuthenticated) {
    return (
      <div className="donor-unauthenticated">
        <div className="donor-unauthenticated-card">
          <h3>Donor Food Listings</h3>
          <p>Please sign in to manage your listings.</p>
        </div>
      </div>
    );
  }

  /* ── Status banner helper ── */
  const StatusBanner = () =>
    statusMessage ? (
      <div
        className={`donor-status-banner ${
          statusType === 'success'
            ? 'donor-status-banner-success'
            : 'donor-status-banner-error'
        }`}
      >
        {statusMessage}
      </div>
    ) : null;

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div className="donor-container">

      {/* ═══════════════════ POST FOOD FORM ═══════════════════ */}
      {showCreate && (
        <section className="donor-create-section">
          {/* Header */}
          <div className="donor-create-header">
            <h3>Post New Food Donation</h3>
            <p>
              Fill in the full donation details below so your listing is clear, trustworthy, and ready for local receivers.
            </p>
          </div>

          {/* Form Grid */}
          <form onSubmit={handlePostSubmit} className="donor-form-grid">

            {/* Row 1: Food Title | Food Type */}
            <div className="donor-form-group">
              <label className="donor-form-label">Food Title *</label>
              <input
                name="food_title"
                value={postForm.food_title}
                onChange={handlePostChange}
                type="text"
                placeholder="e.g. Vegetable Curry Pack"
                className="donor-input"
              />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Food Type *</label>
              <select
                name="food_type"
                value={postForm.food_type}
                onChange={handlePostChange}
                className="donor-select"
                required
              >
                <option value="">Select food type</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Cooked">Cooked Food</option>
                <option value="Dry">Dry Rations</option>
              </select>
            </div>

            {/* Row 2: Quantity | Contact Phone */}
            <div className="donor-form-group">
              <label className="donor-form-label">Quantity *</label>
              <input
                name="quantity"
                value={postForm.quantity}
                onChange={handlePostChange}
                type="text"
                placeholder="e.g. 8 servings or 4 kg"
                className="donor-input"
              />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Contact Phone *</label>
              <input
                name="contact_phone"
                value={postForm.contact_phone}
                onChange={handlePostChange}
                type="tel"
                placeholder="e.g. +91 98765 43210"
                className="donor-input"
              />
            </div>

            {/* Row 3: Pickup Time (Cooked Time) | Expiry Time */}
            <div className="donor-form-group">
              <label className="donor-form-label">Pickup Time (Cooked Time) *</label>
              <input
                name="pickup_time"
                value={postForm.pickup_time}
                onChange={handlePostChange}
                type="datetime-local"
                className="donor-input"
                required
              />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Expiry Time *</label>
              <input
                name="expiry_time"
                value={postForm.expiry_time}
                onChange={handlePostChange}
                type="datetime-local"
                className="donor-input"
              />
            </div>

            {/* Full-width: Pickup Location */}
            <div className="donor-form-group donor-form-group-full">
              <label className="donor-form-label">Pickup Location *</label>
              <textarea
                name="pickup_location"
                value={postForm.pickup_location}
                onChange={handlePostChange}
                onBlur={handleLocationBlur}
                rows={3}
                placeholder="Enter the full pickup address, landmark, and directions"
                className="donor-textarea"
              />
            </div>

            {/* Full-width: Description */}
            <div className="donor-form-group donor-form-group-full">
              <label className="donor-form-label">Description *</label>
              <textarea
                name="description"
                value={postForm.description}
                onChange={handlePostChange}
                rows={4}
                placeholder="Add notes about packaging, reheating instructions, or special care"
                className="donor-textarea"
              />
            </div>

            {/* Full-width: Food Image */}
            <div className="donor-form-group donor-form-group-full">
              <label className="donor-form-label">Food Image *</label>
              
              {/* Toggle Pills */}
              <div className="image-input-toggle">
                <button
                  type="button"
                  className={`toggle-pill ${imageInputMode === 'url' ? 'active' : ''}`}
                  onClick={() => handleImageModeChange('url')}
                >
                  🔗 Paste Image URL
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${imageInputMode === 'upload' ? 'active' : ''}`}
                  onClick={() => handleImageModeChange('upload')}
                >
                  📤 Upload from Device
                </button>
              </div>

              {/* URL Input */}
              {imageInputMode === 'url' && (
                <input
                  name="food_image_url"
                  value={postForm.food_image_url}
                  onChange={handlePostChange}
                  type="url"
                  placeholder="Paste an image URL for the food item"
                  className="donor-input"
                />
              )}

              {/* File Upload Drop Zone */}
              {imageInputMode === 'upload' && (
                <div
                  className="file-drop-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input"
                    id="food-image-upload"
                  />
                  <label htmlFor="food-image-upload" className="drop-zone-content">
                    <span className="drop-zone-icon">📷</span>
                    <span className="drop-zone-text">
                      Click to browse or Drag & Drop food picture here
                    </span>
                    <span className="drop-zone-subtext">
                      Supports Phone Gallery & Desktop Files
                    </span>
                  </label>
                </div>
              )}

              {/* Image Preview */}
              {imagePreviewUrl && (
                <div className="image-preview-container">
                  <span className="preview-label">Preview:</span>
                  <img
                    src={imagePreviewUrl}
                    alt="Food preview"
                    className="image-preview-thumbnail"
                  />
                  <button
                    type="button"
                    className="preview-clear-btn"
                    onClick={() => {
                      setImagePreviewUrl('');
                      setImageFile(null);
                      if (imageInputMode === 'url') {
                        setPostForm(prev => ({ ...prev, food_image_url: '' }));
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Status Message */}
            <StatusBanner />

            {/* Submit Button */}
            <button
              type="submit"
              className="donor-submit-btn"
              disabled={!isFormValid || statusMessage === 'Posting Listing...'}
              style={{
                opacity: !isFormValid || statusMessage === 'Posting Listing...' ? 0.6 : 1,
                cursor: !isFormValid || statusMessage === 'Posting Listing...' ? 'not-allowed' : 'pointer',
              }}
            >
              {statusMessage === 'Posting Listing...' ? 'Posting Listing...' : 'Post Food Listing'}
            </button>
          </form>
        </section>
      )}

      {/* ═══════════════════ ANALYTICS DASHBOARD ═══════════════════ */}
      <DonorAnalytics />

      {/* ═══════════════════ MANAGE LISTINGS ═══════════════════ */}
      {showManage && (
        <section className="donor-manage-section">
          {/* Section Header */}
          <div className="donor-manage-header">
            <div>
              <span className="donor-manage-badge">Your Dashboard</span>
              <h3 className="donor-manage-title">Manage Your Listings</h3>
              <p className="donor-manage-subtitle">
                Edit or delete donations, then monitor the current availability status.
              </p>
            </div>
          </div>

          {/* ── Inline Edit Form ── */}
          {editingListingId && (
            <div className="donor-edit-form">
              <div className="donor-edit-header">
                <div>
                  <h4>Edit Listing</h4>
                  <p>Update the listing and save your changes.</p>
                </div>
                <button
                  type="button"
                  className="donor-edit-close-btn"
                  onClick={() => setEditingListingId(null)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="donor-edit-form-grid">
                <div className="donor-form-group">
                  <label className="donor-form-label">Food Title *</label>
                  <input name="food_title" value={editingForm.food_title} onChange={handleEditChange} type="text" className="donor-input" />
                </div>
                <div className="donor-form-group">
                  <label className="donor-form-label">Food Type *</label>
                  <select name="food_type" value={editingForm.food_type} onChange={handleEditChange} className="donor-select">
                    <option value="">Select food type</option>
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Cooked">Cooked Food</option>
                    <option value="Dry">Dry Rations</option>
                  </select>
                </div>
                <div className="donor-form-group">
                  <label className="donor-form-label">Quantity *</label>
                  <input name="quantity" value={editingForm.quantity} onChange={handleEditChange} type="text" className="donor-input" />
                </div>
                <div className="donor-form-group">
                  <label className="donor-form-label">Contact Phone *</label>
                  <input name="contact_phone" value={editingForm.contact_phone} onChange={handleEditChange} type="tel" className="donor-input" />
                </div>
                <div className="donor-form-group">
                  <label className="donor-form-label">Pickup Time *</label>
                  <input name="pickup_time" value={editingForm.pickup_time} onChange={handleEditChange} type="datetime-local" className="donor-input" />
                </div>
                <div className="donor-form-group">
                  <label className="donor-form-label">Expiry Time *</label>
                  <input name="expiry_time" value={editingForm.expiry_time} onChange={handleEditChange} type="datetime-local" className="donor-input" />
                </div>
                <div className="donor-form-group donor-form-group-full">
                  <label className="donor-form-label">Pickup Location *</label>
                  <textarea name="pickup_location" value={editingForm.pickup_location} onChange={handleEditChange} rows={2} className="donor-textarea" />
                </div>
                <div className="donor-form-group donor-form-group-full">
                  <label className="donor-form-label">Description *</label>
                  <textarea name="description" value={editingForm.description} onChange={handleEditChange} rows={3} className="donor-textarea" />
                </div>
                <div className="donor-form-group donor-form-group-full">
                  <label className="donor-form-label">Food Image URL *</label>
                  <input name="food_image_url" value={editingForm.food_image_url} onChange={handleEditChange} type="url" className="donor-input" />
                </div>

                <StatusBanner />

                <button
                  type="submit"
                  className="donor-edit-save-btn"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* ── Listings Card Grid ── */}
          {loading ? (
            <div className="donor-loading">
              <div className="donor-spinner"></div>
              <p className="donor-loading-text">Loading your listings...</p>
            </div>
          ) : foodListings.length === 0 ? (
            <div className="donor-empty-state">
              <div className="donor-empty-icon">📋</div>
              <h4 className="donor-empty-title">No active listings yet</h4>
              <p className="donor-empty-subtitle">Create your first food donation to get started.</p>
            </div>
          ) : (
            <div className="donor-cards-grid">
              {foodListings.map((listing) => (
                <div key={listing.id} className="donor-card">
                  {/* Card Header: image or gradient placeholder */}
                  <div className="donor-card-image">
                    {listing.food_image_url ? (
                      <img
                        src={listing.food_image_url}
                        alt={listing.food_title}
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="donor-card-image-placeholder">🍽️</span>
                    )}
                    {/* Status badge overlay */}
                    <div className="donor-card-status-badge">
                      <span className={getStatusBadgeClass(listing.status)}>
                        <span className={getStatusDotClass(listing.status)}></span>
                        {listing.status}
                      </span>
                    </div>p
                    {/* Food type pill */}
                    <div className="donor-card-type-pill">
                      <span>{listing.food_type}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="donor-card-body">
                    <h4 className="donor-card-title">{listing.food_title}</h4>

                    {/* Time Info */}
                    <div className="donor-card-time-grid">
                      <div>
                        <span className="donor-card-time-label">Pickup</span>
                        <span className="donor-card-time-value">{new Date(listing.pickup_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div>
                        <span className="donor-card-time-label">Expiry</span>
                        <span className="donor-card-time-expiry">{listing.expiry_time ? new Date(listing.expiry_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="donor-card-location">
                      <span className="donor-card-location-icon">📍</span>
                      <span>{listing.pickup_location}</span>
                    </div>

                    {/* Claimed By Info (when Pending) */}
                    {listing.status === 'Pending' && listing.receiver && (
                      <div className="donor-card-claimed">
                        <div className="donor-card-claimed-title">Claimed By</div>
                        <div className="donor-card-claimed-line">👤 {listing.receiver.profile?.full_name || listing.receiver.email}</div>
                        <div className="donor-card-claimed-line">📞 {listing.receiver.profile?.contact_phone || 'N/A'}</div>
                        {listing.receiver.profile?.instructions && (
                          <div>📝 {listing.receiver.profile.instructions}</div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons Footer */}
                    <div className="donor-card-actions">
                      {listing.status === 'Pending' && listing.receiver && (
                        <button
                          type="button"
                          className="donor-card-btn donor-card-btn-chat"
                          onClick={() =>
                            setChatTarget({
                              listingId: listing.id,
                              receiverId: listing.receiver.id,
                              otherUserName: listing.receiver.profile?.full_name || listing.receiver.email,
                              listingTitle: listing.food_title,
                            })
                          }
                        >
                          💬 Chat Now
                        </button>
                      )}
                      {listing.status === 'Pending' && (
                        <button
                          type="button"
                          className="donor-card-btn donor-card-btn-complete"
                          onClick={() => handleCompleteTransaction(listing.id)}
                        >
                          ✅ Mark as Completed
                        </button>
                      )}
                      <button
                        type="button"
                        className="donor-card-btn donor-card-btn-edit"
                        onClick={() => handleEditClick(listing)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="donor-card-btn donor-card-btn-delete"
                        onClick={() => handleDeleteListing(listing.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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

export default DonorFoodListingManager;
