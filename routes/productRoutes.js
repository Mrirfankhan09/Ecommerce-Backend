import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addReview,
  bulkCreateProducts,
  getProductSuggestions,
  getproductsCount,
  checkStock,
  getLowStockProducts,
  searchProducts
} from '../controller/productController.js';
import  auth  from '../middleware/auth.js';
import isAdmin  from '../middleware/isAdmin.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/suggestions', getProductSuggestions);
router.get('/getproductscount', getproductsCount);
router.post('/search', searchProducts);
router.post('/check-stock', checkStock);

// Admin routes
router.post('/create', auth, isAdmin, upload.single('image'), createProduct);
router.put('/:id', auth, isAdmin, upload.single('image'), updateProduct);
router.delete('/:id', auth, isAdmin, deleteProduct);
router.post('/review/:id', auth, addReview);
router.post('/bulkproduct', auth, isAdmin, bulkCreateProducts);
router.get('/low-stock', auth, isAdmin, getLowStockProducts);

export default router;