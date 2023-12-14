const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    id: String,
    products: [
        {
            product: String,
            quantity: Number
        }
    ]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;