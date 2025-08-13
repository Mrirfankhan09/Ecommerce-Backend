import express from "express";
import { addAddress, getuserAddress, updateAddress, deleteAddress } from "../controller/addressController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create new address
router.post("/", auth, addAddress);

// Get all addresses for logged-in user
router.get("/", auth, getuserAddress);

// Update address by ID
router.put("/:id", auth, updateAddress);

// Delete address by ID
router.delete("/:id", auth, deleteAddress);

export default router;
