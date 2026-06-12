import React, { useEffect, useState } from 'react';
import { getFoodListings, createFoodListing, updateFoodListing, deleteFoodListing } from '../api';
import { useAuth } from '../AuthContext';

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

/* ── Shared Tailwind class strings ── */
const INPUT_CLS =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-400 shadow-sm';
const LABEL_CLS = 'text-xs font-semibold text-gray-600 uppercase tracking-wider';

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
    if (!form.pickup_time) return 'Please select the pickup time.';
    if (!form.expiry_time) return 'Please select the expiry time.';
    if (!form.pickup_location.trim()) return 'Please enter a pickup address.';
    if (!form.contact_phone.trim()) return 'Please enter a contact phone number.';
    if (!form.food_image_url.trim()) return 'Please enter the food image URL.';
    return '';
  };

  /* ── Build the API payload — keys already match Django model ── */
  const buildPayload = (form) => ({
    food_title: form.food_title,
    food_type: form.food_type,
    quantity: form.quantity,
    description: form.description,
    pickup_time: formatDateTimeForBackend(form.pickup_time),
    expiry_time: formatDateTimeForBackend(form.expiry_time),
    pickup_location: form.pickup_location,
    contact_phone: form.contact_phone,
    food_image_url: form.food_image_url,
    latitude: form.latitude,
    longitude: form.longitude,
  });

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

    const payload = buildPayload(postForm);
    const response = await createFoodListing(payload);
    if (response.success) {
      setStatusMessage('Food listing created successfully!');
      setStatusType('success');
      setPostForm(initialFormState);
      loadFoodListings();
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

  /* ── Unauthenticated guard ── */
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-gray-100 text-center">
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Donor Food Listings</h3>
          <p className="text-sm text-gray-500">Please sign in to manage your listings.</p>
        </div>
      </div>
    );
  }

  /* ── Status banner helper ── */
  const StatusBanner = ({ colSpan = 'md:col-span-2' }) =>
    statusMessage ? (
      <div
        className={`${colSpan} rounded-xl border px-4 py-3 text-sm ${
          statusType === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        {statusMessage}
      </div>
    ) : null;

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

      {/* ═══════════════════ POST FOOD FORM ═══════════════════ */}
      {showCreate && (
        <section className="bg-white shadow-xl rounded-2xl p-6 md:p-10 max-w-4xl mx-auto mt-8 border border-gray-100">
          {/* Header */}
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Post New Food Donation
            </h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Fill in the full donation details below so your listing is clear, trustworthy, and ready for local receivers.
            </p>
          </div>

          {/* Form Grid */}
          <form onSubmit={handlePostSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Row 1: Food Title | Food Type */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Food Title *</label>
              <input
                name="food_title"
                value={postForm.food_title}
                onChange={handlePostChange}
                type="text"
                placeholder="e.g. Vegetable Curry Pack"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Food Type *</label>
              <select
                name="food_type"
                value={postForm.food_type}
                onChange={handlePostChange}
                className={INPUT_CLS}
              >
                <option value="">Select food type</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Cooked">Cooked Food</option>
                <option value="Dry">Dry Rations</option>
              </select>
            </div>

            {/* Row 2: Quantity | Contact Phone */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Quantity *</label>
              <input
                name="quantity"
                value={postForm.quantity}
                onChange={handlePostChange}
                type="text"
                placeholder="e.g. 8 servings or 4 kg"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Contact Phone *</label>
              <input
                name="contact_phone"
                value={postForm.contact_phone}
                onChange={handlePostChange}
                type="tel"
                placeholder="e.g. +91 98765 43210"
                className={INPUT_CLS}
              />
            </div>

            {/* Row 3: Pickup Time | Expiry Time */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Pickup Time *</label>
              <input
                name="pickup_time"
                value={postForm.pickup_time}
                onChange={handlePostChange}
                type="datetime-local"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Expiry Time *</label>
              <input
                name="expiry_time"
                value={postForm.expiry_time}
                onChange={handlePostChange}
                type="datetime-local"
                className={INPUT_CLS}
              />
            </div>

            {/* Full-width: Pickup Location */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Pickup Location *</label>
              <textarea
                name="pickup_location"
                value={postForm.pickup_location}
                onChange={handlePostChange}
                onBlur={handleLocationBlur}
                rows={3}
                placeholder="Enter the full pickup address, landmark, and directions"
                className={INPUT_CLS}
              />
            </div>

            {/* Full-width: Description */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Description *</label>
              <textarea
                name="description"
                value={postForm.description}
                onChange={handlePostChange}
                rows={4}
                placeholder="Add notes about packaging, reheating instructions, or special care"
                className={INPUT_CLS}
              />
            </div>

            {/* Full-width: Food Image URL */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Food Image URL *</label>
              <input
                name="food_image_url"
                value={postForm.food_image_url}
                onChange={handlePostChange}
                type="url"
                placeholder="Paste an image URL for the food item"
                className={INPUT_CLS}
              />
            </div>

            {/* Status Message */}
            <StatusBanner />

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md transform hover:-translate-y-0.5 mt-4"
              >
                {statusMessage === 'Posting Listing...' ? 'Posting Listing...' : 'Post Food Listing'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ═══════════════════ MANAGE LISTINGS ═══════════════════ */}
      {showManage && (
        <section className="bg-white shadow-xl rounded-2xl p-6 md:p-10 max-w-4xl mx-auto border border-gray-100">
          {/* Section Header */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Your Dashboard
              </span>
              <h3 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900">Manage Your Listings</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Edit or delete donations, then monitor the current availability status.
              </p>
            </div>
          </div>

          {/* ── Inline Edit Form ── */}
          {editingListingId && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Edit Listing</h4>
                  <p className="text-sm text-gray-500">Update the listing and save your changes.</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-100"
                  onClick={() => setEditingListingId(null)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Food Title *</label>
                  <input name="food_title" value={editingForm.food_title} onChange={handleEditChange} type="text" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Food Type *</label>
                  <select name="food_type" value={editingForm.food_type} onChange={handleEditChange} className={INPUT_CLS}>
                    <option value="">Select food type</option>
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Cooked">Cooked Food</option>
                    <option value="Dry">Dry Rations</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Quantity *</label>
                  <input name="quantity" value={editingForm.quantity} onChange={handleEditChange} type="text" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Contact Phone *</label>
                  <input name="contact_phone" value={editingForm.contact_phone} onChange={handleEditChange} type="tel" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Pickup Time *</label>
                  <input name="pickup_time" value={editingForm.pickup_time} onChange={handleEditChange} type="datetime-local" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Expiry Time *</label>
                  <input name="expiry_time" value={editingForm.expiry_time} onChange={handleEditChange} type="datetime-local" className={INPUT_CLS} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>Pickup Location *</label>
                  <textarea name="pickup_location" value={editingForm.pickup_location} onChange={handleEditChange} rows={2} className={INPUT_CLS} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>Description *</label>
                  <textarea name="description" value={editingForm.description} onChange={handleEditChange} rows={3} className={INPUT_CLS} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>Food Image URL *</label>
                  <input name="food_image_url" value={editingForm.food_image_url} onChange={handleEditChange} type="url" className={INPUT_CLS} />
                </div>

                <StatusBanner />

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Listings Table ── */}
          {loading ? (
            <div className="text-sm text-gray-500 py-4">Loading your listings...</div>
          ) : foodListings.length === 0 ? (
            <div className="text-sm text-gray-500 py-4">No active listings found. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Pickup</th>
                    <th className="px-4 py-3 font-semibold">Expiry</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {foodListings.map((listing) => (
                    <tr key={listing.id} className="bg-white transition duration-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{listing.food_title}</td>
                      <td className="px-4 py-3 text-gray-700">{listing.food_type}</td>
                      <td className="px-4 py-3 text-gray-700">{new Date(listing.pickup_time).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{listing.expiry_time ? new Date(listing.expiry_time).toLocaleString() : '–'}</td>
                      <td className="px-4 py-3 text-gray-700">{listing.pickup_location}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            listing.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : listing.status === 'Claimed'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition duration-200 hover:bg-emerald-100"
                            onClick={() => handleEditClick(listing)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition duration-200 hover:bg-red-100"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DonorFoodListingManager;
