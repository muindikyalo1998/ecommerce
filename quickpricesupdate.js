// updatePricesFixed.js
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 Starting price update script...');
console.log('Current directory:', __dirname);

async function updatePrices() {
  try {
    console.log('📡 Loading Product model...');
    const Product = require('./models/Product');
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    console.log('🔄 Updating all product prices to KSh 1...');
    const result = await Product.updateMany({}, { $set: { price: 1 } });
    
    console.log(`✅ SUCCESS: Updated ${result.modifiedCount} products to KSh 1.00`);
    
    console.log('📋 Verifying updates...');
    const products = await Product.find({}, 'name price stock').limit(10);
    
    console.log('📦 Updated Products:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}: KSh ${product.price} (Stock: ${product.stock})`);
    });
    
    console.log('🎉 Price update completed successfully!');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('🛑 Script interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the function
updatePrices();