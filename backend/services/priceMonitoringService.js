const db = require('../db');
const favoritesService = require('./favoritesService');
const pushNotificationService = require('./pushNotificationService');

class PriceMonitoringService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 1000 * 60 * 60; // Check every hour by default
  }

  /**
   * Start the price monitoring cron system
   */
  start(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log('⏰ Price monitoring already running');
      return;
    }

    this.checkInterval = intervalMinutes * 60 * 1000;
    this.isRunning = true;

    console.log(`🚀 Starting price monitoring service (checking every ${intervalMinutes} minutes)`);
    
    // Run initial check
    this.checkPriceChanges();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkPriceChanges();
    }, this.checkInterval);
  }

  /**
   * Stop the price monitoring cron system
   */
  stop() {
    if (!this.isRunning) {
      console.log('⏰ Price monitoring not running');
      return;
    }

    console.log('🛑 Stopping price monitoring service');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheck,
      totalChecks: this.totalChecks || 0,
      priceChangesDetected: this.priceChangesDetected || 0
    };
  }

  /**
   * Main price checking function
   */
  async checkPriceChanges() {
    const startTime = Date.now();
    console.log('📊 Starting price change check...');

    try {
      this.lastCheck = new Date();
      this.totalChecks = (this.totalChecks || 0) + 1;

      // Step 1: Get all vehicles with their current prices
      const vehicles = await this.getAllVehiclesWithPrices();
      console.log(`🚗 Checking ${vehicles.length} vehicles for price changes`);

      // Step 2: Compare with historical prices and detect changes
      const priceChanges = await this.detectPriceChanges(vehicles);
      console.log(`💰 Detected ${priceChanges.length} price changes`);

      // Step 3: Store new price history for changed vehicles
      if (priceChanges.length > 0) {
        await this.storePriceHistory(priceChanges);
        this.priceChangesDetected = (this.priceChangesDetected || 0) + priceChanges.length;
      }

      // Step 4: Send notifications for price drops
      const priceDrops = priceChanges.filter(change => change.priceChange < 0);
      if (priceDrops.length > 0) {
        console.log(`📉 Found ${priceDrops.length} price drops, sending notifications`);
        await this.notifyPriceDrops(priceDrops);
      }

      // Step 5: Clean up old price history (keep last 100 entries per vehicle)
      await this.cleanupPriceHistory();

      const duration = Date.now() - startTime;
      console.log(`✅ Price check completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Error during price check:', error);
      
      // Send error notification to admin if configured
      if (process.env.ADMIN_USER_ID) {
        try {
          await pushNotificationService.sendToUser(
            parseInt(process.env.ADMIN_USER_ID),
            {
              title: 'Price Monitoring Error',
              body: `Price monitoring failed: ${error.message}`,
              data: { 
                type: 'system_error',
                error: error.message,
                timestamp: new Date().toISOString()
              }
            }
          );
        } catch (notificationError) {
          console.error('❌ Failed to send error notification:', notificationError);
        }
      }
    }
  }

  /**
   * Get all vehicles with their current prices
   */
  async getAllVehiclesWithPrices() {
    const result = await db.query(`
      SELECT 
        id, 
        make, 
        model, 
        year, 
        daily_rate,
        owner_id,
        location,
        available
      FROM vehicles 
      WHERE available = true
      ORDER BY id
    `);
    
    return result.rows;
  }

  /**
   * Detect price changes by comparing current prices with latest historical prices
   */
  async detectPriceChanges(vehicles) {
    const priceChanges = [];

    for (const vehicle of vehicles) {
      try {
        // Get the latest price from history
        const lastPriceResult = await db.query(`
          SELECT daily_rate, changed_at 
          FROM vehicle_price_history 
          WHERE vehicle_id = $1 
          ORDER BY changed_at DESC 
          LIMIT 1
        `, [vehicle.id]);

        const currentPrice = parseFloat(vehicle.daily_rate);
        let hasChanged = false;
        let oldPrice = null;

        if (lastPriceResult.rows.length === 0) {
          // No price history exists, this is the first time we're tracking this vehicle
          hasChanged = true;
          oldPrice = currentPrice; // Store current as baseline
        } else {
          // Compare with last known price
          oldPrice = parseFloat(lastPriceResult.rows[0].daily_rate);
          hasChanged = Math.abs(currentPrice - oldPrice) > 0.01; // Avoid floating point precision issues
        }

        if (hasChanged) {
          const priceChange = currentPrice - oldPrice;
          const percentageChange = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;

          priceChanges.push({
            vehicleId: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            location: vehicle.location,
            oldPrice: oldPrice,
            newPrice: currentPrice,
            priceChange: priceChange,
            percentageChange: percentageChange,
            changeType: priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'
          });
        }
      } catch (error) {
        console.error(`❌ Error checking price for vehicle ${vehicle.id}:`, error);
        continue;
      }
    }

    return priceChanges;
  }

  /**
   * Store price history for vehicles with price changes
   */
  async storePriceHistory(priceChanges) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const change of priceChanges) {
        await client.query(`
          INSERT INTO vehicle_price_history (vehicle_id, daily_rate, changed_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [change.vehicleId, change.newPrice]);
      }

      await client.query('COMMIT');
      console.log(`💾 Stored price history for ${priceChanges.length} vehicles`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send notifications for price drops to users who favorited the vehicles
   */
  async notifyPriceDrops(priceDrops) {
    let notificationsSent = 0;

    for (const drop of priceDrops) {
      try {
        // Get users who favorited this vehicle and want price notifications
        const usersResult = await db.query(`
          SELECT DISTINCT 
            f.user_id,
            u.first_name,
            u.last_name,
            u.email
          FROM favorites f
          JOIN users u ON f.user_id = u.id
          WHERE f.vehicle_id = $1 
            AND f.notify_price_drop = true
            AND u.id IN (
              SELECT user_id 
              FROM notification_preferences 
              WHERE price_alerts = true
            )
        `, [drop.vehicleId]);

        for (const user of usersResult.rows) {
          const notification = {
            title: '💰 Price Drop Alert!',
            body: `${drop.make} ${drop.model} is now $${drop.newPrice.toFixed(2)}/day (was $${drop.oldPrice.toFixed(2)})`,
            data: {
              type: 'price_drop',
              vehicleId: drop.vehicleId,
              oldPrice: drop.oldPrice,
              newPrice: drop.newPrice,
              priceChange: drop.priceChange,
              percentageChange: drop.percentageChange,
              make: drop.make,
              model: drop.model,
              year: drop.year,
              location: drop.location
            }
          };

          await pushNotificationService.sendToUser(user.user_id, notification);
          notificationsSent++;

          // Optional: Send email notification for significant price drops (>20%)
          if (Math.abs(drop.percentageChange) > 20) {
            console.log(`📧 Significant price drop (${drop.percentageChange.toFixed(1)}%) for ${drop.make} ${drop.model}, email notification could be sent here`);
          }
        }

        console.log(`📤 Sent ${usersResult.rows.length} notifications for ${drop.make} ${drop.model} price drop`);

      } catch (error) {
        console.error(`❌ Error sending notifications for vehicle ${drop.vehicleId}:`, error);
        continue;
      }
    }

    console.log(`📱 Total notifications sent: ${notificationsSent}`);
    return notificationsSent;
  }

  /**
   * Clean up old price history to prevent database bloat
   */
  async cleanupPriceHistory() {
    try {
      const result = await db.query(`
        DELETE FROM vehicle_price_history 
        WHERE id IN (
          SELECT id 
          FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY changed_at DESC) as rn
            FROM vehicle_price_history
          ) ranked
          WHERE rn > 100
        )
      `);

      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} old price history records`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up price history:', error);
    }
  }

  /**
   * Get price history for a specific vehicle
   */
  async getVehiclePriceHistory(vehicleId, limit = 30) {
    const result = await db.query(`
      SELECT daily_rate, changed_at
      FROM vehicle_price_history
      WHERE vehicle_id = $1
      ORDER BY changed_at DESC
      LIMIT $2
    `, [vehicleId, limit]);

    return result.rows;
  }

  /**
   * Get price statistics for a vehicle
   */
  async getVehiclePriceStats(vehicleId) {
    const result = await db.query(`
      SELECT 
        MIN(daily_rate) as min_price,
        MAX(daily_rate) as max_price,
        AVG(daily_rate)::DECIMAL(10,2) as avg_price,
        COUNT(*) as price_changes,
        MAX(changed_at) as last_change
      FROM vehicle_price_history
      WHERE vehicle_id = $1
    `, [vehicleId]);

    return result.rows[0] || {
      min_price: null,
      max_price: null,
      avg_price: null,
      price_changes: 0,
      last_change: null
    };
  }

  /**
   * Force a price check for testing
   */
  async forceCheck() {
    console.log('🔄 Forcing price check...');
    await this.checkPriceChanges();
  }

  /**
   * Update monitoring preferences for a user
   */
  async updateUserPriceNotifications(userId, vehicleId, enabled) {
    const result = await db.query(`
      UPDATE favorites 
      SET notify_price_drop = $3
      WHERE user_id = $1 AND vehicle_id = $2
      RETURNING *
    `, [userId, vehicleId, enabled]);

    return result.rows[0];
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats() {
    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT vehicle_id) as monitored_vehicles,
        COUNT(*) as total_price_records,
        MIN(changed_at) as oldest_record,
        MAX(changed_at) as newest_record
      FROM vehicle_price_history
    `);

    const userStats = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_with_favorites,
        COUNT(*) as total_favorites,
        COUNT(CASE WHEN notify_price_drop = true THEN 1 END) as favorites_with_alerts
      FROM favorites
    `);

    return {
      ...stats.rows[0],
      ...userStats.rows[0],
      service_status: this.getStatus()
    };
  }
}

module.exports = new PriceMonitoringService(); 