const express = require('express');
const { engine } = require('express-handlebars');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const ProductRouter = require('./routers/ProductRouter');
const CartRouter = require('./routers/CartRouter');
const ChatRouter = require('./routers/ChatRouter');
const ProductDao = require('./dao/productDao');
const MessageDao = require('./dao/messageDao');
const CartDao = require('./dao/cartDao');
const mongoosePaginate = require('mongoose-paginate-v2');
const Product = require('./dao/models/productModel');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

mongoose.connect('mongodb+srv://I_Ulloa:Coderclave@ecommerce.6tv4mer.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const viewsPath = path.join(__dirname, 'views');
app.engine('handlebars', engine({ extname: '.handlebars' }));
app.set('view engine', 'handlebars');
app.set('views', viewsPath);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rutas
app.get('/', async (req, res) => {
    try {
        const products = await ProductDao.getProducts({ limit: 10, page: 1, sort: 'asc', query: 'available' });
        console.log(products);
        res.render('home', { products });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.use('/api/products', ProductRouter);
app.use('/api/carts', CartRouter(io));
app.use('/chat', ChatRouter(io, MessageDao));

app.get('/views/carts/:cid', async (req, res) => {
    const cid = req.params.cid;
    try {
        const cart = await CartDao.getCartById(cid);
        if (cart) {
            res.render('cart', { cart });
        } else {
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        console.error(`Error al obtener el carrito con ID ${cid}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts');
});

app.get('/views/products', async (req, res) => {
    try {
        const products = await ProductDao.getProducts({ limit:req.query.limit, page:req.query.page, query: 'available' });
        res.render('products', { products });
    } catch (error) {
        console.error('Error al obtener productos para la vista:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

io.on('connection', async (socket) => {
    console.log('Cliente conectado');

    const products = await ProductDao.getProducts({ limit: 10, page: 1, sort: 'asc', query: 'available' });
    socket.emit('products', products);

    socket.on('addToCart', async ({ productId, productName }) => {
        try {
            const userId = socket.id;

            let cart = await CartDao.findOne({ userId });

            if (!cart) {
                cart = new CartDao({ userId, products: [] });
            }

            const existingProduct = cart.products.find(product => product.productId === productId);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.products.push({ productId, quantity: 1 });
            }

            await cart.save();

            console.log(`Producto "${productName}" agregado al carrito del usuario ${userId}`);

        } catch (error) {
            console.error('Error al agregar el producto al carrito:', error);
        }
    });
});

server.listen(port, () => {
    console.log(`Servidor en linea, puerto ${port}`);
});