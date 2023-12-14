const { Product } = require('./index');

class ProductDao {
    async getProducts() {
        try {
            return await Product.find().lean();
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