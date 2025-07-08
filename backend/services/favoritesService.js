const db = require('../db');
const pushNotificationService = require('./pushNotificationService');

class FavoritesService {
  async addFavorite(userId, vehicleId, notes = null) {
    try {
      const result = await db.query(
        `INSERT INTO favorites (user_id, vehicle_id, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, vehicle_id) DO NOTHING
         RETURNING *`,
        [userId, vehicleId, notes]
      );

      if (result.rows.length === 0) {
        return { alreadyFavorited: true };
      }

      await this.addToDefaultCollection(userId, result.rows[0].id);
      return { favorite: result.rows[0], alreadyFavorited: false };
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async removeFavorite(userId, vehicleId) {
    const result = await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND vehicle_id = $2 RETURNING *',
      [userId, vehicleId]
    );
    return { removed: result.rows.length > 0 };
  }

  async getUserFavorites(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT 
        f.*,
        v.*,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating)::DECIMAL(2,1) as average_rating
      FROM favorites f
      JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN reviews r ON v.id = r.vehicle_id
      WHERE f.user_id = $1
      GROUP BY f.id, v.id
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
      [userId]
    );

    return {
      favorites: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  async isFavorited(userId, vehicleId) {
    const result = await db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND vehicle_id = $2',
      [userId, vehicleId]
    );
    return result.rows.length > 0;
  }

  async addToDefaultCollection(userId, favoriteId) {
    let collection = await db.query(
      'SELECT id FROM favorite_collections WHERE user_id = $1 AND is_default = true',
      [userId]
    );

    if (collection.rows.length === 0) {
      collection = await db.query(
        `INSERT INTO favorite_collections (user_id, name, is_default)
         VALUES ($1, 'My Favorites', true)
         RETURNING id`,
        [userId]
      );
    }

    await db.query(
      'INSERT INTO collection_items (collection_id, favorite_id) VALUES ($1, $2)',
      [collection.rows[0].id, favoriteId]
    );
  }

  async compareFavorites(userId, vehicleIds) {
    if (vehicleIds.length > 3) {
      throw new Error('Can compare maximum 3 vehicles');
    }

    const vehicles = await db.query(
      `SELECT 
        v.*,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating)::DECIMAL(2,1) as average_rating
      FROM vehicles v
      LEFT JOIN reviews r ON v.id = r.vehicle_id
      WHERE v.id = ANY($1)
      GROUP BY v.id`,
      [vehicleIds]
    );

    return vehicles.rows;
  }

  async checkPriceDrops() {
    // Find vehicles with price changes
    const priceChanges = await db.query(
      `SELECT DISTINCT v.id, v.daily_rate, vph.daily_rate as old_rate, v.make, v.model
       FROM vehicles v
       JOIN vehicle_price_history vph ON v.id = vph.vehicle_id
       WHERE vph.changed_at = (
         SELECT MAX(changed_at) 
         FROM vehicle_price_history 
         WHERE vehicle_id = v.id
       )
       AND v.daily_rate < vph.daily_rate`
    );

    // Notify users who have favorited these vehicles
    for (const vehicle of priceChanges.rows) {
      const users = await db.query(
        `SELECT DISTINCT f.user_id
         FROM favorites f
         WHERE f.vehicle_id = $1 AND f.notify_price_drop = true`,
        [vehicle.id]
      );

      for (const user of users.rows) {
        await pushNotificationService.sendPriceAlert(
          user.user_id,
          {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model
          },
          vehicle.old_rate,
          vehicle.daily_rate
        );
      }
    }
  }

  async createCollection(userId, name, description) {
    const result = await db.query(
      `INSERT INTO favorite_collections (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, description]
    );
    return result.rows[0];
  }

  async getCollections(userId) {
    const result = await db.query(
      `SELECT 
        fc.*,
        COUNT(ci.favorite_id) as item_count
      FROM favorite_collections fc
      LEFT JOIN collection_items ci ON fc.id = ci.collection_id
      WHERE fc.user_id = $1
      GROUP BY fc.id
      ORDER BY fc.is_default DESC, fc.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = new FavoritesService(); 