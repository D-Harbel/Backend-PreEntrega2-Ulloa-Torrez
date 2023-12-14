const express = require('express');
const router = express.Router();
const ProductDao = require('../dao/productDao');

module.exports = function (io) {
    router.get('/:id/details', async (req, res) => {
        const productId = req.params.id;

        try {
            const product = await ProductDao.getProductById(productId);
            if (product) {
                res.render('productDetails', { product: product.toObject() });
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (error) {
            console.error(`Error al obtener los detalles del producto con ID ${productId}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
    router.post('/', async (req, res) => {
        const { title, description, code, price, stock, category, thumbnails } = req.body;

        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'No se permite el campo vacío en title' });
        }

        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ error: 'No se permite el campo vacío en description' });
        }

        if (typeof code !== 'string' || code.trim() === '') {
            return res.status(400).json({ error: 'No se permite el campo vacío en code' });
        }

        if (typeof price !== 'number' || isNaN(price) || price <= 0) {
            return res.status(400).json({ error: 'Solo se permiten números positivos en price' });
        }

        if (typeof stock !== 'number' || isNaN(stock) || stock < 0) {
            return res.status(400).json({ error: 'Solo se permiten números positivos en stock' });
        }

        if (typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'No se permite el campo vacío en category' });
        }

        try {
            await ProductDao.addProduct(title, description, code, price, true, stock, category, thumbnails);

            io.emit('updateProducts');

            res.status(201).json({ message: 'Producto agregado exitosamente' });
        } catch (error) {
            console.error('Error al agregar un producto:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.put('/:id', async (req, res) => {
        const productId = req.params.id;
        const updatedProduct = req.body;

        try {
            await ProductDao.updateProduct(productId, updatedProduct);

            const products = await ProductDao.getProducts();
            io.emit('updateProducts');

            res.status(200).json({ message: 'Producto actualizado exitosamente' });
        } catch (error) {
            console.error(`Error al actualizar el producto con ID ${productId}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.get('/:id', async (req, res) => {
        const productId = req.params.id;

        try {
            const product = await ProductDao.getProductById(productId);
            if (product) {
                res.status(200).json({ product });
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (error) {
            console.error(`Error al obtener el producto con ID ${productId}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    router.delete('/:id', async (req, res) => {
        const productId = req.params.id;

        const existingProduct = await ProductDao.getProductById(productId);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        try {
            await ProductDao.deleteProduct(productId);
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            console.error(`Error al eliminar el producto con ID ${productId}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    return router;
};