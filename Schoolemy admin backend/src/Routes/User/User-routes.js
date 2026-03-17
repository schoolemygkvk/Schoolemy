import express from "express";
import {
  getAllUsers,
  updateUserById,
  deleteUserById,
} from "../../Controllers/User/user-controller.js";

const router = express.Router();

// Route Definitions
router.get("/getallusers", getAllUsers);
router.put("/user/:id", updateUserById);
router.delete("/user/:id", deleteUserById);

export default router;
