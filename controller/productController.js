import Product from '../models/Product.js';
import Order from '../models/Order.js'

export const createProduct = async (req, res) => {
  try {
    console.log(req.body)
    const { name, description, price, category, brand, stock } = req.body;
    console.log(name, description, price, category, brand, stock)

    let images = [];

    if (req.file && req.file.path) {
      images.push({
        url: req.file.path,        // ✅ Cloudinary URL
        public_id: req.file.filename, // ✅ Cloudinary public_id
      });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      brand,
      images,
      stock: stock || 0,
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check stock availability for a product
export const checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID and quantity are required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const isAvailable = product.stock >= quantity;
    
    res.status(200).json({
      success: true,
      isAvailable,
      availableStock: product.stock,
      requestedQuantity: quantity,
      message: isAvailable 
        ? 'Stock available' 
        : `Only ${product.stock} items available in stock`
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get low stock products (for admin)
export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    const products = await Product.find({ stock: { $lte: threshold } })
      .select('name stock category price')
      .sort({ stock: 1 });

    res.status(200).json({
      success: true,
      products,
      threshold,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.stock = stock !== undefined ? stock : product.stock;

    if (req.file && req.file.path) {
      // Delete old image if needed
      for (const img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      product.images = [
        {
          url: req.file.path,
          public_id: req.file.filename,
        },
      ];
    }

    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete images from Cloudinary if needed
    for (const img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, sortBy } = req.body;

    let searchQuery = {};

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      searchQuery.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = minPrice;
      if (maxPrice) searchQuery.price.$lte = maxPrice;
    }

    // Stock filter (only show products with stock > 0)
    searchQuery.stock = { $gt: 0 };

    let sortOptions = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          sortOptions.price = 1;
          break;
        case 'price-high':
          sortOptions.price = -1;
          break;
        case 'name':
          sortOptions.name = 1;
          break;
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        default:
          sortOptions.createdAt = -1;
      }
    }

    const products = await Product.find(searchQuery).sort(sortOptions);

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.userId;
    const { rating, comment } = req.body;

    // ✅ Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // ✅ Check if user purchased & received the product
    const hasPurchased = await Order.findOne({
      user: userId,
      isDelivered: true,
      'orderItems.product': productId,
    });

    if (!hasPurchased) {
      return res
        .status(403)
        .json({ message: 'Only users who received the product can leave a review' });
    }

    // ✅ Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId
    );

    if (alreadyReviewed) {
      // update existing review
      alreadyReviewed.rating = rating;
      alreadyReviewed.comment = comment;
      alreadyReviewed.createdAt = new Date();
    } else {
      // add new review
      const review = {
        user: userId,
        name: req.user.name || 'Anonymous',
        rating: Number(rating),
        comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
    }

    // ✅ Update average rating
    product.ratings =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
};


export const bulkCreateProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    const inserted = await Product.insertMany(products);
    res.status(201).json({ message: 'Products created successfully', count: inserted.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ message: 'Server error during bulk insert' });
  }
};

export const getProductSuggestions = async (req, res) => {
  try {
    const query = req.query.query || '';
    // Search by product name (case-insensitive, partial match)
    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    }).limit(10); // Limit results for performance

    const suggestions = products.map(product => product.name);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions', error });
  }
};

export const getproductsCount = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching product count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


