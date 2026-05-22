const API_BASE_URL = 'http://localhost:8000/api';

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
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        } else {
            return { success: false, error: data };
        }
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
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, data };
        } else {
            return { success: false, error: data };
        }
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
