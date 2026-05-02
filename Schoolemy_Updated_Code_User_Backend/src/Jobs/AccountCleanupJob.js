// CRITICAL FIX 1: Account cleanup job for inactive accounts
import cron from "node-cron";
import User from "../Models/User-Model/User-Model.js";
import { sendAccountDeletionEmail } from "../Notification/EmailTransport.js";
import { logger } from "../Utils/logger.js";


export const scheduleAccountCleanup = () => {
  const accountCleanupJob = cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("Starting scheduled account cleanup job...");

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Find inactive users who haven't purchased anything
      const usersToDelete = await User.find({
        createdAt: { $lt: thirtyDaysAgo },
        registrationCompleted: true,
        $expr: { $eq: [{ $size: "$enrolledCourses" }, 0] },
        lastPurchaseDate: null,
        accountDeletionScheduledAt: null,
      });

      logger.info(`Found ${usersToDelete.length} eligible users for deletion`);

      for (const user of usersToDelete) {
        try {
          // Send notification email before deletion
          if (user.email) {
            await sendAccountDeletionEmail(user.email);
          }

          // Delete user account
          await User.deleteOne({ _id: user._id });
          logger.info(`✓ Deleted inactive account: ${user._id} (${user.email || user.mobile})`);
        } catch (userError) {
          logger.error(`Failed to delete user ${user._id}:`, userError);
          // Continue with next user on error
        }
      }

      logger.info(`Account cleanup job completed. Deleted ${usersToDelete.length} accounts.`);
    } catch (error) {
      logger.error("Account cleanup job failed:", error);
    }
  });

  return accountCleanupJob;
};


export const triggerAccountCleanup = async (req, res) => {
  try {
    // Verify admin role
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can trigger account cleanup",
      });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const usersToDelete = await User.find({
      createdAt: { $lt: thirtyDaysAgo },
      registrationCompleted: true,
      $expr: { $eq: [{ $size: "$enrolledCourses" }, 0] },
      lastPurchaseDate: null,
    });

    let deletedCount = 0;
    for (const user of usersToDelete) {
      try {
        if (user.email) {
          await sendAccountDeletionEmail(user.email);
        }
        await User.deleteOne({ _id: user._id });
        deletedCount++;
      } catch (error) {
        logger.error(`Failed to delete user ${user._id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Account cleanup completed. ${deletedCount} accounts deleted.`,
      deletedCount,
    });
  } catch (error) {
    logger.error("Manual account cleanup failed:", error);
    return res.status(500).json({
      success: false,
      message: "Account cleanup failed. Please try again.",
    });
  }
};
