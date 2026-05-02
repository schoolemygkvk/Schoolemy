

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = __dirname;

// Migration History Model
const migrationHistorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    executedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    direction: { type: String, enum: ["up", "down"], default: "up" },
    error: { type: String, default: null },
  },
  { collection: "migration_history", timestamps: true },
);

let MigrationHistory;


async function connectDatabase() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error("MONGO_URL or MONGODB_URI not configured");
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    });

    MigrationHistory = mongoose.model("MigrationHistory", migrationHistorySchema);
    console.log("✓ Connected to database");
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    process.exit(1);
  }
}


async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log("✓ Disconnected from database");
}


function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".js") && file !== "migration-runner.js")
    .sort();
}


async function getPendingMigrations() {
  const allMigrations = getMigrationFiles();
  const executedMigrations = await MigrationHistory.find({
    status: "completed",
  });

  const executedNames = executedMigrations.map((m) => m.name);
  return allMigrations.filter((file) => !executedNames.includes(file));
}


async function getCompletedMigrations() {
  return MigrationHistory.find({ status: "completed" }).sort({ executedAt: -1 });
}


async function loadMigration(filename) {
  try {
    const migrationPath = path.join(MIGRATIONS_DIR, filename);
    const module = await import(`file://${migrationPath}`);
    return module.default || module;
  } catch (error) {
    throw new Error(`Failed to load migration ${filename}: ${error.message}`);
  }
}


async function runMigrationsUp() {
  console.log("\n📦 Running migrations...\n");

  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    console.log("✓ All migrations are up to date");
    return;
  }

  let successCount = 0;

  for (const filename of pending) {
    try {
      console.log(`⏳ Running ${filename}...`);

      const migration = await loadMigration(filename);

      if (!migration.up) {
        throw new Error("Migration must export \"up\" function");
      }

      // Record migration start
      const history = new MigrationHistory({
        name: filename,
        direction: "up",
        status: "pending",
      });
      await history.save();

      // Execute migration
      await migration.up(mongoose);

      // Mark as completed
      history.status = "completed";
      history.executedAt = new Date();
      await history.save();

      console.log(`✓ ${filename} completed\n`);
      successCount++;
    } catch (error) {
      console.error(`✗ ${filename} FAILED: ${error.message}\n`);

      // Record failure
      const history = await MigrationHistory.findOne({ name: filename });
      if (history) {
        history.status = "failed";
        history.error = error.message;
        await history.save();
      }

      console.error("⚠️  Migration failed. Subsequent migrations skipped.");
      break;
    }
  }

  console.log(`\n📊 Summary: ${successCount} migration(s) completed`);
}


async function rollbackMigration() {
  console.log("\n⏮️  Rolling back last migration...\n");

  const completed = await getCompletedMigrations();

  if (completed.length === 0) {
    console.log("✓ No migrations to rollback");
    return;
  }

  const lastMigration = completed[0];
  const filename = lastMigration.name;

  try {
    console.log(`⏳ Rolling back ${filename}...`);

    const migration = await loadMigration(filename);

    if (!migration.down) {
      throw new Error("Migration must export \"down\" function for rollback");
    }

    // Execute rollback
    await migration.down(mongoose);

    // Remove from history
    await MigrationHistory.deleteOne({ name: filename });

    console.log(`✓ ${filename} rolled back\n`);
  } catch (error) {
    console.error(`✗ Rollback FAILED: ${error.message}\n`);
  }
}


async function showStatus() {
  console.log("\n📋 Migration Status\n");

  const completed = await getCompletedMigrations();
  const pending = await getPendingMigrations();

  console.log(`Completed: ${completed.length}`);
  completed.forEach((m) => {
    console.log(`  ✓ ${m.name} (${new Date(m.executedAt).toLocaleString()})`);
  });

  console.log(`\nPending: ${pending.length}`);
  pending.forEach((name) => {
    console.log(`  ⏳ ${name}`);
  });

  console.log();
}


async function createMigration(name) {
  const timestamp = Date.now();
  const filename = `${timestamp}-${name}.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const template = `

export default {
  
  async up(mongoose) {
    // TODO: Implement your migration here
    // Example:
    // const db = mongoose.connection;
    // await db.collection('users').updateMany({}, { \$set: { newField: null } });
    console.log('Migration up: ${name}');
  },

  
  async down(mongoose) {
    // TODO: Implement rollback here
    // Example:
    // const db = mongoose.connection;
    // await db.collection('users').updateMany({}, { \$unset: { newField: 1 } });
    console.log('Migration down: ${name}');
  },
};
`;

  fs.writeFileSync(filepath, template);
  console.log(`✓ Created migration: ${filename}`);
  console.log(`   Edit: ${filepath}\n`);
}


async function main() {
  const [, , command, ...args] = process.argv;

  try {
    await connectDatabase();

    switch (command) {
    case "up":
      await runMigrationsUp();
      break;
    case "down":
      await rollbackMigration();
      break;
    case "status":
      await showStatus();
      break;
    case "create":
      if (!args[0]) {
        console.error("Error: Migration name required");
        console.error("Usage: node migration-runner.js create <name>");
        process.exit(1);
      }
      await createMigration(args[0]);
      break;
    default:
      console.log(`
Database Migration Runner

Usage:
  node migration-runner.js up              Run all pending migrations
  node migration-runner.js down            Rollback last migration
  node migration-runner.js status          Show migration status
  node migration-runner.js create <name>   Create new migration

Examples:
  node migration-runner.js create add_user_preferences
  node migration-runner.js up
  node migration-runner.js status
  node migration-runner.js down
        `);
    }

    await disconnectDatabase();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
