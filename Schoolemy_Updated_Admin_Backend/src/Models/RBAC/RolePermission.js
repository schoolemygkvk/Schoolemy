import { Schema, model } from "mongoose";

const rolePermissionSchema = new Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    hierarchy: {
      type: Number,
      required: true,
      description: "100=superadmin, 1=auditor. Higher = more permissions",
    },
    menuAccess: {
      type: Schema.Types.Mixed,
      default: {},
      description: "Object like { dashboard: true, courses: false, ... }",
    },
    routeAccess: {
      type: Schema.Types.Mixed,
      default: {},
      description: "Object like { 'add-course': true, 'admin-users': false, ... }",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model("RolePermission", rolePermissionSchema);
