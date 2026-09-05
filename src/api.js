export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `${BACKEND_URL}/api`;

export const getAuthToken = () =>
  localStorage.getItem('authToken') ||
  sessionStorage.getItem('authToken') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('token') ||
  '';

export const getAuthHeaders = () => {
  const authToken = getAuthToken();
  return authToken ? { Authorization: `Token ${authToken}` } : {};
};

export const resolveMediaUrl = (rawPath) => {
  if (!rawPath || typeof rawPath !== 'string') return '';
  const trimmed = rawPath.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:)/i.test(trimmed)) return trimmed;
  return `${BACKEND_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

const SERVER_UNREACHABLE_MESSAGE =
  'Unable to reach the server. Confirm Django is running at http://127.0.0.1:8000';

export const extractErrorMessage = (data, response, fallback = 'Request failed') => {
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (!data || typeof data !== 'object') {
    return response?.status ? `${fallback} (HTTP ${response.status})` : fallback;
  }
  if (typeof data.error === 'string' && data.error) return data.error;
  if (typeof data.detail === 'string' && data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return data.non_field_errors[0];
  }

  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    if (Array.isArray(value) && value[0]) return `${firstKey}: ${value[0]}`;
    if (typeof value === 'string' && value) return `${firstKey}: ${value}`;
  }

  return fallback;
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('[API] Non-JSON response:', response.status, text.slice(0, 300));
    return {
      detail: text.slice(0, 300),
      parseError: parseError.message,
    };
  }
};

const handleNetworkError = (error, context) => {
  const message =
    error?.message?.includes('Failed to fetch') || error?.name === 'TypeError'
      ? SERVER_UNREACHABLE_MESSAGE
      : error?.message || 'Unexpected network error';

  console.error(`[API] ${context} failed:`, error);

  return {
    success: false,
    error: { detail: message, networkError: true },
    errorMessage: message,
    networkError: true,
  };
};

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    isFormData = false,
    params,
    headers: extraHeaders = {},
  } = options;

  const headers = { Accept: 'application/json', ...extraHeaders };

  if (auth) {
    Object.assign(headers, getAuthHeaders());
  }

  if (body !== undefined && body !== null && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const query = searchParams.toString();
    if (query) url += `?${query}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined || body === null
          ? undefined
          : isFormData
          ? body
          : JSON.stringify(body),
    });

    const data = await parseResponseBody(response);

    if (response.ok) {
      return { success: true, data, status: response.status };
    }

    const errorMessage = extractErrorMessage(
      data,
      response,
      `Request failed (HTTP ${response.status})`
    );

    console.error('[API] Error response:', method, url, response.status, data);

    return {
      success: false,
      error: data || { detail: errorMessage },
      errorMessage,
      status: response.status,
    };
  } catch (error) {
    return handleNetworkError(error, `${method} ${url}`);
  }
}

export const signup = async (userData) => {
  const response = await apiRequest('/signup/', {
    method: 'POST',
    body: userData,
    auth: false,
  });

  if (response.success) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response;
};

export const login = async (credentials) => {
  const response = await apiRequest('/login/', {
    method: 'POST',
    body: credentials,
    auth: false,
  });

  if (response.success) {
    const data = response.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('username', data.username || '');
    localStorage.setItem('isDonor', String(data.is_donor));
    localStorage.setItem('isReceiver', String(data.is_receiver));
    localStorage.setItem('isAdmin', String(data.is_admin));
  }

  return response;
};

export const testDbConnection = async () => {
  const response = await apiRequest('/test-db/', { auth: false });
  return response.success ? response.data : { error: response.errorMessage };
};

export const getFoodListings = async () => apiRequest('/food-listings/');

export const createFoodListing = async (listingData, isFormData = false) => {
  const isPayloadFormData =
    isFormData || (typeof FormData !== 'undefined' && listingData instanceof FormData);

  if (!getAuthToken()) {
    console.warn('[API] No auth token found in storage');
  }

  return apiRequest('/food-listings/', {
    method: 'POST',
    body: listingData,
    isFormData: isPayloadFormData,
  });
};

export const updateFoodListing = async (listingId, listingData, isFormData = false) => {
  const isPayloadFormData =
    isFormData || (typeof FormData !== 'undefined' && listingData instanceof FormData);

  return apiRequest(`/food-listings/${listingId}/`, {
    method: 'PATCH',
    body: listingData,
    isFormData: isPayloadFormData,
  });
};

export const deleteFoodListing = async (listingId) =>
  apiRequest(`/food-listings/${listingId}/`, { method: 'DELETE' });

export const getAvailableFood = async (params = {}) =>
  apiRequest('/get-food/', { auth: false, params });

export const claimFood = async (foodId) =>
  apiRequest(`/claim-food/${foodId}/`, { method: 'POST', body: {} });

export const completeTransaction = async (foodId) =>
  apiRequest(`/complete-transaction/${foodId}/`, { method: 'POST', body: {} });

export const getMyClaims = async () => apiRequest('/my-claims/');

export const postFeedback = async (payload) =>
  apiRequest('/feedback/', { method: 'POST', body: payload });

export const sendChatMessage = async (receiverId, foodListingId, messageText) =>
  apiRequest('/chat/send/', {
    method: 'POST',
    body: {
      receiver_id: receiverId,
      food_listing_id: foodListingId,
      message_text: messageText,
    },
  });

export const getChatHistory = async (listingId) =>
  apiRequest(`/chat/history/${listingId}/`);

export const getAdminStats = async () => apiRequest('/admin/stats/');

export const getAdminListings = async () => apiRequest('/admin/listings/');

export const deleteAdminListing = async (listingId) =>
  apiRequest(`/admin/listings/${listingId}/`, { method: 'DELETE' });

export const getAdminUsers = async () => apiRequest('/admin/users/');

export const toggleBanUser = async (userId) =>
  apiRequest(`/admin/users/${userId}/ban/`, { method: 'POST', body: {} });

export const getUserProfile = async () => apiRequest('/profile/');

export const updateUserProfile = async (profileData) =>
  apiRequest('/profile/', { method: 'PUT', body: profileData });
