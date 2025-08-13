import express from "express";
import { addToCart, getCart,
  updateCartItem,
  removeCartItem,
  clearCart,} from "../controller/cartController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, addToCart);
router.get("/", auth, getCart);
router.put("/:itemId", auth, updateCartItem);
router.delete("/:itemId", auth, removeCartItem);
router.delete("/", auth, clearCart);

export default router;
