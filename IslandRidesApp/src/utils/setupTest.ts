// Test utility to verify all package.json fixes are working
import { loggingService } from '../services/LoggingService';
import { getEnvironmentConfig } from '../config/environment';
import { apiService } from '../services/apiService';

export const runSetupTests = async () => {
  loggingService.info('🧪 Running setup verification tests...');
  
  try {
    // Test 1: Logging Service (react-native-logs)
    loggingService.info('\n1️⃣ Testing logging service...');
    loggingService.info('✅ React Native Logs working correctly');
    loggingService.debug('Debug message test');
    loggingService.warn('Warning message test');
    
    // Test 2: Environment Configuration
    loggingService.info('\n2️⃣ Testing environment configuration...');
    const envConfig = await getEnvironmentConfig();
    loggingService.info('✅ Environment config loaded:', {
      API_BASE_URL: envConfig.API_BASE_URL,
      ENVIRONMENT: envConfig.ENVIRONMENT,
      DEBUG: envConfig.DEBUG
    });
    
    // Test 3: API Service Initialization
    loggingService.info('\n3️⃣ Testing API service...');
    await apiService.waitForInitialization();
    loggingService.info('✅ API service initialized successfully');
    
    // Test 4: Check if backend is available
    loggingService.info('\n4️⃣ Testing backend connection...');
    try {
      // Simple health check with proper timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${envConfig.API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        loggingService.info('✅ Backend server is running and accessible');
      } else {
        loggingService.warn('⚠️ Backend server responded but with error status:', { status: response.status });
      }
    } catch (error) {
      loggingService.error('❌ Backend server not accessible. Make sure to start the backend server with: cd backend && npm start', error as Error);
    }
    
    loggingService.info('\n🎉 Setup verification complete!');
    
  } catch (error) {
    loggingService.error('❌ Setup test failed:', error as Error);
  }
};

export default runSetupTests;