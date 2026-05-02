/**
 * RBAC Seed Script
 * Populates the rolepermissions collection with all 12 roles and their default permissions
 * Run: node scripts/rbacSeed.js
 * Safe: Uses upsert so can be run multiple times without duplicate errors
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import RolePermission from "../src/Models/RBAC/RolePermission.js";
import { roleDefinitions } from "../src/config/rbacRoleDefinitions.js";

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Seed the database
const seedRBAC = async () => {
  try {
    console.log("\n📋 Starting RBAC seed...\n");

    for (const role of roleDefinitions) {
      // Use upsert: if roleName exists, update; otherwise create
      const result = await RolePermission.findOneAndUpdate(
        { roleName: role.roleName },
        {
          $set: {
            displayName: role.displayName,
            hierarchy: role.hierarchy,
            menuAccess: role.menuAccess,
            routeAccess: role.routeAccess,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );

      console.log(`✅ ${role.displayName.padEnd(25)} (hierarchy: ${role.hierarchy}) `);
    }

    console.log("\n✅ RBAC seed completed successfully!");
    console.log(
      `\n📊 Summary: ${roleDefinitions.length} roles seeded/updated`
    );
    console.log(
      "\n📌 Next steps:"
    );
    console.log("   1. Verify in MongoDB: db.rolepermissions.countDocuments()");
    console.log("   2. Test login: Admin should now receive menuAccess + routeAccess");
    console.log("   3. Frontend: AuthProvider will store permissions in sessionStorage");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => seedRBAC());
