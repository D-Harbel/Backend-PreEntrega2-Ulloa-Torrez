const express = require('express');
const router = express.Router();

const ProductDao = require('../dao/productDao');
const { Product } = require('../dao/index');

module.exports = function (io) {
    router.get('/', async (req, res) => {
        try {
            const { limit, page, sort, query } = req.query;
            console.log(limit, page, sort, query)
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort ? { price: sort === 'asc' ? 1 : -1 } : undefined,
            };

            const filter = query ? {} : {};

            const products = await Product.paginate(filter, options);

            const totalPages = products.totalPages;
            const prevPage = products.prevPage;
            const nextPage = products.nextPage;
            const hasPrevPage = products.hasPrevPage;
            const hasNextPage = products.hasNextPage;
            const prevLink = hasPrevPage ? `/products?limit=${limit}&page=${prevPage}` : null;
            const nextLink = hasNextPage ? `/products?limit=${limit}&page=${nextPage}` : null;

            res.json({
                status: 'success',
                payload: products.docs,
                totalPages,
                prevPage,
                nextPage,
                page: products.page,
                hasPrevPage,
                hasNextPage,
                prevLink,
                nextLink,
                limit
            });

        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
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

            const products = await ProductDao.getProducts();
            io.emit('updateProducts', products);

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
            io.emit('updateProducts', products);

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
    
            io.emit('productDeleted', { productId });
    
            const products = await ProductDao.getProducts();
            io.emit('updateProducts', products);
    
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            console.error(`Error al eliminar el producto con ID ${productId}:`, error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    return router;
};