import Product from '../models/Product.js';
import Order from '../models/Order.js'

export const createProduct = async (req, res) => {
  try {
    console.log(req.body)
    const { name, description, price, category, brand } = req.body;
    console.log(name, description, price, category, brand)

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
      stock: 0,
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
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.brand = brand || product.brand;

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

    for (const img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




export const addProductReview = async (req, res) => {
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


