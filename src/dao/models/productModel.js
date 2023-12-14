const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    code: String,
    price: Number,
    status: Boolean,
    stock: Number,
    category: String,
    thumbnails: [String]
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;