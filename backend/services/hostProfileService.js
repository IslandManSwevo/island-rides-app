const { Database } = require('sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'island-rides.db'));

class HostProfileService {
  /**
   * Create or update host profile
   */
  async createOrUpdateHostProfile(userId, profileData) {
    try {
      // First, update user table with host-specific fields
      const userUpdateQuery = `
        UPDATE users SET
          host_status = ?,
          host_since = COALESCE(host_since, CURRENT_TIMESTAMP),
          host_verification_level = ?,
          host_description = ?,
          host_languages = ?,
          host_specialties = ?,
          business_license_number = ?,
          tax_id = ?,
          preferred_communication = ?,
          auto_accept_bookings = ?,
          instant_book_enabled = ?,
          minimum_advance_notice = ?,
          maximum_advance_notice = ?,
          check_in_instructions = ?,
          house_rules = ?,
          cancellation_policy = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await this.runQuery(userUpdateQuery, [
        profileData.host_status || 'active',
        profileData.host_verification_level || 'basic',
        profileData.host_description,
        JSON.stringify(profileData.host_languages || []),
        JSON.stringify(profileData.host_specialties || []),
        profileData.business_license_number,
        profileData.tax_id,
        profileData.preferred_communication || 'app',
        profileData.auto_accept_bookings || 0,
        profileData.instant_book_enabled || 0,
        profileData.minimum_advance_notice || 24,
        profileData.maximum_advance_notice || 365,
        profileData.check_in_instructions,
        profileData.house_rules,
        profileData.cancellation_policy || 'moderate',
        userId
      ]);

      // Create or update host profile
      const profileQuery = `
        INSERT INTO host_profiles (
          user_id, business_name, business_type, business_address, business_phone,
          business_email, business_website, preferred_guest_type, minimum_trip_duration,
          maximum_trip_duration, preferred_booking_lead_time, base_pricing_strategy,
          seasonal_pricing_enabled, weekend_pricing_multiplier, holiday_pricing_multiplier,
          long_term_discount_enabled, long_term_discount_threshold, long_term_discount_percentage,
          insurance_provider, insurance_policy_number, insurance_coverage_amount,
          insurance_expiry_date, safety_certification, safety_certification_expiry,
          calendar_sync_enabled, external_calendar_url, default_availability_status,
          blocked_dates, notification_preferences, marketing_opt_in, review_reminder_enabled,
          booking_confirmation_auto_send, profile_completion_percentage, onboarding_completed,
          onboarding_step, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          business_name = excluded.business_name,
          business_type = excluded.business_type,
          business_address = excluded.business_address,
          business_phone = excluded.business_phone,
          business_email = excluded.business_email,
          business_website = excluded.business_website,
          preferred_guest_type = excluded.preferred_guest_type,
          minimum_trip_duration = excluded.minimum_trip_duration,
          maximum_trip_duration = excluded.maximum_trip_duration,
          preferred_booking_lead_time = excluded.preferred_booking_lead_time,
          base_pricing_strategy = excluded.base_pricing_strategy,
          seasonal_pricing_enabled = excluded.seasonal_pricing_enabled,
          weekend_pricing_multiplier = excluded.weekend_pricing_multiplier,
          holiday_pricing_multiplier = excluded.holiday_pricing_multiplier,
          long_term_discount_enabled = excluded.long_term_discount_enabled,
          long_term_discount_threshold = excluded.long_term_discount_threshold,
          long_term_discount_percentage = excluded.long_term_discount_percentage,
          insurance_provider = excluded.insurance_provider,
          insurance_policy_number = excluded.insurance_policy_number,
          insurance_coverage_amount = excluded.insurance_coverage_amount,
          insurance_expiry_date = excluded.insurance_expiry_date,
          safety_certification = excluded.safety_certification,
          safety_certification_expiry = excluded.safety_certification_expiry,
          calendar_sync_enabled = excluded.calendar_sync_enabled,
          external_calendar_url = excluded.external_calendar_url,
          default_availability_status = excluded.default_availability_status,
          blocked_dates = excluded.blocked_dates,
          notification_preferences = excluded.notification_preferences,
          marketing_opt_in = excluded.marketing_opt_in,
          review_reminder_enabled = excluded.review_reminder_enabled,
          booking_confirmation_auto_send = excluded.booking_confirmation_auto_send,
          profile_completion_percentage = excluded.profile_completion_percentage,
          onboarding_completed = excluded.onboarding_completed,
          onboarding_step = excluded.onboarding_step,
          updated_at = CURRENT_TIMESTAMP
      `;

      await this.runQuery(profileQuery, [
        userId,
        profileData.business_name,
        profileData.business_type || 'individual',
        profileData.business_address,
        profileData.business_phone,
        profileData.business_email,
        profileData.business_website,
        profileData.preferred_guest_type || 'any',
        profileData.minimum_trip_duration || 1,
        profileData.maximum_trip_duration || 30,
        profileData.preferred_booking_lead_time || 24,
        profileData.base_pricing_strategy || 'fixed',
        profileData.seasonal_pricing_enabled || 0,
        profileData.weekend_pricing_multiplier || 1.00,
        profileData.holiday_pricing_multiplier || 1.00,
        profileData.long_term_discount_enabled || 0,
        profileData.long_term_discount_threshold || 7,
        profileData.long_term_discount_percentage || 0.00,
        profileData.insurance_provider,
        profileData.insurance_policy_number,
        profileData.insurance_coverage_amount,
        profileData.insurance_expiry_date,
        profileData.safety_certification,
        profileData.safety_certification_expiry,
        profileData.calendar_sync_enabled || 0,
        profileData.external_calendar_url,
        profileData.default_availability_status || 'available',
        JSON.stringify(profileData.blocked_dates || []),
        JSON.stringify(profileData.notification_preferences || {}),
        profileData.marketing_opt_in !== undefined ? profileData.marketing_opt_in : 1,
        profileData.review_reminder_enabled !== undefined ? profileData.review_reminder_enabled : 1,
        profileData.booking_confirmation_auto_send !== undefined ? profileData.booking_confirmation_auto_send : 1,
        profileData.profile_completion_percentage || 0,
        profileData.onboarding_completed || 0,
        profileData.onboarding_step || 'welcome'
      ]);

      return await this.getHostProfile(userId);
    } catch (error) {
      console.error('Error creating/updating host profile:', error);
      throw error;
    }
  }

  /**
   * Get host profile by user ID
   */
  async getHostProfile(userId) {
    try {
      const query = `
        SELECT 
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.profile_image_url,
          u.host_status,
          u.host_since,
          u.host_verification_level,
          u.host_rating,
          u.total_host_reviews,
          u.response_rate,
          u.response_time_hours,
          u.acceptance_rate,
          u.cancellation_rate,
          u.superhost_status,
          u.superhost_since,
          u.host_description,
          u.host_languages,
          u.host_specialties,
          u.business_license_number,
          u.tax_id,
          u.preferred_communication,
          u.auto_accept_bookings,
          u.instant_book_enabled,
          u.minimum_advance_notice,
          u.maximum_advance_notice,
          u.check_in_instructions,
          u.house_rules,
          u.cancellation_policy,
          hp.*
        FROM users u
        LEFT JOIN host_profiles hp ON u.id = hp.user_id
        WHERE u.id = ? AND u.host_status != 'inactive'
      `;

      const result = await this.getQuery(query, [userId]);
      if (result) {
        // Parse JSON fields
        if (result.host_languages) {
          result.host_languages = JSON.parse(result.host_languages);
        }
        if (result.host_specialties) {
          result.host_specialties = JSON.parse(result.host_specialties);
        }
        if (result.blocked_dates) {
          result.blocked_dates = JSON.parse(result.blocked_dates);
        }
        if (result.notification_preferences) {
          result.notification_preferences = JSON.parse(result.notification_preferences);
        }
      }
      return result;
    } catch (error) {
      console.error('Error fetching host profile:', error);
      throw error;
    }
  }

  /**
   * Get host analytics
   */
  async getHostAnalytics(hostId, periodType = 'monthly', startDate = null, endDate = null) {
    try {
      let query = `
        SELECT * FROM host_analytics 
        WHERE host_id = ? AND period_type = ?
      `;
      const params = [hostId, periodType];

      if (startDate && endDate) {
        query += ` AND period_start >= ? AND period_end <= ?`;
        params.push(startDate, endDate);
      }

      query += ` ORDER BY period_start DESC`;

      const results = await this.allQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error fetching host analytics:', error);
      throw error;
    }
  }

  /**
   * Create host notification
   */
  async createHostNotification(hostId, notificationData) {
    try {
      const query = `
        INSERT INTO host_notifications (
          host_id, notification_type, title, message, action_url, action_text,
          priority, category, related_booking_id, related_vehicle_id, metadata,
          expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const result = await this.runQuery(query, [
        hostId,
        notificationData.notification_type,
        notificationData.title,
        notificationData.message,
        notificationData.action_url,
        notificationData.action_text,
        notificationData.priority || 'normal',
        notificationData.category || 'general',
        notificationData.related_booking_id,
        notificationData.related_vehicle_id,
        JSON.stringify(notificationData.metadata || {}),
        notificationData.expires_at
      ]);

      return { id: result.lastID };
    } catch (error) {
      console.error('Error creating host notification:', error);
      throw error;
    }
  }

  /**
   * Get host notifications
   */
  async getHostNotifications(hostId, status = null, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT * FROM host_notifications 
        WHERE host_id = ?
      `;
      const params = [hostId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.allQuery(query, params);
      return results.map(notification => ({
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
      }));
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
      const query = `
        UPDATE host_notifications 
        SET status = ?, read_at = CASE WHEN ? = 'read' THEN CURRENT_TIMESTAMP ELSE read_at END,
            archived_at = CASE WHEN ? = 'archived' THEN CURRENT_TIMESTAMP ELSE archived_at END
        WHERE id = ?
      `;

      await this.runQuery(query, [status, status, status, notificationId]);
      return { success: true };
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile) {
    const requiredFields = [
      'business_name', 'business_type', 'business_phone', 'business_email',
      'host_description', 'preferred_guest_type', 'cancellation_policy',
      'insurance_provider', 'insurance_policy_number'
    ];

    const completedFields = requiredFields.filter(field => 
      profile[field] && profile[field].toString().trim() !== ''
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  }

  // Helper methods
  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new HostProfileService();