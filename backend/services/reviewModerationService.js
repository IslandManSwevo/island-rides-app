const db = require('../db');
const pushNotificationService = require('./pushNotificationService');

class ReviewModerationService {
  constructor() {
    this.profanityFilter = this.initializeProfanityFilter();
    this.suspiciousPatterns = this.initializeSuspiciousPatterns();
  }

  /**
   * Initialize profanity filter with common inappropriate words
   */
  initializeProfanityFilter() {
    return [
      'spam', 'fake', 'scam', 'terrible', 'awful', 'worst', 'horrible',
      'disgusting', 'pathetic', 'useless', 'garbage', 'trash', 'stupid',
      'idiot', 'moron', 'dumb', 'hate', 'sucks', 'crap'
    ];
  }

  /**
   * Initialize suspicious patterns for automated detection
   */
  initializeSuspiciousPatterns() {
    return [
      /(\b\d{1,2}\/10\b|\b\d{1,2} out of 10\b)/i, // Rating mentions
      /(call|text|contact).{0,20}(\d{3}[-.]?\d{3}[-.]?\d{4})/i, // Phone numbers
      /(email|e-mail).{0,20}([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i, // Email addresses
      /(website|site|url).{0,20}(https?:\/\/[^\s]+)/i, // URLs
      /(\$|USD|dollar).{0,10}\d+/i, // Money mentions
      /(book|rent|available).{0,20}(elsewhere|outside|direct)/i, // Off-platform encouragement
    ];
  }

  /**
   * Moderate a review automatically when submitted
   */
  async moderateReview(reviewId, reviewData) {
    try {
      const { comment, rating, userId, vehicleId } = reviewData;
      
      console.log(`🔍 Moderating review ${reviewId} from user ${userId}`);

      // Run all moderation checks
      const moderationResults = {
        profanityScore: this.checkProfanity(comment),
        suspiciousContent: this.checkSuspiciousPatterns(comment),
        spamLikelihood: await this.checkSpamLikelihood(userId, comment),
        ratingConsistency: this.checkRatingConsistency(rating, comment),
        lengthAnalysis: this.analyzeReviewLength(comment),
        duplicateCheck: await this.checkDuplicateContent(comment, userId),
      };

      // Calculate overall risk score (0-100)
      const riskScore = this.calculateRiskScore(moderationResults);
      
      // Determine action based on risk score
      let status = 'approved';
      let autoAction = 'none';

      if (riskScore >= 80) {
        status = 'rejected';
        autoAction = 'auto_rejected';
      } else if (riskScore >= 50) {
        status = 'pending';
        autoAction = 'flagged_for_review';
      } else if (riskScore >= 25) {
        status = 'approved';
        autoAction = 'auto_approved_with_flag';
      } else {
        status = 'approved';
        autoAction = 'auto_approved';
      }

      // Store moderation result
      await this.storeModerationResult(reviewId, {
        ...moderationResults,
        riskScore,
        status,
        autoAction,
        moderatedAt: new Date(),
        moderatedBy: 'system'
      });

      // Update review status
      await this.updateReviewStatus(reviewId, status);

      // Send notifications if needed
      if (status === 'rejected') {
        await this.notifyUserOfRejection(userId, moderationResults);
      } else if (status === 'pending') {
        await this.notifyAdminsOfPendingReview(reviewId, riskScore);
      }

      console.log(`✅ Review ${reviewId} moderated: ${status} (risk: ${riskScore})`);
      
      return {
        reviewId,
        status,
        riskScore,
        autoAction,
        moderationResults
      };

    } catch (error) {
      console.error(`❌ Error moderating review ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * Check for profanity and inappropriate language
   */
  checkProfanity(text) {
    const lowerText = text.toLowerCase();
    let profanityCount = 0;
    
    this.profanityFilter.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        profanityCount += matches.length;
      }
    });

    // Score based on density
    const wordCount = text.split(/\s+/).length;
    const profanityDensity = profanityCount / wordCount;
    
    return Math.min(profanityDensity * 100, 100);
  }

  /**
   * Check for suspicious patterns
   */
  checkSuspiciousPatterns(text) {
    const suspiciousMatches = [];
    
    this.suspiciousPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        suspiciousMatches.push({
          pattern: index,
          matches: matches,
          type: this.getSuspiciousPatternType(index)
        });
      }
    });

    return {
      count: suspiciousMatches.length,
      matches: suspiciousMatches,
      score: Math.min(suspiciousMatches.length * 20, 100)
    };
  }

  /**
   * Get suspicious pattern type description
   */
  getSuspiciousPatternType(index) {
    const types = [
      'rating_mention',
      'phone_number',
      'email_address',
      'url_link',
      'money_mention',
      'off_platform_booking'
    ];
    return types[index] || 'unknown';
  }

  /**
   * Check for spam likelihood based on user history
   */
  async checkSpamLikelihood(userId, comment) {
    try {
      // Check user's recent review frequency
      const recentReviews = await db.query(`
        SELECT COUNT(*) as count, 
               array_agg(comment) as recent_comments
        FROM reviews 
        WHERE user_id = $1 
          AND created_at > NOW() - INTERVAL '7 days'
      `, [userId]);

      const recentCount = parseInt(recentReviews.rows[0].count);
      const recentComments = recentReviews.rows[0].recent_comments || [];

      // Check for identical or very similar reviews
      let similarityScore = 0;
      if (recentComments.length > 0) {
        recentComments.forEach(existingComment => {
          if (existingComment) {
            const similarity = this.calculateTextSimilarity(comment, existingComment);
            similarityScore = Math.max(similarityScore, similarity);
          }
        });
      }

      // Calculate spam score
      let spamScore = 0;
      if (recentCount > 5) spamScore += 30; // Too many recent reviews
      if (recentCount > 10) spamScore += 50; // Way too many
      if (similarityScore > 0.8) spamScore += 40; // Very similar to recent review
      if (comment.length < 10) spamScore += 20; // Too short
      
      return {
        recentReviewCount: recentCount,
        maxSimilarity: similarityScore,
        score: Math.min(spamScore, 100)
      };

    } catch (error) {
      console.error('Error checking spam likelihood:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Check if rating matches comment sentiment
   */
  checkRatingConsistency(rating, comment) {
    const lowerComment = comment.toLowerCase();
    
    // Positive words
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'awesome', 'good', 'nice', 'clean', 'comfortable', 'reliable'];
    
    // Negative words
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'horrible', 'disgusting', 'dirty', 'broken', 'unreliable', 'poor', 'disappointing'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerComment.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerComment.includes(word)) negativeCount++;
    });

    // Determine sentiment
    let commentSentiment = 'neutral';
    if (positiveCount > negativeCount) commentSentiment = 'positive';
    if (negativeCount > positiveCount) commentSentiment = 'negative';

    // Check consistency
    let inconsistencyScore = 0;
    if (rating >= 4 && commentSentiment === 'negative') inconsistencyScore = 70;
    if (rating <= 2 && commentSentiment === 'positive') inconsistencyScore = 70;
    if (rating === 3 && (commentSentiment === 'positive' || commentSentiment === 'negative')) inconsistencyScore = 30;

    return {
      rating,
      commentSentiment,
      positiveWords: positiveCount,
      negativeWords: negativeCount,
      inconsistencyScore
    };
  }

  /**
   * Analyze review length and structure
   */
  analyzeReviewLength(comment) {
    const length = comment.length;
    const wordCount = comment.split(/\s+/).length;
    const sentences = comment.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let score = 0;
    if (length < 10) score += 30; // Too short
    if (length > 2000) score += 20; // Suspiciously long
    if (wordCount < 3) score += 40; // Too few words
    if (sentences.length === 0) score += 20; // No proper sentences

    return {
      characterCount: length,
      wordCount,
      sentenceCount: sentences.length,
      score: Math.min(score, 100)
    };
  }

  /**
   * Check for duplicate content
   */
  async checkDuplicateContent(comment, userId) {
    try {
      const similarReviews = await db.query(`
        SELECT id, comment, user_id, created_at
        FROM reviews 
        WHERE user_id != $1 
          AND created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 100
      `, [userId]);

      let maxSimilarity = 0;
      let duplicateReviewId = null;

      for (const review of similarReviews.rows) {
        const similarity = this.calculateTextSimilarity(comment, review.comment);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          duplicateReviewId = review.id;
        }
      }

      let score = 0;
      if (maxSimilarity > 0.9) score = 80; // Very likely duplicate
      else if (maxSimilarity > 0.7) score = 50; // Possibly duplicate
      else if (maxSimilarity > 0.5) score = 20; // Somewhat similar

      return {
        maxSimilarity,
        duplicateReviewId,
        score
      };

    } catch (error) {
      console.error('Error checking duplicate content:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Calculate text similarity using simple character-based comparison
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    
    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);
    
    if (normalized1 === normalized2) return 1;
    
    // Simple character-based similarity
    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(results) {
    const weights = {
      profanityScore: 0.25,
      suspiciousContent: 0.2,
      spamLikelihood: 0.25,
      ratingConsistency: 0.15,
      lengthAnalysis: 0.1,
      duplicateCheck: 0.05
    };

    let totalScore = 0;
    totalScore += (results.profanityScore || 0) * weights.profanityScore;
    totalScore += (results.suspiciousContent?.score || 0) * weights.suspiciousContent;
    totalScore += (results.spamLikelihood?.score || 0) * weights.spamLikelihood;
    totalScore += (results.ratingConsistency?.inconsistencyScore || 0) * weights.ratingConsistency;
    totalScore += (results.lengthAnalysis?.score || 0) * weights.lengthAnalysis;
    totalScore += (results.duplicateCheck?.score || 0) * weights.duplicateCheck;

    return Math.round(totalScore);
  }

  /**
   * Store moderation result
   */
  async storeModerationResult(reviewId, moderationData) {
    await db.query(`
      INSERT INTO review_moderation_logs 
      (review_id, moderation_data, risk_score, status, auto_action, moderated_at, moderated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      reviewId,
      JSON.stringify(moderationData),
      moderationData.riskScore,
      moderationData.status,
      moderationData.autoAction,
      moderationData.moderatedAt,
      moderationData.moderatedBy
    ]);
  }

  /**
   * Update review status
   */
  async updateReviewStatus(reviewId, status) {
    await db.query(`
      UPDATE reviews 
      SET moderation_status = $1, moderated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, reviewId]);
  }

  /**
   * Get pending reviews for admin review
   */
  async getPendingReviews(limit = 20, offset = 0) {
    const result = await db.query(`
      SELECT 
        r.*,
        u.first_name, u.last_name, u.email,
        v.make, v.model, v.year,
        rml.risk_score, rml.moderation_data, rml.auto_action
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN review_moderation_logs rml ON r.id = rml.review_id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(row => ({
      ...row,
      moderation_data: row.moderation_data ? JSON.parse(row.moderation_data) : null
    }));
  }

  /**
   * Admin approve review
   */
  async approveReview(reviewId, adminId, notes = null) {
    await db.query('BEGIN');
    
    try {
      // Update review status
      await db.query(`
        UPDATE reviews 
        SET moderation_status = 'approved', moderated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [reviewId]);

      // Log admin action
      await db.query(`
        INSERT INTO review_moderation_logs 
        (review_id, status, moderated_by, moderated_at, admin_notes)
        VALUES ($1, 'approved', $2, CURRENT_TIMESTAMP, $3)
      `, [reviewId, `admin_${adminId}`, notes]);

      await db.query('COMMIT');
      console.log(`✅ Review ${reviewId} approved by admin ${adminId}`);
      
      return { success: true, status: 'approved' };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Admin reject review
   */
  async rejectReview(reviewId, adminId, reason, notes = null) {
    await db.query('BEGIN');
    
    try {
      // Update review status
      await db.query(`
        UPDATE reviews 
        SET moderation_status = 'rejected', moderated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [reviewId]);

      // Log admin action
      await db.query(`
        INSERT INTO review_moderation_logs 
        (review_id, status, moderated_by, moderated_at, admin_notes, rejection_reason)
        VALUES ($1, 'rejected', $2, CURRENT_TIMESTAMP, $3, $4)
      `, [reviewId, `admin_${adminId}`, notes, reason]);

      // Notify user
      const reviewData = await db.query(`
        SELECT r.user_id, u.first_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `, [reviewId]);

      if (reviewData.rows.length > 0) {
        const { user_id, first_name } = reviewData.rows[0];
        await pushNotificationService.sendToUser(user_id, {
          title: 'Review Update',
          body: `Your review was not approved. Reason: ${reason}`,
          data: {
            type: 'review_rejected',
            reviewId,
            reason
          }
        });
      }

      await db.query('COMMIT');
      console.log(`❌ Review ${reviewId} rejected by admin ${adminId}: ${reason}`);
      
      return { success: true, status: 'rejected', reason };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId, reportedBy, reason, description = null) {
    try {
      await db.query(`
        INSERT INTO review_reports 
        (review_id, reported_by, reason, description, reported_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [reviewId, reportedBy, reason, description]);

      // Flag review for admin review if not already
      await db.query(`
        UPDATE reviews 
        SET moderation_status = 'pending'
        WHERE id = $1 AND moderation_status = 'approved'
      `, [reviewId]);

      console.log(`🚩 Review ${reviewId} reported by user ${reportedBy}: ${reason}`);
      
      return { success: true, reportId: reviewId };
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats() {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN moderation_status = 'rejected' THEN 1 END) as rejected,
        AVG(CASE WHEN rml.risk_score IS NOT NULL THEN rml.risk_score END)::DECIMAL(5,2) as avg_risk_score
      FROM reviews r
      LEFT JOIN review_moderation_logs rml ON r.id = rml.review_id
      WHERE r.created_at > NOW() - INTERVAL '30 days'
    `);

    const reportStats = await db.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT review_id) as unique_reviews_reported,
        COUNT(CASE WHEN reason = 'inappropriate' THEN 1 END) as inappropriate,
        COUNT(CASE WHEN reason = 'spam' THEN 1 END) as spam,
        COUNT(CASE WHEN reason = 'fake' THEN 1 END) as fake,
        COUNT(CASE WHEN reason = 'other' THEN 1 END) as other
      FROM review_reports
      WHERE reported_at > NOW() - INTERVAL '30 days'
    `);

    return {
      reviews: stats.rows[0],
      reports: reportStats.rows[0]
    };
  }

  /**
   * Notify user of review rejection
   */
  async notifyUserOfRejection(userId, moderationResults) {
    let reason = 'Content policy violation';
    
    if (moderationResults.profanityScore > 50) {
      reason = 'Inappropriate language detected';
    } else if (moderationResults.spamLikelihood?.score > 60) {
      reason = 'Suspected spam content';
    } else if (moderationResults.suspiciousContent?.count > 0) {
      reason = 'Suspicious content detected';
    }

    await pushNotificationService.sendToUser(userId, {
      title: 'Review Not Approved',
      body: `Your review was not approved due to: ${reason}`,
      data: {
        type: 'review_rejected',
        reason,
        moderationResults: {
          riskScore: moderationResults.riskScore
        }
      }
    });
  }

  /**
   * Notify admins of pending review
   */
  async notifyAdminsOfPendingReview(reviewId, riskScore) {
    // Get admin user IDs
    const admins = await db.query(`
      SELECT id FROM users WHERE role = 'admin'
    `);

    for (const admin of admins.rows) {
      await pushNotificationService.sendToUser(admin.id, {
        title: 'Review Requires Moderation',
        body: `Review #${reviewId} flagged for review (risk: ${riskScore})`,
        data: {
          type: 'admin_review_required',
          reviewId,
          riskScore
        }
      });
    }
  }
}

module.exports = new ReviewModerationService(); 