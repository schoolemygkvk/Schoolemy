import express from "express";
import asyncHandler from "../Utils/asyncHandler.js";
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  syncWishlistFromClient,
} from "../Controllers/Wishlist-Controller.js";

const router = express.Router();


router.get("/", asyncHandler(getUserWishlist));


router.post("/", asyncHandler(addToWishlist));


router.delete("/:courseId", asyncHandler(removeFromWishlist));


router.get("/check/:courseId", asyncHandler(checkWishlistStatus));


router.post("/sync", asyncHandler(syncWishlistFromClient));

export default router;
