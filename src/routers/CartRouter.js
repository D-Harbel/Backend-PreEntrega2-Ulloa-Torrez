const express = require('express');
const router = express.Router();
const CartDao = require('../dao/cartDao');
const ProductDao = require('../dao/productDao');
const Cart = require('../dao/models/cartModel');

module.exports = function (io) {
    router.post('/', async (req, res) => {
        try {
            const cart = await CartDao.createCart();
            res.status(201).json({ cart });
        } catch (error) {
            console.error('Error al crear un carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.get('/:cid', async (req, res) => {
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

    router.post('/:cid/product', async (req, res) => {
        const cid = req.params.cid;
        const { productId, quantity } = req.body;

        try {
            const cart = await CartDao.getCartById(cid);

            if (!cart) {
                return res.status(404).json({ error: 'Carrito no encontrado' });
            }

            await CartDao.addProductToCart(cid, productId, quantity);

            const updatedCart = await CartDao.getCartById(cid);
            io.emit('updateCart', updatedCart);

            res.status(201).json({ message: 'Producto agregado al carrito' });
        } catch (error) {
            console.error(`Error al agregar un producto al carrito con ID ${cid}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.post('/:cid/product/:pid', (req, res) => {
        let cid = req.params.cid
        let pid = req.params.pid
        let quantity = parseInt(req.body.quantity)
    
        if (isNaN(quantity)) {
            return res.status(400).json({ error: 'La cantidad debe ser un número entero' })
        }
    
        CartDao.addProductToCart(cid, pid, quantity)
        res.status(201).json({message: 'Producto agregado al carrito' })
    })

    router.delete('/:cid/products/:pid', async (req, res) => {
        try {
            const { cid, pid } = req.params;

            const updatedCart = await Cart.findByIdAndUpdate(
                cid,
                { $pull: { products: { _id: pid } } },
                { new: true }
            ).populate('products.product');

            res.status(200).json({
                status: 'success',
                payload: updatedCart.products,
            });
        } catch (error) {
            console.error('Error al eliminar el producto del carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.put('/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            const newProducts = req.body.products;

            const updatedCart = await Cart.findByIdAndUpdate(cid, { products: newProducts }, { new: true })
                .populate('products.product');

            res.status(200).json({
                status: 'success',
                payload: updatedCart.products,
            });
        } catch (error) {
            console.error('Error al actualizar el carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.put('/:cid/products/:pid', async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;

            const updatedCart = await Cart.findOneAndUpdate(
                { _id: cid, 'products._id': pid },
                { $set: { 'products.$.quantity': quantity } },
                { new: true }
            ).populate('products.product');

            res.status(200).json({
                status: 'success',
                payload: updatedCart.products,
            });
        } catch (error) {
            console.error('Error al actualizar la cantidad del producto en el carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.delete('/:cid', async (req, res) => {
        try {
            const { cid } = req.params;

            await Cart.findByIdAndUpdate(cid, { $set: { products: [] } });

            res.status(200).json({
                status: 'success',
                message: 'Todos los productos del carrito han sido eliminados',
            });
        } catch (error) {
            console.error('Error al eliminar todos los productos del carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.get('/:cid', async (req, res) => {
        try {
            const { cid } = req.params;

            const cart = await Cart.findById(cid).populate('products.product').lean();

            res.status(200).json({ status: 'success', payload: cart.products });
        } catch (error) {
            console.error('Error al obtener el carrito:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    return router;
};