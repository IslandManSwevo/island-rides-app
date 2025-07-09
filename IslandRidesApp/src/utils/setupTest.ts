// Test utility to verify all package.json fixes are working
import { loggingService } from '../services/LoggingService';
import { getEnvironmentConfig } from '../config/environment';
import { apiService } from '../services/apiService';

export const runSetupTests = async () => {
  console.log('🧪 Running setup verification tests...');
  
  try {
    // Test 1: Logging Service (react-native-logs)
    console.log('\n1️⃣ Testing logging service...');
    loggingService.info('✅ React Native Logs working correctly');
    loggingService.debug('Debug message test');
    loggingService.warn('Warning message test');
    
    // Test 2: Environment Configuration
    console.log('\n2️⃣ Testing environment configuration...');
    const envConfig = await getEnvironmentConfig();
    console.log('✅ Environment config loaded:', {
      API_BASE_URL: envConfig.API_BASE_URL,
      ENVIRONMENT: envConfig.ENVIRONMENT,
      DEBUG: envConfig.DEBUG
    });
    
    // Test 3: API Service Initialization
    console.log('\n3️⃣ Testing API service...');
    await apiService.waitForInitialization();
    console.log('✅ API service initialized successfully');
    
    // Test 4: Check if backend is available
    console.log('\n4️⃣ Testing backend connection...');
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
        console.log('✅ Backend server is running and accessible');
      } else {
        console.log('⚠️ Backend server responded but with error status:', response.status);
      }
    } catch (error) {
      console.log('❌ Backend server not accessible. Make sure to start the backend server with: cd backend && npm start');
    }
    
    console.log('\n🎉 Setup verification complete!');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error);
  }
};

export default runSetupTests; 