const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Obtener todos los productos
router.get('/', productoController.getAllProductos);

// Buscar productos
router.get('/search', productoController.searchProductos);

// Obtener productos por categoría
router.get('/categoria/:categoriaId', productoController.getProductosByCategoria);

// Obtener un producto por ID
router.get('/:id', productoController.getProductoById);

// Crear un nuevo producto
router.post('/', productoController.createProducto);

// Actualizar un producto
router.put('/:id', productoController.updateProducto);

// Actualizar parcialmente un producto
router.patch('/:id', productoController.partialUpdateProducto);

// Eliminar un producto
router.delete('/:id', productoController.deleteProducto);

module.exports = router; 