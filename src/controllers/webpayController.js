const { WebpayPlus } = require('transbank-sdk');
const supabase = require('../config/db');
const { 
    WEBPAY_INTEGRATION_URL, 
    WEBPAY_PRODUCTION_URL, 
    getTransactionInstance 
} = require('../config/webpayConfig');

const getWebpayBaseUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? WEBPAY_PRODUCTION_URL 
        : WEBPAY_INTEGRATION_URL;
};

exports.iniciarTransaccion = async (req, res) => {
    try {
        const { 
            buyOrder, 
            sessionId, 
            amount, 
            returnUrl,
            items,
            userId
        } = req.body;

        if (!buyOrder || !sessionId || !amount || !returnUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos para iniciar la transacción'
            });
        }

        const baseUrl = getWebpayBaseUrl();
        console.log(`Usando URL base de Webpay: ${baseUrl}`);

        const transaction = getTransactionInstance();
        
        const response = await transaction.create(
            buyOrder, 
            sessionId, 
            amount, 
            returnUrl
        );

        console.log('Transacción iniciada:', response);

        try {
            const { error } = await supabase
                .from('transacciones_pendientes')
                .insert({
                    buy_order: buyOrder,
                    session_id: sessionId,
                    amount: amount,
                    items: items,
                    user_id: userId
                });

            if (error) {
                console.error('Advertencia: Error al guardar transacción pendiente en la base de datos:', error);
            } else {
                console.log('Transacción pendiente guardada correctamente en la base de datos');
            }
        } catch (dbError) {
            console.error('Advertencia: Error al intentar guardar en la base de datos:', dbError);
        }

        return res.status(200).json({
            success: true,
            url: response.url,
            token: response.token
        });
    } catch (error) {
        console.error('Error al iniciar transacción WebPay:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al iniciar transacción WebPay'
        });
    }
};

exports.confirmarTransaccion = async (req, res) => {
    try {
        const { token_ws } = req.body;

        if (!token_ws) {
            return res.status(400).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const transaction = getTransactionInstance();
        
        const response = await transaction.commit(token_ws);
        console.log('Respuesta de confirmación:', response);

        let resultado = {
            success: response.status === 'AUTHORIZED',
            message: response.status === 'AUTHORIZED' ? 'Pago completado con éxito' : 'Transacción rechazada o cancelada',
            transaction: response
        };

        if (response.status === 'AUTHORIZED') {
            try {
                const { data: transaccion, error: selectError } = await supabase
                    .from('transacciones_pendientes')
                    .select('*')
                    .eq('buy_order', response.buy_order)
                    .single();

                if (selectError || !transaccion) {
                    console.error('Advertencia: No se encontró la transacción pendiente:', selectError);
                } else {
                    try {
                        const { data: pedido, error: insertPedidoError } = await supabase
                            .from('pedido')
                            .insert({
                                fecha: new Date().toISOString().split('T')[0],
                                medio_pago_id: 2,
                                id_estado_envio: 2,
                                id_estado: 1,
                                id_cliente: transaccion.user_id
                            })
                            .select()
                            .single();

                        if (insertPedidoError) {
                            console.error('Advertencia: Error al crear pedido:', insertPedidoError);
                        } else {
                            console.log('Pedido creado correctamente:', pedido);
                            
                            try {
                                const detallesPedido = transaccion.items.map(item => ({
                                    cantidad: item.cantidad,
                                    precio_unitario: item.precio,
                                    subtotal: item.precio * item.cantidad,
                                    id_pedido: pedido.id_pedido,
                                    id_producto: item.id
                                }));

                                const { error: insertDetalleError } = await supabase
                                    .from('pedido_producto')
                                    .insert(detallesPedido);

                                if (insertDetalleError) {
                                    console.error('Advertencia: Error al insertar detalles del pedido:', insertDetalleError);
                                } else {
                                    console.log('Detalles del pedido agregados correctamente');
                                    
                                    try {
                                        for (const detalle of detallesPedido) {
                                            const { data: producto, error: getProductoError } = await supabase
                                                .from('producto')
                                                .select('stock')
                                                .eq('id_producto', detalle.id_producto)
                                                .single();
                                                
                                            if (getProductoError || !producto) {
                                                console.error(`Advertencia: Error al obtener stock del producto ${detalle.id_producto}:`, getProductoError);
                                                continue;
                                            }
                                            
                                            const nuevoStock = Math.max(0, producto.stock - detalle.cantidad);
                                            
                                            const { error: updateStockError } = await supabase
                                                .from('producto')
                                                .update({ stock: nuevoStock })
                                                .eq('id_producto', detalle.id_producto);
                                                
                                            if (updateStockError) {
                                                console.error(`Advertencia: Error al actualizar stock del producto ${detalle.id_producto}:`, updateStockError);
                                            } else {
                                                console.log(`Stock actualizado para producto ${detalle.id_producto}: ${producto.stock} -> ${nuevoStock}`);
                                            }
                                        }
                                    } catch (stockError) {
                                        console.error('Advertencia: Error al actualizar stock de productos:', stockError);
                                    }
                                }
                            } catch (detalleError) {
                                console.error('Advertencia: Error al procesar detalles del pedido:', detalleError);
                            }

                            resultado.pedidoId = pedido.id_pedido;
                        }
                    } catch (pedidoError) {
                        console.error('Advertencia: Error al crear pedido:', pedidoError);
                    }

                    try {
                        await supabase
                            .from('transacciones_pendientes')
                            .delete()
                            .eq('buy_order', response.buy_order);
                    } catch (deleteError) {
                        console.error('Advertencia: Error al eliminar transacción pendiente:', deleteError);
                    }
                }
            } catch (dbOperationError) {
                console.error('Advertencia: Error en operaciones de base de datos:', dbOperationError);
            }
        }

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al confirmar transacción WebPay:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al confirmar transacción WebPay'
        });
    }
};

exports.manejarTransaccionAbortada = async (req, res) => {
    try {
        const { TBK_TOKEN, TBK_ORDEN_COMPRA, TBK_ID_SESION } = req.body;
        
        if (TBK_TOKEN) {
            try {
                const transaction = getTransactionInstance();
                const status = await transaction.status(TBK_TOKEN);
                console.log('Estado de transacción abortada:', status);
            } catch (error) {
                console.error('Error al consultar estado de transacción abortada:', error);
            }

            return res.status(200).json({
                success: false,
                error: 'Transacción cancelada por el usuario',
                orderCode: TBK_ORDEN_COMPRA,
                sessionId: TBK_ID_SESION
            });
        }

        return res.status(400).json({
            success: false,
            error: 'Parámetros insuficientes'
        });
    } catch (error) {
        console.error('Error al manejar transacción abortada:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al manejar transacción abortada'
        });
    }
};

exports.manejarTimeout = async (req, res) => {
    try {
        const { TBK_ID_SESION, TBK_ORDEN_COMPRA } = req.body;

        if (!TBK_ID_SESION || !TBK_ORDEN_COMPRA) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros insuficientes'
            });
        }

        return res.status(200).json({
            success: false,
            error: 'Tiempo de espera excedido',
            orderCode: TBK_ORDEN_COMPRA,
            sessionId: TBK_ID_SESION
        });
    } catch (error) {
        console.error('Error al manejar timeout:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al manejar timeout'
        });
    }
}; 