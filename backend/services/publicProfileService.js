const db = require('../db');

class PublicProfileService {
  constructor() {
    this.db = db;
  }

  // Get public profile by user ID
  async getPublicProfile(userId, viewerId = null) {
    try {
      // Get basic profile information
      const profileQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.profile_photo_url,
          u.bio,
          u.location,
          u.languages_spoken,
          u.interests,
          u.fun_fact,
          u.created_at as member_since,
          u.last_active,
          u.profile_visibility,
          u.allow_messages,
          CASE WHEN u.show_email = 1 OR ? = u.id THEN u.email ELSE NULL END as email,
          CASE WHEN u.show_phone = 1 OR ? = u.id THEN u.phone_number ELSE NULL END as phone_number,
          
          -- Verification info
          uv.verification_score,
          uv.overall_verification_status,
          uv.email_verified,
          uv.phone_verified,
          uv.identity_verified,
          uv.address_verified,
          uv.driving_license_verified,
          uv.background_check_verified,
          
          -- Badges
          uv.superhost_badge,
          uv.frequent_traveler_badge,
          uv.early_adopter_badge,
          uv.top_reviewer_badge,
          uv.community_leader_badge,
          uv.superhost_since,
          uv.frequent_traveler_since,
          uv.early_adopter_since,
          uv.top_reviewer_since,
          uv.community_leader_since
          
        FROM users u
        LEFT JOIN user_verifications uv ON u.id = uv.user_id
        WHERE u.id = ? AND u.profile_visibility != 'private'
      `;

      const profile = this.db.prepare(profileQuery).get(viewerId, viewerId, userId);
      
      if (!profile) {
        return null;
      }

      // Get profile statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT CASE WHEN pth.is_public = 1 THEN pth.id END) as public_trips_count,
          COUNT(DISTINCT CASE WHEN ut.is_public = 1 AND ut.reviewee_id = ? THEN ut.id END) as reviews_received_count,
          AVG(CASE WHEN ut.is_public = 1 AND ut.reviewee_id = ? THEN ut.rating END) as average_rating_received,
          COUNT(DISTINCT CASE WHEN ut.is_public = 1 AND ut.reviewer_id = ? THEN ut.id END) as reviews_given_count,
          COUNT(DISTINCT v.id) as vehicles_owned,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings
        FROM users u
        LEFT JOIN public_trip_history pth ON u.id = pth.user_id
        LEFT JOIN user_testimonials ut ON (u.id = ut.reviewee_id OR u.id = ut.reviewer_id)
        LEFT JOIN vehicles v ON u.id = v.owner_id
        LEFT JOIN bookings b ON u.id = b.user_id
        WHERE u.id = ?
      `;

      const stats = this.db.prepare(statsQuery).get(userId, userId, userId, userId);

      // Get recent public trip history
      const tripsQuery = `
        SELECT 
          id,
          destination,
          trip_start_date,
          trip_end_date,
          trip_duration_days,
          trip_story,
          trip_rating,
          show_destination,
          show_dates,
          show_duration
        FROM public_trip_history 
        WHERE user_id = ? AND is_public = 1
        ORDER BY trip_start_date DESC
        LIMIT 5
      `;

      const recentTrips = this.db.prepare(tripsQuery).all(userId);

      // Get recent public reviews received
      const reviewsQuery = `
        SELECT 
          ut.id,
          ut.rating,
          ut.review_text,
          ut.created_at,
          u.first_name as reviewer_first_name,
          u.last_name as reviewer_last_name,
          u.profile_photo_url as reviewer_photo
        FROM user_testimonials ut
        JOIN users u ON ut.reviewer_id = u.id
        WHERE ut.reviewee_id = ? AND ut.is_public = 1 AND ut.moderation_status = 'approved'
        ORDER BY ut.created_at DESC
        LIMIT 5
      `;

      const recentReviews = this.db.prepare(reviewsQuery).all(userId);

      // Get vehicles owned (if host/owner)
      const vehiclesQuery = `
        SELECT 
          id,
          make,
          model,
          year,
          location,
          daily_rate,
          average_rating,
          total_reviews
        FROM vehicles 
        WHERE owner_id = ? AND available = 1
        ORDER BY average_rating DESC, total_reviews DESC
        LIMIT 3
      `;

      const vehicles = this.db.prepare(vehiclesQuery).all(userId);

      // Record profile view if viewer is different from profile owner
      if (viewerId && viewerId !== userId) {
        await this.recordProfileInteraction(viewerId, userId, 'view');
      }

      return {
        ...profile,
        stats: {
          ...stats,
          average_rating_received: stats.average_rating_received ? parseFloat(stats.average_rating_received).toFixed(1) : null
        },
        recentTrips: recentTrips.map(trip => ({
          ...trip,
          languages_spoken: trip.languages_spoken ? JSON.parse(trip.languages_spoken) : [],
          interests: trip.interests ? JSON.parse(trip.interests) : []
        })),
        recentReviews,
        vehicles,
        badges: this.formatBadges(profile)
      };

    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw error;
    }
  }

  // Update user's public profile
  async updatePublicProfile(userId, profileData) {
    try {
      const {
        bio,
        location,
        languages_spoken,
        interests,
        fun_fact,
        profile_visibility,
        allow_messages,
        show_email,
        show_phone,
        social_facebook,
        social_instagram,
        social_twitter
      } = profileData;

      const updateQuery = `
        UPDATE users 
        SET 
          bio = ?,
          location = ?,
          languages_spoken = ?,
          interests = ?,
          fun_fact = ?,
          profile_visibility = ?,
          allow_messages = ?,
          show_email = ?,
          show_phone = ?,
          social_facebook = ?,
          social_instagram = ?,
          social_twitter = ?,
          profile_completed = 1,
          last_active = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.prepare(updateQuery).run(
        bio,
        location,
        JSON.stringify(languages_spoken || []),
        JSON.stringify(interests || []),
        fun_fact,
        profile_visibility || 'public',
        allow_messages !== undefined ? allow_messages : 1,
        show_email !== undefined ? show_email : 0,
        show_phone !== undefined ? show_phone : 0,
        social_facebook,
        social_instagram,
        social_twitter,
        userId
      );

      return { success: true, message: 'Profile updated successfully' };

    } catch (error) {
      console.error('Error updating public profile:', error);
      throw error;
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(userId, photoUrl) {
    try {
      const updateQuery = `
        UPDATE users 
        SET profile_photo_url = ?, last_active = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.prepare(updateQuery).run(photoUrl, userId);

      return { success: true, photoUrl, message: 'Profile photo updated successfully' };

    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  // Get verification status
  async getVerificationStatus(userId) {
    try {
      const query = `
        SELECT 
          verification_score,
          overall_verification_status,
          email_verified,
          phone_verified,
          identity_verified,
          address_verified,
          driving_license_verified,
          background_check_verified,
          email_verified_at,
          phone_verified_at,
          identity_verified_at,
          address_verified_at,
          driving_license_verified_at,
          background_check_verified_at
        FROM user_verifications 
        WHERE user_id = ?
      `;

      const verification = this.db.prepare(query).get(userId);
      
      if (!verification) {
        // Create initial verification record
        await this.createInitialVerificationRecord(userId);
        return await this.getVerificationStatus(userId);
      }

      return verification;

    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  }

  // Update verification status
  async updateVerification(userId, verificationType, isVerified, documentUrl = null) {
    try {
      let updateQuery;
      let params;
      
      if (documentUrl) {
        updateQuery = `
          UPDATE user_verifications 
          SET 
            ${verificationType}_verified = ?,
            ${verificationType}_verified_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
            ${verificationType}_document_url = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `;
        params = [isVerified ? 1 : 0, isVerified ? 1 : 0, documentUrl, userId];
      } else {
        updateQuery = `
          UPDATE user_verifications 
          SET 
            ${verificationType}_verified = ?,
            ${verificationType}_verified_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `;
        params = [isVerified ? 1 : 0, isVerified ? 1 : 0, userId];
      }

      this.db.prepare(updateQuery).run(...params);

      // Recalculate verification score
      await this.updateVerificationScore(userId);

      return { success: true, message: `${verificationType} verification updated` };

    } catch (error) {
      console.error('Error updating verification:', error);
      throw error;
    }
  }

  // Award badge to user
  async awardBadge(userId, badgeType) {
    try {
      const updateQuery = `
        UPDATE user_verifications 
        SET 
          ${badgeType}_badge = 1,
          ${badgeType}_since = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;

      this.db.prepare(updateQuery).run(userId);

      // Create activity feed entry
      await this.createActivityFeedEntry(userId, 'badge_earned', `Earned ${badgeType.replace('_', ' ')} badge!`, {
        badgeType,
        earnedAt: new Date().toISOString()
      });

      return { success: true, message: `${badgeType} badge awarded` };

    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Search public profiles
  async searchPublicProfiles(searchTerm, filters = {}, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const { location, verificationLevel, hasBadges, languages } = filters;

      let whereConditions = [`u.profile_visibility = 'public'`];
      let params = [];

      if (searchTerm) {
        whereConditions.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.location LIKE ? OR u.bio LIKE ?)`);
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (location) {
        whereConditions.push(`u.location LIKE ?`);
        params.push(`%${location}%`);
      }

      if (verificationLevel) {
        whereConditions.push(`uv.overall_verification_status = ?`);
        params.push(verificationLevel);
      }

      if (hasBadges) {
        whereConditions.push(`(uv.superhost_badge = 1 OR uv.frequent_traveler_badge = 1 OR uv.early_adopter_badge = 1 OR uv.top_reviewer_badge = 1 OR uv.community_leader_badge = 1)`);
      }

      if (languages) {
        whereConditions.push(`u.languages_spoken LIKE ?`);
        params.push(`%${languages}%`);
      }

      const searchQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.profile_photo_url,
          u.bio,
          u.location,
          u.languages_spoken,
          u.interests,
          u.created_at as member_since,
          uv.verification_score,
          uv.overall_verification_status,
          uv.superhost_badge,
          uv.frequent_traveler_badge,
          uv.early_adopter_badge,
          uv.top_reviewer_badge,
          uv.community_leader_badge,
          COUNT(DISTINCT ut.id) as reviews_count,
          AVG(ut.rating) as average_rating,
          COUNT(DISTINCT v.id) as vehicles_count
        FROM users u
        LEFT JOIN user_verifications uv ON u.id = uv.user_id
        LEFT JOIN user_testimonials ut ON u.id = ut.reviewee_id AND ut.is_public = 1
        LEFT JOIN vehicles v ON u.id = v.owner_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY u.id
        ORDER BY uv.verification_score DESC, u.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const profiles = this.db.prepare(searchQuery).all(...params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_verifications uv ON u.id = uv.user_id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = this.db.prepare(countQuery).get(...countParams);

      return {
        profiles: profiles.map(profile => ({
          ...profile,
          languages_spoken: profile.languages_spoken ? JSON.parse(profile.languages_spoken) : [],
          interests: profile.interests ? JSON.parse(profile.interests) : [],
          badges: this.formatBadges(profile)
        })),
        pagination: {
          page,
          limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      };

    } catch (error) {
      console.error('Error searching public profiles:', error);
      throw error;
    }
  }

  // Helper methods
  async createInitialVerificationRecord(userId) {
    const insertQuery = `
      INSERT OR IGNORE INTO user_verifications (user_id, email_verified, email_verified_at)
      SELECT ?, 1, created_at FROM users WHERE id = ? AND email IS NOT NULL
    `;

    this.db.prepare(insertQuery).run(userId, userId);
  }

  async updateVerificationScore(userId) {
    const updateQuery = `
      UPDATE user_verifications 
      SET 
        verification_score = (
          (CASE WHEN email_verified = 1 THEN 20 ELSE 0 END) +
          (CASE WHEN phone_verified = 1 THEN 15 ELSE 0 END) +
          (CASE WHEN identity_verified = 1 THEN 25 ELSE 0 END) +
          (CASE WHEN address_verified = 1 THEN 15 ELSE 0 END) +
          (CASE WHEN driving_license_verified = 1 THEN 15 ELSE 0 END) +
          (CASE WHEN background_check_verified = 1 THEN 10 ELSE 0 END)
        ),
        overall_verification_status = CASE 
          WHEN verification_score >= 80 THEN 'premium'
          WHEN verification_score >= 60 THEN 'verified' 
          WHEN verification_score >= 20 THEN 'partial'
          ELSE 'unverified'
        END
      WHERE user_id = ?
    `;

    this.db.prepare(updateQuery).run(userId);
  }

  async recordProfileInteraction(viewerId, profileOwnerId, interactionType, data = {}) {
    const insertQuery = `
      INSERT INTO profile_interactions (viewer_id, profile_owner_id, interaction_type, interaction_data)
      VALUES (?, ?, ?, ?)
    `;

    this.db.prepare(insertQuery).run(viewerId, profileOwnerId, interactionType, JSON.stringify(data));
  }

  async createActivityFeedEntry(userId, activityType, title, data = {}) {
    const insertQuery = `
      INSERT INTO user_activity_feed (user_id, activity_type, activity_title, activity_description, activity_data)
      VALUES (?, ?, ?, ?, ?)
    `;

    this.db.prepare(insertQuery).run(userId, activityType, title, '', JSON.stringify(data));
  }

  formatBadges(profile) {
    const badges = [];

    if (profile.superhost_badge) {
      badges.push({
        type: 'superhost',
        name: 'Superhost',
        icon: '⭐',
        color: '#FF5A5F',
        earnedAt: profile.superhost_since,
        description: 'Exceptional host with outstanding reviews'
      });
    }

    if (profile.frequent_traveler_badge) {
      badges.push({
        type: 'frequent_traveler',
        name: 'Frequent Traveler',
        icon: '✈️',
        color: '#00A699',
        earnedAt: profile.frequent_traveler_since,
        description: 'Experienced traveler with multiple trips'
      });
    }

    if (profile.early_adopter_badge) {
      badges.push({
        type: 'early_adopter',
        name: 'Early Adopter',
        icon: '🚀',
        color: '#484848',
        earnedAt: profile.early_adopter_since,
        description: 'One of our first community members'
      });
    }

    if (profile.top_reviewer_badge) {
      badges.push({
        type: 'top_reviewer',
        name: 'Top Reviewer',
        icon: '📝',
        color: '#767676',
        earnedAt: profile.top_reviewer_since,
        description: 'Provides helpful and detailed reviews'
      });
    }

    if (profile.community_leader_badge) {
      badges.push({
        type: 'community_leader',
        name: 'Community Leader',
        icon: '👑',
        color: '#FFC72C',
        earnedAt: profile.community_leader_since,
        description: 'Active community member and helper'
      });
    }

    return badges;
  }
}

module.exports = new PublicProfileService(); 