const { pool } = require('../db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database with sample data...');
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Insert sample users
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type, is_verified)
      VALUES 
        ('admin@islandrides.com', $1, 'Admin', 'User', '+1-242-555-0100', 'admin', true),
        ('host@islandrides.com', $1, 'John', 'Host', '+1-242-555-0101', 'host', true),
        ('renter@islandrides.com', $1, 'Jane', 'Renter', '+1-242-555-0102', 'renter', true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Insert sample vehicle features
    await client.query(`
      INSERT INTO vehicle_features (name, description, icon) VALUES
        ('Air Conditioning', 'Climate control system', 'snowflake'),
        ('GPS Navigation', 'Built-in GPS system', 'map'),
        ('Bluetooth', 'Wireless connectivity', 'bluetooth'),
        ('USB Ports', 'USB charging ports', 'usb'),
        ('Sunroof', 'Panoramic sunroof', 'sun')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample vehicles
    await client.query(`
      INSERT INTO vehicles (
        owner_id, make, model, year, daily_rate, location, 
        vehicle_type, fuel_type, transmission_type, seating_capacity,
        description, available, verification_status
      ) VALUES
        (
          (SELECT id FROM users WHERE email = 'host@islandrides.com'),
          'Toyota', 'Camry', 2022, 75.00, 'Nassau', 
          'sedan', 'gasoline', 'automatic', 5,
          'Comfortable sedan perfect for exploring the island', true, 'verified'
        ),
        (
          (SELECT id FROM users WHERE email = 'host@islandrides.com'),
          'Jeep', 'Wrangler', 2023, 120.00, 'Paradise Island',
          'suv', 'gasoline', 'automatic', 5,
          'Perfect for beach adventures and off-road exploration', true, 'verified'
        ),
        (
          (SELECT id FROM users WHERE email = 'host@islandrides.com'),
          'Honda', 'Civic', 2021, 55.00, 'Freeport',
          'sedan', 'gasoline', 'automatic', 5,
          'Fuel-efficient and reliable for city driving', true, 'pending'
        )
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert vehicle features
    await client.query(`
      INSERT INTO vehicle_feature_assignments (vehicle_id, feature_id, is_included)
      SELECT v.id, f.id, true
      FROM vehicles v, vehicle_features f
      WHERE v.make = 'Toyota' AND f.name IN ('Air Conditioning', 'GPS Navigation', 'Bluetooth');
    `);
    
    await client.query(`
      INSERT INTO vehicle_feature_assignments (vehicle_id, feature_id, is_included)
      SELECT v.id, f.id, true
      FROM vehicles v, vehicle_features f
      WHERE v.make = 'Jeep' AND f.name IN ('Air Conditioning', 'Bluetooth', 'USB Ports', 'Sunroof');
    `);
    
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };