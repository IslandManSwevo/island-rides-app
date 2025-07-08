const { query } = require('../db');

class OwnerDashboardService {
  constructor() {
    this.platformFeeRate = 0.15; // 15% platform fee
  }

  /**
   * Get comprehensive dashboard overview for an owner
   */
  async getDashboardOverview(ownerId, timeframe = '30') {
    try {
      const overview = await this.getOwnerSummary(ownerId, timeframe);
      const revenueData = await this.getRevenueAnalytics(ownerId, timeframe);
      const bookingData = await this.getBookingAnalytics(ownerId, timeframe);
      const vehicleData = await this.getVehiclePerformance(ownerId);
      const goals = await this.getOwnerGoals(ownerId);

      return {
        overview,
        revenue: revenueData,
        bookings: bookingData,
        vehicles: vehicleData,
        goals,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get owner summary statistics
   */
  async getOwnerSummary(ownerId, days = '30') {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT v.id) as total_vehicles,
          COUNT(DISTINCT CASE WHEN v.available = 1 THEN v.id END) as active_vehicles,
          
          -- Revenue metrics
          COALESCE(SUM(CASE 
            WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-${days} days') 
            THEN b.total_amount 
          END), 0) as gross_revenue,
          
          COALESCE(SUM(CASE 
            WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-${days} days') 
            THEN b.total_amount * (1 - ?)
          END), 0) as net_revenue,
          
          -- Booking metrics
          COUNT(DISTINCT CASE 
            WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-${days} days') 
            THEN b.id 
          END) as total_bookings,
          
          COUNT(DISTINCT CASE 
            WHEN b.status = 'pending' 
            THEN b.id 
          END) as pending_bookings,
          
          -- Performance metrics
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews,
          
          -- Recent activity
          COUNT(DISTINCT CASE 
            WHEN b.created_at >= date('now', '-7 days') 
            THEN b.id 
          END) as new_bookings_this_week,
          
          COUNT(DISTINCT CASE 
            WHEN r.created_at >= date('now', '-7 days') 
            THEN r.id 
          END) as new_reviews_this_week
          
        FROM users u
        LEFT JOIN vehicles v ON u.id = v.owner_id
        LEFT JOIN bookings b ON v.id = b.vehicle_id
        LEFT JOIN reviews r ON b.id = r.booking_id
        WHERE u.id = ?
      `;

      const result = await query(sql, [this.platformFeeRate, ownerId]);
      const summary = result[0] || {};

      // Calculate occupancy rate
      const occupancyData = await this.calculateOccupancyRate(ownerId, days);
      summary.occupancy_rate = occupancyData.occupancy_rate;
      summary.total_available_days = occupancyData.total_available_days;
      summary.total_booked_days = occupancyData.total_booked_days;

      return summary;
    } catch (error) {
      console.error('Error getting owner summary:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics with time series data
   */
  async getRevenueAnalytics(ownerId, days = '30') {
    try {
      // Get daily revenue data
      const dailyRevenueSql = `
        SELECT 
          DATE(b.start_date) as date,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as gross_revenue,
          SUM(b.total_amount * (1 - ?)) as net_revenue,
          SUM(b.total_amount * ?) as platform_fees
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE v.owner_id = ? 
          AND b.status = 'confirmed'
          AND b.start_date >= date('now', '-${days} days')
        GROUP BY DATE(b.start_date)
        ORDER BY date DESC
      `;

      const dailyData = await query(dailyRevenueSql, [this.platformFeeRate, this.platformFeeRate, ownerId]);

      // Get revenue breakdown by vehicle
      const vehicleRevenueSql = `
        SELECT 
          v.id,
          v.make,
          v.model,
          v.year,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as gross_revenue,
          SUM(b.total_amount * (1 - ?)) as net_revenue,
          AVG(b.total_amount) as avg_booking_value
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id 
          AND b.status = 'confirmed'
          AND b.start_date >= date('now', '-${days} days')
        WHERE v.owner_id = ?
        GROUP BY v.id, v.make, v.model, v.year
        ORDER BY gross_revenue DESC
      `;

      const vehicleRevenue = await query(vehicleRevenueSql, [this.platformFeeRate, ownerId]);

      return {
        daily_data: dailyData,
        vehicle_breakdown: vehicleRevenue,
        summary: {
          total_gross: dailyData.reduce((sum, day) => sum + (day.gross_revenue || 0), 0),
          total_net: dailyData.reduce((sum, day) => sum + (day.net_revenue || 0), 0),
          total_fees: dailyData.reduce((sum, day) => sum + (day.platform_fees || 0), 0),
          avg_daily_revenue: dailyData.length > 0 ? 
            dailyData.reduce((sum, day) => sum + (day.gross_revenue || 0), 0) / dailyData.length : 0
        }
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get booking analytics and trends
   */
  async getBookingAnalytics(ownerId, days = '30') {
    try {
      // Booking status distribution
      const statusSql = `
        SELECT 
          b.status,
          COUNT(b.id) as count,
          SUM(b.total_amount) as total_value
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE v.owner_id = ? AND b.created_at >= date('now', '-${days} days')
        GROUP BY b.status
      `;

      const statusData = await query(statusSql, [ownerId]);

      // Booking trends by day of week
      const dayTrendsSql = `
        SELECT 
          CASE CAST(strftime('%w', b.start_date) AS INTEGER)
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
          END as day_of_week,
          COUNT(b.id) as bookings,
          AVG(b.total_amount) as avg_value
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE v.owner_id = ? 
          AND b.status = 'confirmed'
          AND b.start_date >= date('now', '-${days} days')
        GROUP BY strftime('%w', b.start_date)
        ORDER BY CAST(strftime('%w', b.start_date) AS INTEGER)
      `;

      const dayTrends = await query(dayTrendsSql, [ownerId]);

      // Booking duration analysis
      const durationSql = `
        SELECT 
          CASE 
            WHEN julianday(b.end_date) - julianday(b.start_date) <= 1 THEN '1 day'
            WHEN julianday(b.end_date) - julianday(b.start_date) <= 3 THEN '2-3 days'
            WHEN julianday(b.end_date) - julianday(b.start_date) <= 7 THEN '4-7 days'
            WHEN julianday(b.end_date) - julianday(b.start_date) <= 14 THEN '1-2 weeks'
            ELSE '2+ weeks'
          END as duration_category,
          COUNT(b.id) as bookings,
          AVG(b.total_amount) as avg_value
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE v.owner_id = ? 
          AND b.status = 'confirmed'
          AND b.start_date >= date('now', '-${days} days')
        GROUP BY duration_category
      `;

      const durationData = await query(durationSql, [ownerId]);

      return {
        status_distribution: statusData,
        day_trends: dayTrends,
        duration_analysis: durationData
      };
    } catch (error) {
      console.error('Error getting booking analytics:', error);
      throw error;
    }
  }

  /**
   * Get individual vehicle performance metrics
   */
  async getVehiclePerformance(ownerId) {
    try {
      const sql = `
        SELECT 
          v.*,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount END), 0) as total_revenue,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as review_count,
          
          -- Calculate occupancy rate for each vehicle
          COALESCE(
            (COUNT(DISTINCT CASE 
              WHEN b.status = 'confirmed' 
              THEN DATE(b.start_date, '+' || 
                (julianday(b.end_date) - julianday(b.start_date)) || ' days')
            END) * 100.0) / 
            NULLIF(julianday('now') - julianday(v.created_at), 0), 0
          ) as occupancy_rate,
          
          -- Recent performance (last 30 days)
          COUNT(DISTINCT CASE 
            WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-30 days') 
            THEN b.id 
          END) as recent_bookings,
          
          COALESCE(SUM(CASE 
            WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-30 days') 
            THEN b.total_amount 
          END), 0) as recent_revenue
          
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id
        LEFT JOIN reviews r ON b.id = r.booking_id
        WHERE v.owner_id = ?
        GROUP BY v.id
        ORDER BY total_revenue DESC
      `;

      const vehicles = await query(sql, [ownerId]);

      // Get maintenance and condition data for each vehicle
      for (let vehicle of vehicles) {
        const maintenanceSql = `
          SELECT COUNT(*) as maintenance_count,
                 MAX(completed_date) as last_maintenance
          FROM vehicle_maintenance 
          WHERE vehicle_id = ? AND completed_date IS NOT NULL
        `;
        
        const maintenanceData = await query(maintenanceSql, [vehicle.id]);
        vehicle.maintenance_info = maintenanceData[0] || { maintenance_count: 0, last_maintenance: null };
      }

      return vehicles;
    } catch (error) {
      console.error('Error getting vehicle performance:', error);
      throw error;
    }
  }

  /**
   * Calculate occupancy rate for owner's vehicles
   */
  async calculateOccupancyRate(ownerId, days = '30') {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT v.id) * ${days} as total_available_days,
          COUNT(DISTINCT 
            CASE WHEN b.status = 'confirmed' 
            THEN DATE(b.start_date, '+' || (julianday(b.end_date) - julianday(b.start_date)) || ' days')
            END
          ) as total_booked_days
        FROM vehicles v
        LEFT JOIN bookings b ON v.id = b.vehicle_id 
          AND b.start_date >= date('now', '-${days} days')
        WHERE v.owner_id = ? AND v.available = 1
      `;

      const result = await query(sql, [ownerId]);
      const data = result[0] || { total_available_days: 0, total_booked_days: 0 };
      
      data.occupancy_rate = data.total_available_days > 0 ? 
        (data.total_booked_days / data.total_available_days) * 100 : 0;

      return data;
    } catch (error) {
      console.error('Error calculating occupancy rate:', error);
      throw error;
    }
  }

  /**
   * Get owner goals and progress
   */
  async getOwnerGoals(ownerId) {
    try {
      const sql = `
        SELECT * FROM owner_goals 
        WHERE owner_id = ? AND status = 'active'
        ORDER BY created_at DESC
      `;

      const goals = await query(sql, [ownerId]);

      // Calculate current progress for each goal
      for (let goal of goals) {
        const currentValue = await this.calculateGoalProgress(ownerId, goal);
        goal.current_value = currentValue;
        goal.progress_percentage = goal.target_value > 0 ? 
          Math.min((currentValue / goal.target_value) * 100, 100) : 0;
      }

      return goals;
    } catch (error) {
      console.error('Error getting owner goals:', error);
      throw error;
    }
  }

  /**
   * Calculate current progress for a specific goal
   */
  async calculateGoalProgress(ownerId, goal) {
    try {
      let sql, timeframe;

      // Determine timeframe based on goal period
      switch (goal.target_period) {
        case 'monthly':
          timeframe = "date('now', 'start of month')";
          break;
        case 'quarterly':
          timeframe = "date('now', '-3 months')";
          break;
        case 'yearly':
          timeframe = "date('now', 'start of year')";
          break;
        default:
          timeframe = "date('now', '-30 days')";
      }

      switch (goal.goal_type) {
        case 'monthly_revenue':
          sql = `
            SELECT COALESCE(SUM(b.total_amount * (1 - ?)), 0) as current_value
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE v.owner_id = ? AND b.status = 'confirmed' 
              AND b.start_date >= ${timeframe}
          `;
          break;

        case 'occupancy_rate':
          const occupancyData = await this.calculateOccupancyRate(ownerId, 30);
          return occupancyData.occupancy_rate;

        case 'rating_target':
          sql = `
            SELECT COALESCE(AVG(r.rating), 0) as current_value
            FROM reviews r
            JOIN bookings b ON r.booking_id = b.id
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE v.owner_id = ? AND r.created_at >= ${timeframe}
          `;
          break;

        case 'booking_count':
          sql = `
            SELECT COUNT(b.id) as current_value
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            WHERE v.owner_id = ? AND b.status = 'confirmed' 
              AND b.start_date >= ${timeframe}
          `;
          break;

        default:
          return 0;
      }

      if (sql) {
        const params = goal.goal_type === 'monthly_revenue' ? 
          [this.platformFeeRate, ownerId] : [ownerId];
        const result = await query(sql, params);
        return result[0]?.current_value || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return 0;
    }
  }

  /**
   * Create a new goal for an owner
   */
  async createOwnerGoal(ownerId, goalData) {
    try {
      const sql = `
        INSERT INTO owner_goals 
        (owner_id, goal_type, target_value, target_period, target_date)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await query(sql, [
        ownerId,
        goalData.goal_type,
        goalData.target_value,
        goalData.target_period,
        goalData.target_date || null
      ]);

      return { id: result.lastID, ...goalData };
    } catch (error) {
      console.error('Error creating owner goal:', error);
      throw error;
    }
  }

  /**
   * Get financial reports and payout information
   */
  async getFinancialReports(ownerId, startDate, endDate) {
    try {
      // Get earnings breakdown
      const earningsSql = `
        SELECT 
          DATE(b.start_date) as date,
          SUM(b.total_amount) as gross_revenue,
          SUM(b.total_amount * ?) as platform_fees,
          SUM(b.total_amount * (1 - ?)) as net_earnings,
          COUNT(b.id) as booking_count
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        WHERE v.owner_id = ? 
          AND b.status = 'confirmed'
          AND DATE(b.start_date) BETWEEN ? AND ?
        GROUP BY DATE(b.start_date)
        ORDER BY date DESC
      `;

      const earnings = await query(earningsSql, [
        this.platformFeeRate, this.platformFeeRate, ownerId, startDate, endDate
      ]);

      // Get expense breakdown
      const expensesSql = `
        SELECT 
          expense_type,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM vehicle_expenses
        WHERE owner_id = ? 
          AND expense_date BETWEEN ? AND ?
        GROUP BY expense_type
        ORDER BY total_amount DESC
      `;

      const expenses = await query(expensesSql, [ownerId, startDate, endDate]);

      // Calculate totals
      const totalGross = earnings.reduce((sum, day) => sum + day.gross_revenue, 0);
      const totalFees = earnings.reduce((sum, day) => sum + day.platform_fees, 0);
      const totalNet = earnings.reduce((sum, day) => sum + day.net_earnings, 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total_amount, 0);

      return {
        period: { start_date: startDate, end_date: endDate },
        earnings: {
          daily_breakdown: earnings,
          summary: {
            gross_revenue: totalGross,
            platform_fees: totalFees,
            net_earnings: totalNet,
            profit_after_expenses: totalNet - totalExpenses
          }
        },
        expenses: {
          by_category: expenses,
          total: totalExpenses
        }
      };
    } catch (error) {
      console.error('Error getting financial reports:', error);
      throw error;
    }
  }

  /**
   * Add vehicle expense
   */
  async addVehicleExpense(ownerId, expenseData) {
    try {
      const sql = `
        INSERT INTO vehicle_expenses 
        (vehicle_id, owner_id, expense_type, amount, description, expense_date, 
         receipt_url, tax_deductible, category, subcategory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await query(sql, [
        expenseData.vehicle_id,
        ownerId,
        expenseData.expense_type,
        expenseData.amount,
        expenseData.description || null,
        expenseData.expense_date,
        expenseData.receipt_url || null,
        expenseData.tax_deductible || false,
        expenseData.category || null,
        expenseData.subcategory || null
      ]);

      return { id: result.lastID, ...expenseData };
    } catch (error) {
      console.error('Error adding vehicle expense:', error);
      throw error;
    }
  }
}

module.exports = new OwnerDashboardService(); 