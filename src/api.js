const API_BASE_URL = 'http://localhost:8000/api';

const getAuthToken = () => {
  return (
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  );
};

const getAuthHeaders = () => {
  const authToken = getAuthToken();
  return authToken ? { Authorization: `Token ${authToken}` } : {};
};

export const signup = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, data };
    }
    return { success: false, error: data };
  } catch (error) {
    return { success: false, error: 'Network error or server down' };
  }
};

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username || '');
      localStorage.setItem('isDonor', String(data.is_donor));
      localStorage.setItem('isReceiver', String(data.is_receiver));
      localStorage.setItem('isAdmin', String(data.is_admin));
      return { success: true, data };
    }
    return { success: false, error: data };
  } catch (error) {
    return { success: false, error: 'Network error or server down' };
  }
};

export const testDbConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-db/`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: 'Failed to connect to backend' };
  }
};

export const getFoodListings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/food-listings/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    const data = await response.json();
    return response.ok ? { success: true, data } : { success: false, error: data };
  } catch (error) {
    return { success: false, error: 'Network error or server down' };
  }
};

export const createFoodListing = async (listingData) => {
  try {
    const authToken = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers.Authorization = `Token ${authToken}`;
      console.log('[API] Auth token found, length:', authToken.length);
    } else {
      console.warn('[API] No auth token found in storage');
    }

    console.log('[API] Sending payload:', listingData);
    
    const response = await fetch(`${API_BASE_URL}/food-listings/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(listingData),
    });
    
    const data = await response.json();
    console.log('[API] Response status:', response.status, 'Body:', data);
    
    return response.ok ? { success: true, data } : { success: false, error: data };
  } catch (error) {
    console.error('[API] Network error:', error);
    return { success: false, error: 'Network error or server down' };
  }
};

export const updateFoodListing = async (listingId, listingData) => {
  try {
    const authToken = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers.Authorization = `Token ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/food-listings/${listingId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(listingData),
    });
    const data = await response.json();
    console.log('[API] Update response:', response.status, data);
    return response.ok ? { success: true, data } : { success: false, error: data };
  } catch (error) {
    console.error('[API] Update error:', error);
    return { success: false, error: 'Network error or server down' };
  }
};

export const deleteFoodListing = async (listingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/food-listings/${listingId}/`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.ok ? { success: true } : { success: false, error: 'Failed to delete listing' };
  } catch (error) {
    return { success: false, error: 'Network error or server down' };
  }
};
