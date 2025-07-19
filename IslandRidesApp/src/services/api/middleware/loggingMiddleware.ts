import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const loggingMiddleware = {
  onRequest: (config: AxiosRequestConfig) => {
    if (__DEV__) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📤 Request config:', {
        method: config.method,
        url: config.url,
        params: config.params,
        headers: config.headers,
        data: config.data ? '[DATA]' : undefined,
      });
    }
    return config;
  },

  onRequestError: (error: AxiosError) => {
    if (__DEV__) {
      console.error('❌ Request Error:', error.message);
    }
    return Promise.reject(error);
  },

  onResponse: (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('📥 Response data:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data ? '[DATA]' : undefined,
      });
    }
    return response;
  },

  onResponseError: (error: AxiosError) => {
    if (__DEV__) {
      console.error(`❌ Response Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('📥 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  },
};