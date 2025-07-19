import { apiService } from './apiService';

class HostProfileService {
  /**
   * Get host profile
   */
  async getHostProfile() {
    try {
      const response = await apiService.get('/host-profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching host profile:', error);
      throw error;
    }
  }

  /**
   * Update host profile
   */
  async updateHostProfile(profileData) {
    try {
      const response = await apiService.post('/host-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating host profile:', error);
      throw error;
    }
  }

  /**
   * Get public host profile
   */
  async getPublicHostProfile(hostId) {
    try {
      const response = await apiService.get(`/host-profile/${hostId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public host profile:', error);
      throw error;
    }
  }

  /**
   * Get host analytics
   */
  async getHostAnalytics(periodType = 'monthly', startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams({ period_type: periodType });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiService.get(`/host-profile/analytics?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching host analytics:', error);
      throw error;
    }
  }

  /**
   * Get host notifications
   */
  async getHostNotifications(status = null, limit = 50, offset = 0) {
    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      if (status) params.append('status', status);

      const response = await apiService.get(`/host-profile/notifications?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching host notifications:', error);
      throw error;
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(notificationId, status) {
    try {
      const response = await apiService.put(`/host-profile/notifications/${notificationId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(onboardingStep, onboardingCompleted = false) {
    try {
      const response = await apiService.put('/host-profile/onboarding', {
        onboarding_step: onboardingStep,
        onboarding_completed: onboardingCompleted
      });
      return response.data;
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile) {
    if (!profile) return 0;

    const requiredFields = [
      'business_name',
      'business_type',
      'business_phone',
      'business_email',
      'host_description',
      'preferred_guest_type',
      'cancellation_policy',
      'insurance_provider',
      'insurance_policy_number'
    ];

    const completedFields = requiredFields.filter(field => {
      const value = profile[field];
      return value !== null && value !== undefined && value.toString().trim() !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Get onboarding steps
   */
  getOnboardingSteps() {
    return [
      {
        id: 'welcome',
        title: 'Welcome to KeyLo',
        description: 'Get started with your host journey',
        completed: false
      },
      {
        id: 'business_info',
        title: 'Business Information',
        description: 'Tell us about your business',
        completed: false
      },
      {
        id: 'insurance',
        title: 'Insurance & Safety',
        description: 'Add your insurance information',
        completed: false
      },
      {
        id: 'pricing',
        title: 'Pricing Strategy',
        description: 'Set up your pricing preferences',
        completed: false
      },
      {
        id: 'policies',
        title: 'Policies & Rules',
        description: 'Define your cancellation and house rules',
        completed: false
      },
      {
        id: 'verification',
        title: 'Verification',
        description: 'Complete identity verification',
        completed: false
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        description: 'Start hosting on KeyLo',
        completed: false
      }
    ];
  }
}

export default new HostProfileService();