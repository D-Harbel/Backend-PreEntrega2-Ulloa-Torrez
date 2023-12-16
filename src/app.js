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

app.get('/', async (req, res) => {
    try {
        const products = await ProductDao.getProducts({ limit: 10, page: 1, sort: req.query.sort, query: 'available' });
        console.log(products);
        res.render('home', { products });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.use('/api/products', ProductRouter(io));
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
        const products = await ProductDao.getProducts({ limit: req.query.limit, page: req.query.page, sort: req.query.sort, query: req.query.query });
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

            const cartId = "65711d223f01f9b553bbfdb6";
            const quantity = 1;

            await CartDao.addProductToCart(cartId, productId, quantity);

            console.log(`Producto "${productName}" agregado al carrito`);

        } catch (error) {
            console.error('Error al agregar el producto al carrito:', error);
        }
    });
});

server.listen(port, () => {
    console.log(`Servidor en linea, puerto ${port}`);
});