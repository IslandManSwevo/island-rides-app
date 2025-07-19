const { Database } = require('sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'island-rides.db'));

class EnhancedSearchService {
  /**
   * Perform enhanced vehicle search with island awareness
   */
  async searchVehicles(searchParams) {
    try {
      const {
        island,
        query,
        vehicle_type,
        price_min,
        price_max,
        seating_capacity,
        features,
        condition_rating,
        availability_start,
        availability_end,
        sort_by = 'relevance',
        page = 1,
        limit = 20,
        user_id
      } = searchParams;

      // Log search session
      const sessionId = await this.logSearchSession(searchParams, user_id);

      // Build search query
      let searchQuery = `
        SELECT DISTINCT vsi.*, v.photos, v.features as vehicle_features,
               u.first_name, u.last_name, u.profile_image_url,
               u.host_rating, u.superhost_status,
               (vsi.base_score + vsi.popularity_score + vsi.rating_score + vsi.availability_score) as total_score
        FROM vehicle_search_index vsi
        JOIN vehicles v ON vsi.vehicle_id = v.id
        JOIN users u ON v.owner_id = u.id
        WHERE vsi.is_active = 1
      `;

      const params = [];
      let paramIndex = 1;

      // Island filter (most important)
      if (island) {
        searchQuery += ` AND vsi.island = ?`;
        params.push(island);
      }

      // Full-text search
      if (query) {
        searchQuery += ` AND vsi.vehicle_id IN (
          SELECT docid FROM vehicle_search_fts WHERE vehicle_search_fts MATCH ?
        )`;
        params.push(query);
      }

      // Vehicle type filter
      if (vehicle_type) {
        searchQuery += ` AND vsi.vehicle_type = ?`;
        params.push(vehicle_type);
      }

      // Price range filter
      if (price_min) {
        searchQuery += ` AND vsi.daily_rate >= ?`;
        params.push(price_min);
      }
      if (price_max) {
        searchQuery += ` AND vsi.daily_rate <= ?`;
        params.push(price_max);
      }

      // Seating capacity filter
      if (seating_capacity) {
        searchQuery += ` AND vsi.seating_capacity >= ?`;
        params.push(seating_capacity);
      }

      // Features filter
      if (features && features.length > 0) {
        const featureConditions = features.map(() => `vsi.features_array LIKE ?`).join(' AND ');
        searchQuery += ` AND (${featureConditions})`;
        features.forEach(feature => {
          params.push(`%${feature}%`);
        });
      }

      // Condition rating filter
      if (condition_rating) {
        searchQuery += ` AND vsi.condition_rating >= ?`;
        params.push(condition_rating);
      }

      // Availability filter
      if (availability_start && availability_end) {
        searchQuery += ` AND vsi.vehicle_id NOT IN (
          SELECT vehicle_id FROM bookings 
          WHERE status IN ('confirmed', 'pending') 
          AND (start_date <= ? AND end_date >= ?)
        )`;
        params.push(availability_end, availability_start);
      }

      // Sorting
      switch (sort_by) {
        case 'price_low':
          searchQuery += ` ORDER BY vsi.daily_rate ASC`;
          break;
        case 'price_high':
          searchQuery += ` ORDER BY vsi.daily_rate DESC`;
          break;
        case 'rating':
          searchQuery += ` ORDER BY vsi.rating_score DESC, vsi.total_reviews DESC`;
          break;
        case 'newest':
          searchQuery += ` ORDER BY vsi.created_at DESC`;
          break;
        case 'popularity':
          searchQuery += ` ORDER BY vsi.popularity_score DESC`;
          break;
        default: // relevance
          searchQuery += ` ORDER BY total_score DESC, vsi.rating_score DESC`;
      }

      // Pagination
      const offset = (page - 1) * limit;
      searchQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.allQuery(searchQuery, params);

      // Parse JSON fields
      const processedResults = results.map(result => ({
        ...result,
        photos: result.photos ? JSON.parse(result.photos) : [],
        vehicle_features: result.vehicle_features ? JSON.parse(result.vehicle_features) : [],
        features_array: result.features_array ? JSON.parse(result.features_array) : []
      }));

      // Update search session with results
      await this.updateSearchSession(sessionId, processedResults.length);

      return {
        results: processedResults,
        total: processedResults.length,
        page,
        limit,
        session_id: sessionId
      };
    } catch (error) {
      console.error('Error in enhanced search:', error);
      throw error;
    }
  }

  /**
   * Get search recommendations for a user
   */
  async getSearchRecommendations(userId, island = null, limit = 10) {
    try {
      let query = `
        SELECT sr.*, vsi.make, vsi.model, vsi.year, vsi.daily_rate, vsi.rating_score, vsi.total_reviews
        FROM search_recommendations sr
        JOIN vehicle_search_index vsi ON sr.vehicle_id = vsi.vehicle_id
        WHERE sr.user_id = ? AND sr.is_active = 1
      `;
      const params = [userId];

      if (island) {
        query += ` AND vsi.island = ?`;
        params.push(island);
      }

      query += ` ORDER BY sr.recommendation_score DESC, sr.created_at DESC LIMIT ?`;
      params.push(limit);

      const results = await this.allQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error fetching search recommendations:', error);
      throw error;
    }
  }

  /**
   * Save a search for a user
   */
  async saveSearch(userId, searchData) {
    try {
      const query = `
        INSERT INTO saved_searches (
          user_id, search_name, search_criteria, island, notification_enabled,
          last_result_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const result = await this.runQuery(query, [
        userId,
        searchData.search_name,
        JSON.stringify(searchData.search_criteria),
        searchData.island,
        searchData.notification_enabled || 0,
        searchData.last_result_count || 0
      ]);

      return { id: result.lastID };
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId) {
    try {
      const query = `
        SELECT * FROM saved_searches 
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `;

      const results = await this.allQuery(query, [userId]);
      return results.map(search => ({
        ...search,
        search_criteria: JSON.parse(search.search_criteria)
      }));
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      throw error;
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(island = null, limit = 10) {
    try {
      let query = `
        SELECT * FROM popular_searches 
        WHERE is_active = 1
      `;
      const params = [];

      if (island) {
        query += ` AND island = ?`;
        params.push(island);
      }

      query += ` ORDER BY search_frequency DESC, last_searched DESC LIMIT ?`;
      params.push(limit);

      const results = await this.allQuery(query, params);
      return results.map(search => ({
        ...search,
        search_criteria: JSON.parse(search.search_criteria)
      }));
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      throw error;
    }
  }

  /**
   * Get search filters configuration
   */
  async getSearchFilters(island = null) {
    try {
      let query = `
        SELECT * FROM search_filters 
        WHERE is_active = 1
      `;
      const params = [];

      if (island) {
        query += ` AND (applies_to_islands IS NULL OR JSON_EXTRACT(applies_to_islands, '$') LIKE ?)`;
        params.push(`%${island}%`);
      }

      query += ` ORDER BY category, display_order`;

      const results = await this.allQuery(query, params);
      return results.map(filter => ({
        ...filter,
        filter_options: JSON.parse(filter.filter_options),
        applies_to_islands: filter.applies_to_islands ? JSON.parse(filter.applies_to_islands) : null,
        validation_rules: filter.validation_rules ? JSON.parse(filter.validation_rules) : {}
      }));
    } catch (error) {
      console.error('Error fetching search filters:', error);
      throw error;
    }
  }

  /**
   * Update search index for a vehicle
   */
  async updateVehicleSearchIndex(vehicleId) {
    try {
      // Get vehicle data
      const vehicleQuery = `
        SELECT v.*, u.first_name, u.last_name, u.host_rating, u.superhost_status,
               AVG(r.rating) as avg_rating, COUNT(r.id) as review_count,
               COUNT(b.id) as booking_count
        FROM vehicles v
        JOIN users u ON v.owner_id = u.id
        LEFT JOIN reviews r ON v.id = r.vehicle_id
        LEFT JOIN bookings b ON v.id = b.vehicle_id
        WHERE v.id = ?
        GROUP BY v.id
      `;

      const vehicle = await this.getQuery(vehicleQuery, [vehicleId]);
      if (!vehicle) return;

      // Calculate scores
      const baseScore = this.calculateBaseScore(vehicle);
      const popularityScore = this.calculatePopularityScore(vehicle.booking_count, vehicle.view_count);
      const ratingScore = this.calculateRatingScore(vehicle.avg_rating, vehicle.review_count);
      const availabilityScore = this.calculateAvailabilityScore(vehicle.available);

      // Update search index
      const updateQuery = `
        INSERT INTO vehicle_search_index (
          vehicle_id, make, model, year, vehicle_type, daily_rate, seating_capacity,
          island, location, features_array, condition_rating, owner_id, owner_name,
          host_rating, superhost_status, total_reviews, average_rating, 
          base_score, popularity_score, rating_score, availability_score,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(vehicle_id) DO UPDATE SET
          make = excluded.make,
          model = excluded.model,
          year = excluded.year,
          vehicle_type = excluded.vehicle_type,
          daily_rate = excluded.daily_rate,
          seating_capacity = excluded.seating_capacity,
          island = excluded.island,
          location = excluded.location,
          features_array = excluded.features_array,
          condition_rating = excluded.condition_rating,
          owner_name = excluded.owner_name,
          host_rating = excluded.host_rating,
          superhost_status = excluded.superhost_status,
          total_reviews = excluded.total_reviews,
          average_rating = excluded.average_rating,
          base_score = excluded.base_score,
          popularity_score = excluded.popularity_score,
          rating_score = excluded.rating_score,
          availability_score = excluded.availability_score,
          is_active = excluded.is_active,
          updated_at = CURRENT_TIMESTAMP
      `;

      await this.runQuery(updateQuery, [
        vehicleId,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.vehicle_type,
        vehicle.daily_rate,
        vehicle.seating_capacity,
        vehicle.island,
        vehicle.location,
        vehicle.features ? JSON.stringify(vehicle.features) : '[]',
        vehicle.condition_rating,
        vehicle.owner_id,
        `${vehicle.first_name} ${vehicle.last_name}`,
        vehicle.host_rating,
        vehicle.superhost_status,
        vehicle.review_count,
        vehicle.avg_rating,
        baseScore,
        popularityScore,
        ratingScore,
        availabilityScore,
        vehicle.available ? 1 : 0
      ]);

      // Update FTS index
      const ftsContent = `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.vehicle_type} ${vehicle.location} ${vehicle.description || ''}`;
      await this.runQuery(`
        INSERT INTO vehicle_search_fts (docid, content) VALUES (?, ?)
        ON CONFLICT(docid) DO UPDATE SET content = excluded.content
      `, [vehicleId, ftsContent]);

    } catch (error) {
      console.error('Error updating vehicle search index:', error);
      throw error;
    }
  }

  /**
   * Log search session
   */
  async logSearchSession(searchParams, userId) {
    try {
      const query = `
        INSERT INTO search_sessions (
          user_id, search_criteria, island, session_start, created_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const result = await this.runQuery(query, [
        userId,
        JSON.stringify(searchParams),
        searchParams.island
      ]);

      return result.lastID;
    } catch (error) {
      console.error('Error logging search session:', error);
      return null;
    }
  }

  /**
   * Update search session with results
   */
  async updateSearchSession(sessionId, resultCount) {
    try {
      if (!sessionId) return;

      const query = `
        UPDATE search_sessions 
        SET result_count = ?, session_end = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await this.runQuery(query, [resultCount, sessionId]);
    } catch (error) {
      console.error('Error updating search session:', error);
    }
  }

  // Scoring algorithms
  calculateBaseScore(vehicle) {
    let score = 50; // Base score
    
    // Adjust based on vehicle condition
    if (vehicle.condition_rating) {
      score += (vehicle.condition_rating - 3) * 10;
    }
    
    // Adjust based on vehicle age
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicle.year;
    score -= vehicleAge * 2;
    
    // Adjust based on features
    if (vehicle.features) {
      const features = JSON.parse(vehicle.features);
      score += features.length * 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  calculatePopularityScore(bookingCount, viewCount) {
    const bookingWeight = bookingCount * 10;
    const viewWeight = (viewCount || 0) * 0.5;
    return Math.min(100, bookingWeight + viewWeight);
  }

  calculateRatingScore(avgRating, reviewCount) {
    if (!avgRating || !reviewCount) return 0;
    
    const ratingScore = (avgRating - 3) * 25; // Scale 1-5 to 0-100
    const reviewBonus = Math.min(20, reviewCount * 2); // Bonus for more reviews
    
    return Math.max(0, Math.min(100, ratingScore + reviewBonus));
  }

  calculateAvailabilityScore(isAvailable) {
    return isAvailable ? 100 : 0;
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

module.exports = new EnhancedSearchService();