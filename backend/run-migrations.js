const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database connection
const db = new sqlite3.Database('./island-rides.db');

// Migration files to execute in order
const migrations = [
  '013_host_profile_enhancements.sql',
  '014_vehicle_documents_management.sql',
  '015_enhanced_identity_verification.sql',
  '016_enhanced_search_discovery.sql',
  '017_host_storefront_marketplace.sql'
];

// Function to execute a migration
function executeMigration(migrationFile) {
  return new Promise((resolve, reject) => {
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    
    console.log(`📄 Reading migration: ${migrationFile}`);
    
    fs.readFile(migrationPath, 'utf8', (err, sql) => {
      if (err) {
        console.error(`❌ Error reading migration file ${migrationFile}:`, err);
        return reject(err);
      }
      
      console.log(`🔄 Executing migration: ${migrationFile}`);
      
      // Split SQL statements by semicolon and execute them one by one
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      let completedStatements = 0;
      const totalStatements = statements.length;
      
      statements.forEach((statement, index) => {
        const trimmedStatement = statement.trim();
        if (trimmedStatement.length === 0) {
          completedStatements++;
          if (completedStatements === totalStatements) {
            console.log(`✅ Migration ${migrationFile} completed successfully`);
            resolve();
          }
          return;
        }
        
        db.run(trimmedStatement, function(err) {
          if (err) {
            console.error(`❌ Error executing statement ${index + 1} in ${migrationFile}:`, err);
            console.error(`Statement: ${trimmedStatement.substring(0, 200)}...`);
            reject(err);
          } else {
            completedStatements++;
            if (completedStatements === totalStatements) {
              console.log(`✅ Migration ${migrationFile} completed successfully`);
              resolve();
            }
          }
        });
      });
    });
  });
}

// Main migration runner
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    for (const migration of migrations) {
      await executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
    
    // Verify the database structure
    console.log('\n📊 Database structure verification:');
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
      if (err) {
        console.error('Error fetching tables:', err);
      } else {
        console.log('📋 Tables in database:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

// Run migrations
runMigrations();