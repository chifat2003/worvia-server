/**
 * Phase 2 Database Migration Script
 * Adds connections, followers, mentions, and notifications tables
 */

const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.NEONDB_URL);

async function migratePhase2() {
  try {
    console.log("🔄 Starting Phase 2 migration...\n");

    // Create connections table
    console.log("Creating 'connections' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS connections (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP NOT NULL DEFAULT now(),
        responded_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(sender_id, receiver_id)
      )
    `;
    console.log("✓ connections table created\n");

    // Create followers table
    console.log("Creating 'followers' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followed_at TIMESTAMP NOT NULL DEFAULT now(),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(follower_id, following_id)
      )
    `;
    console.log("✓ followers table created\n");

    // Create mentions table
    console.log("Creating 'mentions' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS mentions (
        id SERIAL PRIMARY KEY,
        mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentioned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        context VARCHAR(50) NOT NULL,
        context_id INTEGER NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ mentions table created\n");

    // Create notifications table
    console.log("Creating 'notifications' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSON DEFAULT '{}',
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ notifications table created\n");

    // Verify all tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `;

    console.log("📊 Database tables:");
    tables.forEach((t) => console.log(`   - ${t.table_name}`));

    console.log("\n✅ Phase 2 migration complete!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
}

migratePhase2();
