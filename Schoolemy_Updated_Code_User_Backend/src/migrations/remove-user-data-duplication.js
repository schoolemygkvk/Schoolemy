

import mongoose from "mongoose";
import logger from "../Utils/logger.js";
import User from "../Models/User-Model/User-Model.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DRY_RUN = true; // Set to false to actually modify database
const LOG_FILE = path.join(__dirname, "../logs/migration-" + new Date().toISOString().slice(0, 10) + ".log");

// Create logs directory if needed
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  logger.debug(logLine);
  fs.appendFileSync(LOG_FILE, logLine + "\n");
};


const verifyDataIntegrity = async () => {
  logMessage("=== VERIFYING DATA INTEGRITY ===");

  // Check for users with duplicate/conflicting name data
  const usersWithDuplicates = await User.find({
    $and: [
      { username: { $exists: true, $ne: null } },
      { firstName: { $exists: true, $ne: null } },
    ],
  }).select("_id email username firstName lastName");

  logMessage(`Found ${usersWithDuplicates.length} users with multiple name fields`);

  // Check for inconsistent email fields
  const emailCount = await User.aggregate([
    {
      $group: {
        _id: "$email",
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  logMessage(`Found ${emailCount.length} duplicate email entries`);

  return {
    usersWithDuplicates: usersWithDuplicates.length,
    duplicateEmails: emailCount.length,
  };
};


const consolidateUserData = async () => {
  logMessage("=== CONSOLIDATING USER DATA ===");

  const stats = {
    processed: 0,
    updated: 0,
    errors: 0,
  };

  // Get all users
  const users = await User.find({}).lean();
  logMessage(`Processing ${users.length} users...`);

  for (const user of users) {
    try {
      const updateData = {};

      // Consolidate name fields
      // Rule 1: Use firstName/lastName as primary
      // Rule 2: If missing, try to extract from username or fatherName
      if (!user.firstName && user.username) {
        updateData.firstName = user.username.split(" ")[0];
      }

      if (!user.lastName && user.fatherName) {
        updateData.lastName = user.fatherName;
      }

      // Ensure profileImageUrl is set (consolidate from legacy fields)
      if (!user.profileImageUrl && user.profilePicture) {
        logMessage(`  Migration Note: User ${user._id} has legacy Base64 image - needs manual migration`);
      }

      if (Object.keys(updateData).length > 0) {
        if (!DRY_RUN) {
          await User.updateOne(
            { _id: user._id },
            { $set: updateData },
          );
        }
        stats.updated++;
      }

      stats.processed++;
    } catch (error) {
      stats.errors++;
      logMessage(`  ERROR processing user ${user._id}: ${error.message}`);
    }
  }

  return stats;
};


const verifyPaymentData = async () => {
  logMessage("=== VERIFYING PAYMENT DATA ===");

  // Check for duplicate user enrollments
  const Payment = mongoose.model("Payment");

  const duplicateEnrollments = await Payment.aggregate([
    {
      $group: {
        _id: {
          userId: "$userId",
          courseId: "$courseId",
        },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  logMessage(`Found ${duplicateEnrollments.length} duplicate course enrollments`);

  return duplicateEnrollments.length;
};


const runMigration = async () => {
  try {
    logMessage("=== DATA DUPLICATION MIGRATION STARTED ===");
    logMessage(`DRY_RUN: ${DRY_RUN}`);

    // Connect to MongoDB
    logMessage("Connecting to MongoDB...");
    // Note: Connection should be handled by main server initialization
    // For standalone script, add: await mongoose.connect(process.env.MONGODB_URI)

    // Phase 1: Verify data integrity
    logMessage("");
    const integrity = await verifyDataIntegrity();
    logMessage(`Integrity Check: ${JSON.stringify(integrity)}`);

    // Phase 2: Consolidate data
    logMessage("");
    const consolidateStats = await consolidateUserData();
    logMessage(`Consolidation Stats: ${JSON.stringify(consolidateStats)}`);

    // Phase 3: Verify payments
    logMessage("");
    const paymentDuplicates = await verifyPaymentData();
    logMessage(`Payment Check: ${paymentDuplicates} duplicate enrollments`);

    // Summary
    logMessage("");
    logMessage("=== MIGRATION SUMMARY ===");
    logMessage(`Mode: ${DRY_RUN ? "DRY RUN (No changes made)" : "LIVE (Changes applied)"}`);
    logMessage(`Users Processed: ${consolidateStats.processed}`);
    logMessage(`Users Updated: ${consolidateStats.updated}`);
    logMessage(`Errors: ${consolidateStats.errors}`);
    logMessage(`Log saved to: ${LOG_FILE}`);

    if (DRY_RUN) {
      logMessage("");
      logMessage("NEXT STEP: Review changes above.");
      logMessage("1. Set DRY_RUN = false in this script");
      logMessage("2. Run migration again: node src/migrations/remove-user-data-duplication.js");
      logMessage("3. Verify changes: db.users.find({firstName: null})");
    }

    logMessage("=== MIGRATION COMPLETED ===");

  } catch (error) {
    logMessage(`ERROR: ${error.message}`);
    logMessage(`Stack: ${error.stack}`);
    process.exit(1);
  }
};

// Export for use in other scripts
export { runMigration, consolidateUserData, verifyDataIntegrity };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}
