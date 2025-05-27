const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.getAllProductos);

router.get('/search', productoController.searchProductos);

router.get('/categoria/:categoriaId', productoController.getProductosByCategoria);

router.get('/:id', productoController.getProductoById);

router.post('/', productoController.createProducto);

router.put('/:id', productoController.updateProducto);

router.patch('/:id', productoController.partialUpdateProducto);

router.delete('/:id', productoController.deleteProducto);

module.exports = router; 