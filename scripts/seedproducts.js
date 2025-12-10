const mongoose = require('mongoose');
const Product = require('../models/Product');
//require('dotenv').config();
require('dotenv').config({ path: '../.env' });


// Sample products array
const sampleProducts = [
  {
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with Air Max technology",
    price: 12999,
    category: "shoes",
    size: ["8", "9", "10", "11", "12"],
    color: ["Black", "White", "Blue"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    stock: 15
  },
  {
    name: "Adidas Ultraboost",
    description: "High-performance running shoes with Boost technology",
    price: 14999,
    category: "shoes",
    size: ["7", "8", "9", "10", "11"],
    color: ["Black", "White", "Red"],
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
    stock: 10
  },
  {
    name: "Classic Cotton T-Shirt",
    description: "100% cotton comfortable t-shirt",
    price: 1999,
    category: "clothes",
    size: ["S", "M", "L", "XL"],
    color: ["White", "Black", "Gray", "Blue"],
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    stock: 50
  },
  {
    name: "Denim Jeans",
    description: "Classic fit denim jeans",
    price: 3999,
    category: "clothes",
    size: ["30", "32", "34", "36", "38"],
    color: ["Blue", "Black"],
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    stock: 25
  },
  {
    name: "Puma RS-X",
    description: "Bold and trendy sneakers",
    price: 11999,
    category: "shoes",
    size: ["8", "9", "10", "11"],
    color: ["White", "Black", "Multicolor"],
    image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400",
    stock: 8
  },
  {
    name: "Hooded Sweatshirt",
    description: "Warm and comfortable hoodie",
    price: 3499,
    category: "clothes",
    size: ["S", "M", "L", "XL"],
    color: ["Black", "Gray", "Navy"],
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    stock: 20
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB using .env variable
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing products
    await Product.deleteMany();
    console.log('🧹 Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log('📦 Added sample products');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

seedDatabase();

