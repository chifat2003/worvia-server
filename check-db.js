const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const sql = neon(process.env.NEONDB_URL);

async function checkDatabase() {
  try {
    console.log("🔍 Checking database tables...\n");

    // Check if posts table exists
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `;

    console.log("📊 Existing tables:");
    tables.forEach((t) => console.log(`   - ${t.table_name}`));

    console.log("\n🔎 Checking posts table structure...");
    try {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        ORDER BY ordinal_position
      `;

      if (columns.length === 0) {
        console.log("   ❌ posts table does NOT exist!");
      } else {
        console.log("   ✓ posts table exists with columns:");
        columns.forEach((c) => {
          console.log(`     - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`);
        });
      }
    } catch (e) {
      console.log("   ❌ Error checking posts table:", e.message);
    }

    console.log("\n🔎 Checking users table...");
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`   ✓ Users in database: ${userCount[0].count}`);
    } catch (e) {
      console.log("   ❌ Error checking users:", e.message);
    }

    console.log("\n✅ Database check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  process.exit(0);
}

checkDatabase();
