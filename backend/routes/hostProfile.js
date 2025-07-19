const express = require('express');
const router = express.Router();
const hostProfileService = require('../services/hostProfileService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/host-profile
 * @desc    Get current user's host profile
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await hostProfileService.getHostProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Host profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching host profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching host profile'
    });
  }
});

/**
 * @route   POST /api/host-profile
 * @desc    Create or update host profile
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const profileData = req.body;
    
    // Validate required fields
    if (!profileData.business_name || !profileData.business_type) {
      return res.status(400).json({
        success: false,
        message: 'Business name and type are required'
      });
    }

    const profile = await hostProfileService.createOrUpdateHostProfile(req.user.id, profileData);
    
    res.json({
      success: true,
      data: profile,
      message: 'Host profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating host profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating host profile'
    });
  }
});

/**
 * @route   GET /api/host-profile/:hostId
 * @desc    Get public host profile
 * @access  Public
 */
router.get('/:hostId', async (req, res) => {
  try {
    const profile = await hostProfileService.getHostProfile(req.params.hostId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Host profile not found'
      });
    }

    // Filter out sensitive information for public view
    const publicProfile = {
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      profile_image_url: profile.profile_image_url,
      host_status: profile.host_status,
      host_since: profile.host_since,
      host_verification_level: profile.host_verification_level,
      host_rating: profile.host_rating,
      total_host_reviews: profile.total_host_reviews,
      response_rate: profile.response_rate,
      response_time_hours: profile.response_time_hours,
      superhost_status: profile.superhost_status,
      superhost_since: profile.superhost_since,
      host_description: profile.host_description,
      host_languages: profile.host_languages,
      host_specialties: profile.host_specialties,
      business_name: profile.business_name,
      business_type: profile.business_type,
      business_website: profile.business_website,
      preferred_guest_type: profile.preferred_guest_type,
      minimum_trip_duration: profile.minimum_trip_duration,
      maximum_trip_duration: profile.maximum_trip_duration,
      auto_accept_bookings: profile.auto_accept_bookings,
      instant_book_enabled: profile.instant_book_enabled,
      minimum_advance_notice: profile.minimum_advance_notice,
      maximum_advance_notice: profile.maximum_advance_notice,
      cancellation_policy: profile.cancellation_policy,
      house_rules: profile.house_rules,
      check_in_instructions: profile.check_in_instructions
    };

    res.json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('Error fetching public host profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching host profile'
    });
  }
});

/**
 * @route   GET /api/host-profile/analytics
 * @desc    Get host analytics
 * @access  Private
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period_type = 'monthly', start_date, end_date } = req.query;
    
    const analytics = await hostProfileService.getHostAnalytics(
      req.user.id,
      period_type,
      start_date,
      end_date
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching host analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

/**
 * @route   GET /api/host-profile/notifications
 * @desc    Get host notifications
 * @access  Private
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const notifications = await hostProfileService.getHostNotifications(
      req.user.id,
      status,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching host notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

/**
 * @route   POST /api/host-profile/notifications
 * @desc    Create host notification
 * @access  Private (admin only)
 */
router.post('/notifications', authenticateToken, async (req, res) => {
  try {
    // This should be admin-only in production
    const { host_id, ...notificationData } = req.body;
    
    const notification = await hostProfileService.createHostNotification(
      host_id,
      notificationData
    );

    res.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification'
    });
  }
});

/**
 * @route   PUT /api/host-profile/notifications/:id
 * @desc    Update notification status
 * @access  Private
 */
router.put('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['read', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await hostProfileService.updateNotificationStatus(req.params.id, status);

    res.json({
      success: true,
      message: 'Notification status updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification status'
    });
  }
});

/**
 * @route   PUT /api/host-profile/onboarding
 * @desc    Update onboarding step
 * @access  Private
 */
router.put('/onboarding', authenticateToken, async (req, res) => {
  try {
    const { onboarding_step, onboarding_completed } = req.body;
    
    const profile = await hostProfileService.getHostProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Host profile not found'
      });
    }

    // Update onboarding step
    const updateData = {
      onboarding_step,
      onboarding_completed: onboarding_completed || false
    };

    const updatedProfile = await hostProfileService.createOrUpdateHostProfile(
      req.user.id,
      updateData
    );

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Onboarding status updated successfully'
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating onboarding status'
    });
  }
});

module.exports = router;