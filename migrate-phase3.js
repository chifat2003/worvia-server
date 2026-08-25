/**
 * Phase 3 Database Migration Script
 * Adds posts, comments, likes, hashtags, and trends tables
 */

const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.NEONDB_URL);

async function migratePhase3() {
  try {
    console.log("🔄 Starting Phase 3 migration...\n");

    // Create posts table
    console.log("Creating 'posts' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        content_html TEXT,
        image VARCHAR(500),
        visibility VARCHAR(20) NOT NULL DEFAULT 'public',
        like_count INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        share_count INTEGER NOT NULL DEFAULT 0,
        engagement_score INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ posts table created\n");

    // Create comments table
    console.log("Creating 'comments' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_comment_id INTEGER,
        content TEXT NOT NULL,
        content_html TEXT,
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ comments table created\n");

    // Create likes table
    console.log("Creating 'likes' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(user_id, post_id, comment_id)
      )
    `;
    console.log("✓ likes table created\n");

    // Create hashtags table
    console.log("Creating 'hashtags' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS hashtags (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(100) NOT NULL UNIQUE,
        usage_count INTEGER NOT NULL DEFAULT 0,
        last_used_at TIMESTAMP NOT NULL DEFAULT now(),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ hashtags table created\n");

    // Create post_hashtags junction table
    console.log("Creating 'post_hashtags' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(post_id, hashtag_id)
      )
    `;
    console.log("✓ post_hashtags table created\n");

    // Create trends table
    console.log("Creating 'trends' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS trends (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(100) NOT NULL UNIQUE,
        post_count INTEGER NOT NULL DEFAULT 0,
        engagement_score INTEGER NOT NULL DEFAULT 0,
        last_updated_at TIMESTAMP NOT NULL DEFAULT now(),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✓ trends table created\n");

    // Create indexes for common queries
    console.log("Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(engagement_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id)`;
    console.log("✓ indexes created\n");

    // Verify all tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `;

    console.log("📊 Database tables:");
    tables.forEach((t) => console.log(`   - ${t.table_name}`));

    console.log("\n✅ Phase 3 migration complete!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
}

migratePhase3();
