const { Product } = require('./index');

class ProductDao {
    async getProducts({ limit = 10, page = 1, sort, query, category, availability }) {
        try {
            let filter = {};

            if (category) {
                filter.category = category;
            }

            if (availability !== undefined) {
                filter.status = availability;
            }

            let sortField = 'price';

            if (sort) {
                sortField = sort === 'asc' ? 'price' : '-price';
            }

            const totalCount = await Product.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limit);
            const hasPrevPage = page > 1;
            const hasNextPage = page < totalPages;
            const prevPage = hasPrevPage ? page - 1 : null;
            const nextPage = hasNextPage ? page + 1 : null;
            const prevLink = hasPrevPage ? `/api/products?limit=${limit}&page=${prevPage}&sort=${sort}&query=${query}` : null;
            const nextLink = hasNextPage ? `/api/products?limit=${limit}&page=${nextPage}&sort=${sort}&query=${query}` : null;

            const products = await Product.find(filter)
                .sort(sortField)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();
                

            return {
                status: 'success',
                payload: products,
                totalPages,
                prevPage,
                nextPage,
                page,
                hasPrevPage,
                hasNextPage,
                prevLink,
                nextLink,
            };
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    }

    async addProduct(title, description, code, price, status, stock, category, thumbnails) {
        try {
            const product = new Product({
                title,
                description,
                code,
                price,
                status,
                stock,
                category,
                thumbnails
            });

            await product.save();
        } catch (error) {
            console.error('Error al agregar un producto:', error);
            throw error;
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const existingProduct = await Product.findById(id);

            if (!existingProduct) {
                throw new Error(`No se encontró el producto con el ID ${id}`);
            }

            const isCodeTaken = await Product.exists({ code: updatedProduct.code, _id: { $ne: id } });

            if (isCodeTaken) {
                throw new Error(`Ya existe un producto con el código ${updatedProduct.code}`);
            }

            Object.assign(existingProduct, updatedProduct);

            await existingProduct.save();
        } catch (error) {
            console.error(`Error al actualizar un producto con ID ${id}:`, error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            return await Product.findById(id);
        } catch (error) {
            console.error(`Error al obtener el producto con ID ${id}:`, error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const existingProduct = await Product.findById(id);

            if (!existingProduct) {
                throw new Error(`No se encontró el producto con el ID ${id}`);
            }

            const result = await Product.findByIdAndDelete(id);

            if (!result) {
                throw new Error(`No se encontró el producto con el ID ${id}`);
            }

            console.log('Producto eliminado');
            return result;
        } catch (error) {
            console.error(`Error al eliminar el producto con ID ${id}:`, error);
            throw error;
        }
    }
}

module.exports = new ProductDao();