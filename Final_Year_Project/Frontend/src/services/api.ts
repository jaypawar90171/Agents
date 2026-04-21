import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';
const API_TIMEOUT = 60000;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;