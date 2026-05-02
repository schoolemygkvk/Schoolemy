import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  getAllUsers,
  updateUserById,
  deleteUserById,
} from "../../Controllers/User/user-controller.js";

const router = express.Router();

// Route Definitions
router.get("/getallusers", verifyToken, checkRole(['admin', 'usermanagement']), getAllUsers);
router.put("/user/:id", verifyToken, checkRole(['admin', 'usermanagement']), updateUserById);
router.delete("/user/:id", verifyToken, checkRole(['admin', 'usermanagement']), deleteUserById);

export default router;
