
// const mongoose = require('mongoose');
// const productSchema = new mongoose.Schema({
// name: {
// type: String,

// required: true
// },
// description: {
// type: String,
// required: true
// },
// price: {
// type: Number,
// required: true
// },
// category: {
// type: String,
// required: true,
// enum: ['shoes', 'clothes', 'accessories']
// },
// size: [String],
// color: [String],
// image: {
// type: String,
// required: true
// },
// stock: {
// type: Number,
// default: 0
// }
// }, {
// timestamps: true
// });
// module.exports = mongoose.model('Product', productSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['shoes', 'clothes', 'accessories']
    },
    size: [String],
    color: [String],
    image: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// FIX: Check if the model exists in Mongoose's cache before compiling it.
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;