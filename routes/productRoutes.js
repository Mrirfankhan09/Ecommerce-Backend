import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductReview,
  bulkCreateProducts,
  getProductSuggestions,
  getproductsCount
} from '../controller/productController.js';
import  auth  from '../middleware/auth.js';
import isAdmin  from '../middleware/isAdmin.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Only admin can create, update, delete products
router.post('/create', auth, isAdmin, upload.single('image'), createProduct);
router.get('/getproductscount', getproductsCount); // Get product count
router.get('/suggestions', getProductSuggestions);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', auth, isAdmin, upload.single('image'), updateProduct);
router.delete('/:id', auth, isAdmin, deleteProduct);
router.post('/review/:id',auth,addProductReview)
router.post('/bulkproduct',auth,bulkCreateProducts);

export default router;