import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getFoodListings, createFoodListing, updateFoodListing, deleteFoodListing, completeTransaction, resolveMediaUrl } from '../api';
import { useAuth } from '../AuthContext';
import ChatWindow from './ChatWindow';
import DonorAnalytics from './DonorAnalytics';
import './DonorFoodListingManager.css';

/* -----------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------------ */
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

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

/* -----------------------------------------------------------------
   DATE HELPERS
------------------------------------------------------------------ */
const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const formatDateTimeForBackend = (v) => {
  if (!v) return '';
  const [datePart, timePart] = v.split('T');
  if (!datePart || !timePart) return v;
  const [hour, minute] = timePart.split(':');
  return `${datePart}T${hour}:${minute}:00Z`;
};

/* -----------------------------------------------------------------
   IMAGE RESOLVER — checks all possible Django field names
   and handles relative media paths by prepending BACKEND_URL
------------------------------------------------------------------ */
const resolveImageSrc = (listing) => {
  if (!listing) return null;
  const rawImg = listing.food_image || listing.food_image_url || listing.image;
  return resolveMediaUrl(rawImg) || null;
};

/* -----------------------------------------------------------------
   STATUS CONFIG
------------------------------------------------------------------ */
const STATUS_CONFIG = {
  Available: { label: 'Available', cardClass: 'donor-status-available', dotKey: 'white' },
  Pending: { label: 'Pending', cardClass: 'donor-status-pending', dotKey: 'amber' },
  Completed: { label: 'Completed', cardClass: 'donor-status-completed', dotKey: 'indigo' },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || { label: status || 'Unknown', cardClass: 'donor-status-default', dotKey: 'gray' };

/* -----------------------------------------------------------------
   FOOD TYPE EMOJI MAP
------------------------------------------------------------------ */
const FOOD_TYPE_EMOJI = { Veg: '🥦', 'Non-Veg': '🍗', Cooked: '🍲', Dry: '🌾' };

/* =================================================================
   COMPONENT
================================================================= */
const DonorFoodListingManager = ({ showCreate = true, showManage = true }) => {
  const { isAuthenticated } = useAuth();

  /* State */
  const [postForm, setPostForm] = useState(initialFormState);
  const [foodListings, setFoodListings] = useState([]);
  const [editingListingId, setEditingListingId] = useState(null);
  const [editingForm, setEditingForm] = useState(initialFormState);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  /* Create-form image state */
  const [imageInputMode, setImageInputMode] = useState('url');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  /* Edit-form image state (kept independent) */
  const [editImageMode, setEditImageMode] = useState('url');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');

  /* Effects */
  useEffect(() => {
    if (isAuthenticated) loadFoodListings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setPostForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })),
        (err) => console.warn('Geolocation denied:', err)
      );
    }
  }, []);

  /* Geocoding on location blur */
  const handleLocationBlur = async () => {
    if (!postForm.pickup_location.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postForm.pickup_location)}`
      );
      const data = await res.json();
      if (data?.length > 0) {
        setPostForm((prev) => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }));
        setStatusMessage('📍 Location geocoded successfully!');
        setStatusType('success');
      }
    } catch (err) {
      console.warn('Nominatim geocoding failed', err);
    }
  };

  /* Data loading */
  const loadFoodListings = async () => {
    setLoading(true);
    setStatusMessage('');
    const response = await getFoodListings();
    if (response.success) {
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

  /* Form handlers */
  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'food_image_url') setImagePreviewUrl(value || '');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'food_image_url') setEditImagePreview(value || '');
  };

  /* Create-form image handlers */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file)); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleImageModeChange = (mode) => {
    setImageInputMode(mode);
    if (mode === 'url') { setImageFile(null); setImagePreviewUrl(postForm.food_image_url); }
    else { setPostForm((prev) => ({ ...prev, food_image_url: '' })); setImagePreviewUrl(''); }
  };

  /* Edit-form image handlers - FIXED: Single function that handles file input */
  const handleEditFileSelect = (fileOrEvent) => {
    let file;
    if (fileOrEvent?.target) {
      // Called from input onChange event
      file = fileOrEvent.target.files[0];
    } else {
      // Called directly with file object
      file = fileOrEvent;
    }

    if (file?.type.startsWith('image/')) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
      setEditingForm((prev) => ({ ...prev, food_image_url: '' }));
    }
  };

  const handleEditImageModeChange = (mode) => {
    setEditImageMode(mode);
    if (mode === 'url') {
      setEditImageFile(null);
      setEditImagePreview(editingForm.food_image_url);
    } else {
      setEditingForm((prev) => ({ ...prev, food_image_url: '' }));
      setEditImagePreview('');
    }
  };

  const handleEditClearPreview = () => {
    setEditImagePreview('');
    setEditImageFile(null);
    if (editImageMode === 'url') {
      setEditingForm((prev) => ({ ...prev, food_image_url: '' }));
    }
  };

  /* Validation */
  const validateForm = (form, isEdit = false) => {
    if (!form.food_title?.trim()) return 'Please enter a food title.';
    if (!form.food_type) return 'Please select a food type.';
    if (!form.quantity?.trim()) return 'Please enter the quantity available.';
    if (!form.description?.trim()) return 'Please enter a food description.';
    if (!form.pickup_time) return 'Please select the pickup time.';
    if (!form.expiry_time) return 'Please select the expiry time.';
    if (!form.pickup_location?.trim()) return 'Please enter a pickup address.';
    if (!form.contact_phone?.trim()) return 'Please enter a contact phone number.';
    if (!isEdit) {
      if (imageInputMode === 'url' && !form.food_image_url?.trim()) return 'Please enter the food image URL.';
      if (imageInputMode === 'upload' && !imageFile) return 'Please upload a food image.';
    }
    return '';
  };

  /* Form validity (create only) */
  const isFormValid = useMemo(() => {
    const hasImage = imageInputMode === 'url' ? postForm.food_image_url?.trim() : imageFile;
    return !!(
      postForm.food_title?.trim() && postForm.food_type && postForm.quantity?.trim() &&
      postForm.description?.trim() && postForm.pickup_time && postForm.expiry_time &&
      postForm.pickup_location?.trim() && postForm.contact_phone?.trim() && hasImage
    );
  }, [postForm, imageInputMode, imageFile]);

  /* Create */
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    const error = validateForm(postForm, false);
    if (error) { setStatusMessage(error); setStatusType('error'); return; }

    setStatusMessage('Posting listing…');
    setStatusType('success');

    let response;
    if (imageInputMode === 'upload' && imageFile) {
      const fd = new FormData();
      fd.append('food_title', postForm.food_title);
      fd.append('food_type', postForm.food_type);
      fd.append('quantity', postForm.quantity);
      fd.append('description', postForm.description);
      fd.append('pickup_time', formatDateTimeForBackend(postForm.pickup_time));
      fd.append('expiry_time', formatDateTimeForBackend(postForm.expiry_time));
      fd.append('pickup_location', postForm.pickup_location);
      fd.append('contact_phone', postForm.contact_phone);
      fd.append('food_image', imageFile);
      if (postForm.latitude) fd.append('latitude', postForm.latitude);
      if (postForm.longitude) fd.append('longitude', postForm.longitude);
      response = await createFoodListing(fd, true);
    } else {
      response = await createFoodListing({
        food_title: postForm.food_title,
        food_type: postForm.food_type,
        quantity: postForm.quantity,
        description: postForm.description,
        pickup_time: formatDateTimeForBackend(postForm.pickup_time),
        expiry_time: formatDateTimeForBackend(postForm.expiry_time),
        pickup_location: postForm.pickup_location,
        contact_phone: postForm.contact_phone,
        food_image_url: postForm.food_image_url,
        latitude: postForm.latitude,
        longitude: postForm.longitude,
      });
    }

    if (response.success) {
      setStatusMessage('✅ Food listing created successfully!');
      setStatusType('success');
      setPostForm(initialFormState);
      setImageFile(null);
      setImagePreviewUrl('');
      setImageInputMode('url');
      loadFoodListings();
      toast.success('🍲 New food available near you!', { icon: '🔔' });
    } else {
      const msg =
        response.errorMessage ||
        response.error?.detail ||
        response.error?.non_field_errors?.[0] ||
        response.error?.error ||
        'Failed to create listing.';
      setStatusMessage(msg);
      setStatusType('error');
    }
  };

  /* Edit open — populate edit form from listing */
  const handleEditClick = (listing) => {
    const existingUrl =
      listing.food_image_url ||
      (listing.food_image && /^https?:/i.test(listing.food_image) ? listing.food_image : '') ||
      '';
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
      food_image_url: existingUrl,
    });
    setEditImageMode('url');
    setEditImageFile(null);
    setEditImagePreview(existingUrl || resolveImageSrc(listing) || '');
    setStatusMessage('');
    setTimeout(() => {
      document.querySelector('.donor-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /* Save edit */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingListingId) return;
    setStatusMessage('');
    const error = validateForm(editingForm, true);
    if (error) { setStatusMessage(error); setStatusType('error'); return; }

    let response;
    if (editImageMode === 'upload' && editImageFile) {
      const fd = new FormData();
      fd.append('food_title', editingForm.food_title);
      fd.append('food_type', editingForm.food_type);
      fd.append('quantity', editingForm.quantity);
      fd.append('description', editingForm.description);
      fd.append('pickup_time', formatDateTimeForBackend(editingForm.pickup_time));
      fd.append('expiry_time', formatDateTimeForBackend(editingForm.expiry_time));
      fd.append('pickup_location', editingForm.pickup_location);
      fd.append('contact_phone', editingForm.contact_phone);
      fd.append('food_image', editImageFile);
      response = await updateFoodListing(editingListingId, fd, true);
    } else {
      response = await updateFoodListing(editingListingId, {
        food_title: editingForm.food_title,
        food_type: editingForm.food_type,
        quantity: editingForm.quantity,
        description: editingForm.description,
        pickup_time: formatDateTimeForBackend(editingForm.pickup_time),
        expiry_time: formatDateTimeForBackend(editingForm.expiry_time),
        pickup_location: editingForm.pickup_location,
        contact_phone: editingForm.contact_phone,
        food_image_url: editingForm.food_image_url,
      });
    }

    if (response.success) {
      setStatusMessage('✅ Listing updated successfully.');
      setStatusType('success');
      setEditingListingId(null);
      setEditImageFile(null);
      setEditImagePreview('');
      loadFoodListings();
    } else {
      const msg =
        response.errorMessage ||
        response.error?.detail ||
        response.error?.error ||
        'Failed to update listing.';
      setStatusMessage(msg);
      setStatusType('error');
    }
  };

  /* Delete */
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setStatusMessage('');
    // Optimistic removal
    setFoodListings((prev) => prev.filter((l) => l.id !== listingId));
    const response = await deleteFoodListing(listingId);
    if (response.success) {
      setStatusMessage('🗑️ Listing deleted.');
      setStatusType('success');
    } else {
      setStatusMessage('Failed to delete listing.');
      setStatusType('error');
      loadFoodListings(); // revert on failure
    }
  };

  /* Complete transaction */
  const handleCompleteTransaction = async (foodId) => {
    if (!window.confirm('Mark this transaction as completed?')) return;
    setCompletingId(foodId);
    // Optimistic status update
    setFoodListings((prev) =>
      prev.map((l) => (l.id === foodId ? { ...l, status: 'Completed' } : l))
    );
    const response = await completeTransaction(foodId);
    setCompletingId(null);
    if (response.success) {
      toast.success('🎉 Transaction marked as completed!');
    } else {
      const errMsg = response.errorMessage || response.error?.error || response.error?.detail || 'Failed to complete transaction.';
      setStatusMessage(errMsg);
      setStatusType('error');
      loadFoodListings(); // revert on failure
    }
  };

  /* Chat open */
  const handleChatOpen = useCallback((listing) => {
    if (!listing.receiver) return;
    setChatTarget({
      listingId: listing.id,
      receiverId: listing.receiver.id,
      otherUserName: listing.receiver.profile?.full_name || listing.receiver.email || 'Receiver',
      listingTitle: listing.food_title,
    });
  }, []);

  /* Unauthenticated guard */
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

  /* Status banner */
  const StatusBanner = () =>
    statusMessage ? (
      <div
        className={`donor-status-banner ${statusType === 'success' ? 'donor-status-banner-success' : 'donor-status-banner-error'
          }`}
      >
        {statusMessage}
      </div>
    ) : null;

  /* Shared image input section (used in both create and edit forms) */
  const ImageInputSection = ({
    mode, onModeChange,
    file, onFileChange, // FIXED: Changed onFileSelect to onFileChange
    onDrop: dropHandler, onDragOver: dragHandler,
    previewUrl, onClearPreview,
    formValue, onFormChange,
    fieldName = 'food_image_url',
    inputId = 'food-image-upload',
  }) => (
    <div className="donor-form-group donor-form-group-full">
      <label className="donor-form-label">Food Image {mode === 'url' ? '(URL)' : '(Upload)'}</label>
      <div className="image-input-toggle">
        <button type="button" className={`toggle-pill ${mode === 'url' ? 'active' : ''}`} onClick={() => onModeChange('url')}>
          🔗 Paste Image URL
        </button>
        <button type="button" className={`toggle-pill ${mode === 'upload' ? 'active' : ''}`} onClick={() => onModeChange('upload')}>
          📤 Upload from Device
        </button>
      </div>
      {mode === 'url' && (
        <input
          name={fieldName}
          value={formValue}
          onChange={onFormChange}
          type="url"
          placeholder="Paste an image URL for the food item"
          className="donor-input"
        />
      )}
      {mode === 'upload' && (
        <div className={`file-drop-zone ${file ? 'has-file' : ''}`} onDrop={dropHandler} onDragOver={dragHandler}>
          <input type="file" accept="image/*" onChange={onFileChange} className="file-input" id={inputId} />
          <label htmlFor={inputId} className="drop-zone-content">
            <span className="drop-zone-icon">{file ? '✅' : '📷'}</span>
            <span className="drop-zone-text">
              {file ? file.name : 'Click to browse or Drag & Drop food picture here'}
            </span>
            {!file && <span className="drop-zone-subtext">Supports Phone Gallery & Desktop Files</span>}
          </label>
        </div>
      )}
      {previewUrl && (
        <div className="image-preview-container">
          <span className="preview-label">Preview:</span>
          <img src={previewUrl} alt="Food preview" className="image-preview-thumbnail" />
          <button type="button" className="preview-clear-btn" onClick={onClearPreview} title="Remove image">✕</button>
        </div>
      )}
    </div>
  );

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div className="donor-container">

      {/* ════════════════ POST FOOD FORM ════════════════ */}
      {showCreate && (
        <section className="donor-create-section">
          <div className="donor-create-header">
            <div className="donor-create-header-icon">🍱</div>
            <h3>Post New Food Donation</h3>
            <p>Fill in the details below so your listing is clear, trustworthy, and ready for local receivers.</p>
          </div>

          <form onSubmit={handlePostSubmit} className="donor-form-grid">
            <div className="donor-form-group">
              <label className="donor-form-label">Food Title *</label>
              <input name="food_title" value={postForm.food_title} onChange={handlePostChange} type="text" placeholder="e.g. Vegetable Curry Pack" className="donor-input" />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Food Type *</label>
              <select name="food_type" value={postForm.food_type} onChange={handlePostChange} className="donor-select" required>
                <option value="">Select food type</option>
                <option value="Veg">🥦 Veg</option>
                <option value="Non-Veg">🍗 Non-Veg</option>
                <option value="Cooked">🍲 Cooked Food</option>
                <option value="Dry">🌾 Dry Rations</option>
              </select>
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Quantity *</label>
              <input name="quantity" value={postForm.quantity} onChange={handlePostChange} type="text" placeholder="e.g. 8 servings or 4 kg" className="donor-input" />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Contact Phone *</label>
              <input name="contact_phone" value={postForm.contact_phone} onChange={handlePostChange} type="tel" placeholder="e.g. +91 98765 43210" className="donor-input" />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Pickup Time (Cooked Time) *</label>
              <input name="pickup_time" value={postForm.pickup_time} onChange={handlePostChange} type="datetime-local" className="donor-input" required />
            </div>
            <div className="donor-form-group">
              <label className="donor-form-label">Expiry Time *</label>
              <input name="expiry_time" value={postForm.expiry_time} onChange={handlePostChange} type="datetime-local" className="donor-input" />
            </div>
            <div className="donor-form-group donor-form-group-full">
              <label className="donor-form-label">Pickup Location *</label>
              <textarea name="pickup_location" value={postForm.pickup_location} onChange={handlePostChange} onBlur={handleLocationBlur} rows={3} placeholder="Enter the full pickup address, landmark, and directions" className="donor-textarea" />
            </div>
            <div className="donor-form-group donor-form-group-full">
              <label className="donor-form-label">Description *</label>
              <textarea name="description" value={postForm.description} onChange={handlePostChange} rows={4} placeholder="Add notes about packaging, reheating instructions, or special care" className="donor-textarea" />
            </div>

            <ImageInputSection
              mode={imageInputMode}
              onModeChange={handleImageModeChange}
              file={imageFile}
              onFileChange={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              previewUrl={imagePreviewUrl}
              onClearPreview={() => {
                setImagePreviewUrl('');
                setImageFile(null);
                if (imageInputMode === 'url') setPostForm((prev) => ({ ...prev, food_image_url: '' }));
              }}
              formValue={postForm.food_image_url}
              onFormChange={handlePostChange}
              fieldName="food_image_url"
              inputId="food-image-upload-create"
            />

            <StatusBanner />

            <button
              type="submit"
              className="donor-submit-btn"
              disabled={!isFormValid || statusMessage === 'Posting listing…'}
            >
              {statusMessage === 'Posting listing…' ? (
                <><span className="btn-spinner" /> Posting…</>
              ) : (
                '🚀 Post Food Listing'
              )}
            </button>
          </form>
        </section>
      )}

      {/* ════════════════ ANALYTICS ════════════════ */}
      <DonorAnalytics />

      {/* ════════════════ MANAGE LISTINGS ════════════════ */}
      {showManage && (
        <section className="donor-manage-section">
          <div className="donor-manage-header">
            <div>
              <span className="donor-manage-badge">Your Dashboard</span>
              <h3 className="donor-manage-title">Manage Your Listings</h3>
              <p className="donor-manage-subtitle">
                Edit or delete donations and monitor their current availability status.
              </p>
            </div>
            <button type="button" className="donor-refresh-btn" onClick={loadFoodListings} title="Refresh listings">
              🔄 Refresh
            </button>
          </div>

          {/* Inline Edit Form */}
          {editingListingId && (
            <div className="donor-edit-form">
              <div className="donor-edit-header">
                <div>
                  <h4>✏️ Edit Listing</h4>
                  <p>Update the details and save your changes.</p>
                </div>
                <button
                  type="button"
                  className="donor-edit-close-btn"
                  onClick={() => { setEditingListingId(null); setEditImageFile(null); setEditImagePreview(''); }}
                >
                  ✕ Close
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
                    <option value="Veg">🥦 Veg</option>
                    <option value="Non-Veg">🍗 Non-Veg</option>
                    <option value="Cooked">🍲 Cooked Food</option>
                    <option value="Dry">🌾 Dry Rations</option>
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

                {/* FIXED: Using correct props */}
                <ImageInputSection
                  mode={editImageMode}
                  onModeChange={handleEditImageModeChange}
                  file={editImageFile}
                  onFileChange={handleEditFileSelect}  // FIXED: Changed from onFileSelect to onFileChange
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    handleEditFileSelect(file);  // FIXED: Using the unified handler
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  previewUrl={editImagePreview}
                  onClearPreview={handleEditClearPreview}  // FIXED: Using the unified handler
                  formValue={editingForm.food_image_url}
                  onFormChange={handleEditChange}
                  fieldName="food_image_url"
                  inputId="food-image-upload-edit"
                />

                <StatusBanner />

                <button type="submit" className="donor-edit-save-btn">💾 Save Changes</button>
              </form>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="donor-loading">
              <div className="donor-spinner" />
              <p className="donor-loading-text">Loading your listings…</p>
            </div>
          ) : foodListings.length === 0 ? (
            <div className="donor-empty-state">
              <div className="donor-empty-icon">🍽️</div>
              <h4 className="donor-empty-title">No active listings yet</h4>
              <p className="donor-empty-subtitle">Create your first food donation above to get started.</p>
            </div>
          ) : (
            <div className="donor-cards-grid">
              {foodListings.map((listing) => {
                const imageSrc = resolveImageSrc(listing);
                const statusCfg = getStatusConfig(listing.status);
                const foodEmoji = FOOD_TYPE_EMOJI[listing.food_type] || '🍴';
                const isCompleting = completingId === listing.id;

                return (
                  <div key={listing.id} className={`donor-card${isCompleting ? ' donor-card-completing' : ''}`}>

                    {/* Card Image Area */}
                    <div className="donor-card-image">
                      <img
                        src={imageSrc || DEFAULT_FOOD_IMAGE}
                        alt={listing.food_title}
                        className="donor-card-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_FOOD_IMAGE;
                        }}
                      />
                      {/* Gradient overlay always present for readability */}
                      <div className="donor-card-image-overlay" />
                      {/* Placeholder emoji — visible when no image */}
                      <div className="donor-card-image-placeholder">
                        <span>{foodEmoji}</span>
                      </div>

                      {/* Status Badge — top right */}
                      <div className={`donor-card-status-badge ${statusCfg.cardClass}`}>
                        <span className={`donor-card-status-dot dot-${statusCfg.dotKey}`} />
                        {statusCfg.label}
                      </div>

                      {/* Food Type Pill — top left */}

                      <div className="donor-card-type-pill">
                        {foodEmoji} {listing.food_type}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="donor-card-body">
                      <h4 className="donor-card-title" title={listing.food_title}>
                        {listing.food_title}
                      </h4>

                      {/* Quantity */}
                      <div className="donor-card-quantity">📦 {listing.quantity}</div>

                      {/* Time Grid */}
                      <div className="donor-card-time-grid">
                        <div className="donor-card-time-item">
                          <span className="donor-card-time-label">🕐 Pickup</span>
                          <span className="donor-card-time-value">
                            {listing.pickup_time
                              ? new Date(listing.pickup_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '–'}
                          </span>
                        </div>
                        <div className="donor-card-time-item">
                          <span className="donor-card-time-label">⏰ Expiry</span>
                          <span className="donor-card-time-expiry">
                            {listing.expiry_time
                              ? new Date(listing.expiry_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '–'}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="donor-card-location">
                        <span className="donor-card-location-icon">📍</span>
                        <span className="donor-card-location-text">{listing.pickup_location}</span>
                      </div>

                      {/* Claimed By — shown when Pending */}
                      {listing.status === 'Pending' && listing.receiver && (
                        <div className="donor-card-claimed">
                          <div className="donor-card-claimed-title">Claimed By</div>
                          <div className="donor-card-claimed-line">
                            👤 {listing.receiver.profile?.full_name || listing.receiver.email}
                          </div>
                          <div className="donor-card-claimed-line">
                            📞 {listing.receiver.profile?.contact_phone || 'N/A'}
                          </div>
                          {listing.receiver.profile?.instructions && (
                            <div className="donor-card-claimed-line">
                              📝 {listing.receiver.profile.instructions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="donor-card-actions">
                        {/* Row 1: Chat + Complete (only when Pending with receiver) */}
                        {listing.status === 'Pending' && listing.receiver && (
                          <div className="donor-card-actions-row">
                            <button
                              type="button"
                              className="donor-card-btn donor-card-btn-chat"
                              onClick={() => handleChatOpen(listing)}
                              title="Open chat with receiver"
                            >
                              💬 Chat Now
                            </button>
                            <button
                              type="button"
                              className="donor-card-btn donor-card-btn-complete"
                              onClick={() => handleCompleteTransaction(listing.id)}
                              disabled={isCompleting}
                              title="Mark as completed"
                            >
                              {isCompleting ? '⏳ Completing…' : '✅ Complete'}
                            </button>
                          </div>
                        )}

                        {/* Row 2: Edit + Delete */}
                        <div className="donor-card-actions-row">
                          {listing.status !== 'Completed' && (
                            <button
                              type="button"
                              className="donor-card-btn donor-card-btn-edit"
                              onClick={() => handleEditClick(listing)}
                              title="Edit this listing"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="donor-card-btn donor-card-btn-delete"
                            onClick={() => handleDeleteListing(listing.id)}
                            title="Delete this listing"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Chat Window Overlay */}
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