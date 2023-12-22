const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://I_Ulloa:Coderclave@ecommerce.6tv4mer.mongodb.net/?retryWrites=true&w=majority', { dbName: "ecommerce" });

const Cart = require('./models/cartModel');
const Message = require('./models/messageModel');
const Product = require('./models/productModel');

module.exports = {
    Cart,
    Message,
    Product
};