const { WebpayPlus } = require('transbank-sdk');
const supabase = require('../config/db');
const { 
    WEBPAY_INTEGRATION_URL, 
    WEBPAY_PRODUCTION_URL, 
    getTransactionInstance 
} = require('../config/webpayConfig');

// Función auxiliar para obtener URL base según entorno
const getWebpayBaseUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? WEBPAY_PRODUCTION_URL 
        : WEBPAY_INTEGRATION_URL;
};

// Iniciar transacción en WebPay
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

        // Obtener una instancia configurada de Transaction
        const transaction = getTransactionInstance();
        
        // Crear la transacción usando create()
        const response = await transaction.create(
            buyOrder, 
            sessionId, 
            amount, 
            returnUrl
        );

        console.log('Transacción iniciada:', response);

        // Intentar guardar la transacción en la base de datos, pero continuar incluso si falla
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
                // No detener el flujo, solo registrar el error
            } else {
                console.log('Transacción pendiente guardada correctamente en la base de datos');
            }
        } catch (dbError) {
            console.error('Advertencia: Error al intentar guardar en la base de datos:', dbError);
            // No detener el flujo, solo registrar el error
        }

        // Siempre devolver la respuesta de la transacción, incluso si hubo error en la BD
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

// Confirmar transacción en WebPay
exports.confirmarTransaccion = async (req, res) => {
    try {
        const { token_ws } = req.body;

        if (!token_ws) {
            return res.status(400).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        // Obtener una instancia configurada de Transaction
        const transaction = getTransactionInstance();
        
        // Confirmar transacción
        const response = await transaction.commit(token_ws);
        console.log('Respuesta de confirmación:', response);

        // Variable para almacenar el resultado final
        let resultado = {
            success: response.status === 'AUTHORIZED',
            message: response.status === 'AUTHORIZED' ? 'Pago completado con éxito' : 'Transacción rechazada o cancelada',
            transaction: response
        };

        // Solo intentar operaciones de base de datos si la transacción fue autorizada
        if (response.status === 'AUTHORIZED') {
            try {
                // Buscar datos de la transacción pendiente
                const { data: transaccion, error: selectError } = await supabase
                    .from('transacciones_pendientes')
                    .select('*')
                    .eq('buy_order', response.buy_order)
                    .single();

                if (selectError || !transaccion) {
                    console.error('Advertencia: No se encontró la transacción pendiente:', selectError);
                    // Continuar sin datos de la transacción pendiente
                } else {
                    // Intentar crear el pedido en la base de datos
                    try {
                        const { data: pedido, error: insertPedidoError } = await supabase
                            .from('pedidos')
                            .insert({
                                user_id: transaccion.user_id,
                                monto_total: transaccion.amount,
                                medio_pago_id: 2,
                                id_estado_envio: 2,
                                id_estado: 1
                            })
                            .select()
                            .single();

                        if (insertPedidoError) {
                            console.error('Advertencia: Error al crear pedido:', insertPedidoError);
                        } else {
                            // Intentar insertar detalles del pedido
                            try {
                                const detallesPedido = transaccion.items.map(item => ({
                                    pedido_id: pedido.id,
                                    producto_id: item.id,
                                    cantidad: item.cantidad,
                                    precio_unitario: item.precio
                                }));

                                const { error: insertDetalleError } = await supabase
                                    .from('detalle_pedido')
                                    .insert(detallesPedido);

                                if (insertDetalleError) {
                                    console.error('Advertencia: Error al insertar detalles del pedido:', insertDetalleError);
                                }
                            } catch (detalleError) {
                                console.error('Advertencia: Error al procesar detalles del pedido:', detalleError);
                            }

                            // Añadir el ID del pedido al resultado
                            resultado.pedidoId = pedido.id;
                        }
                    } catch (pedidoError) {
                        console.error('Advertencia: Error al crear pedido:', pedidoError);
                    }

                    // Intentar eliminar la transacción pendiente
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

        // Retornar el resultado al cliente
        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al confirmar transacción WebPay:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al confirmar transacción WebPay'
        });
    }
};

// Manejar transacción abortada
exports.manejarTransaccionAbortada = async (req, res) => {
    try {
        const { TBK_TOKEN, TBK_ORDEN_COMPRA, TBK_ID_SESION } = req.body;

        // Verificar si la transacción fue abortada
        if (TBK_TOKEN) {
            // Consultar estado de la transacción (opcional)
            try {
                // Obtener una instancia configurada de Transaction
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

// Manejar timeout de transacción
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