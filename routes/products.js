const express = require('express');
const Product = require('../models/product');
const router = express.Router();
// Get all products
router.get('/', async (req, res) => {
try {
const products = await Product.find();
res.status(200).json({
status: 'success',
results: products.length,
data: {
products
}
});
} catch (error) {
res.status(400).json({
status: 'fail',

message: error.message
});
}
});
// Get single product
router.get('/:id', async (req, res) => {
try {
const product = await Product.findById(req.params.id);
if (!product) {
return res.status(404).json({
status: 'fail',
message: 'Product not found'
});
}
res.status(200).json({
status: 'success',
data: {
product
}
});
} catch (error) {
res.status(400).json({
status: 'fail',
message: error.message
});
}
});
// Create product (for demo - you'll add products manually)
router.post('/', async (req, res) => {
try {
const product = await Product.create(req.body);
res.status(201).json({
status: 'success',
data: {

product
}
});
} catch (error) {
res.status(400).json({
status: 'fail',
message: error.message
});
}
});


// Add stock to all products (admin route)
// router.patch('/admin/add-stock', async (req, res) => {
//   try {
//     const { stockQuantity = 10 } = req.body;
    
//     const result = await Product.updateMany(
//       {}, 
//       { $set: { stock: stockQuantity } }
//     );
    
//     res.json({
//       status: 'success',
//       message: `Added ${stockQuantity} stock to all products`,
//       modifiedCount: result.modifiedCount
//     });
//   } catch (error) {
//     res.status(500).json({ status: 'fail', message: error.message });
//   }
// });
module.exports = router;