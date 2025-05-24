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
            console.log('Guardando datos de transacción para buyOrder:', buyOrder);
            console.log('userId recibido:', userId);
            
            // Asegurarnos que userId sea un número (si viene como string)
            const userIdNum = userId ? parseInt(userId, 10) : null;
            
            const { data, error } = await supabase
                .from('transacciones_pendientes')
                .insert({
                    buy_order: buyOrder,
                    session_id: sessionId,
                    amount: amount,
                    items: items,
                    user_id: userIdNum || null // Asegurarse de que sea un número o null
                });

            if (error) {
                console.error('Advertencia: Error al guardar transacción pendiente en la base de datos:', error);
                // No detener el flujo, solo registrar el error
            } else {
                console.log('Transacción pendiente guardada correctamente en la base de datos:', data);
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

        console.log('Iniciando confirmación de transacción con token:', token_ws);

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
                console.log('Buscando transacción pendiente para buy_order:', response.buy_order);
                
                // Buscar datos de la transacción pendiente
                let transaccion = null;
                let userId = 1; // ID por defecto si no encontramos la transacción
                
                try {
                    const { data, error } = await supabase
                        .from('transacciones_pendientes')
                        .select('*')
                        .eq('buy_order', response.buy_order)
                        .single();
                        
                    if (error) {
                        console.error('Error al buscar transacción pendiente:', error);
                    } else if (data) {
                        console.log('Transacción pendiente encontrada:', data);
                        transaccion = data;
                        userId = transaccion.user_id || 1;
                    } else {
                        console.log('No se encontró la transacción pendiente, usando valores por defecto');
                    }
                } catch (searchError) {
                    console.error('Error al buscar transacción pendiente:', searchError);
                }
                
                // Intentar crear el pedido
                console.log('Creando pedido para user_id:', userId);
                
                try {
                    const { data: pedido, error: insertPedidoError } = await supabase
                        .from('pedido')
                        .insert({
                            fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
                            medio_pago_id: 2, // WebPay
                            id_estado_envio: 1, // Estado inicial de envío
                            id_estado: 1, // Estado inicial de pedido
                            id_cliente: userId // El user_id es equivalente al id_cliente
                        })
                        .select()
                        .single();

                    if (insertPedidoError) {
                        console.error('Error al crear pedido:', insertPedidoError);
                    } else {
                        console.log('Pedido creado correctamente:', pedido);
                        
                        // Intentar insertar detalles del pedido si tenemos los items
                        if (transaccion && transaccion.items && Array.isArray(transaccion.items)) {
                            try {
                                const detallesPedido = transaccion.items.map(item => ({
                                    cantidad: item.cantidad || 1,
                                    precio_unitario: item.precio || 0,
                                    subtotal: (item.precio || 0) * (item.cantidad || 1),
                                    id_pedido: pedido.id_pedido,
                                    id_producto: item.id
                                }));

                                const { error: insertDetalleError } = await supabase
                                    .from('pedido_producto')
                                    .insert(detallesPedido);

                                if (insertDetalleError) {
                                    console.error('Error al insertar detalles del pedido:', insertDetalleError);
                                } else {
                                    console.log('Detalles del pedido agregados correctamente');
                                }
                            } catch (detalleError) {
                                console.error('Error al procesar detalles del pedido:', detalleError);
                            }
                        } else {
                            console.log('No hay items disponibles para agregar al pedido');
                        }

                        // Añadir el ID del pedido al resultado
                        resultado.pedidoId = pedido.id_pedido;
                    }
                } catch (pedidoError) {
                    console.error('Error al crear pedido:', pedidoError);
                }

                // Intentar eliminar la transacción pendiente si existe
                if (transaccion) {
                    try {
                        const { error: deleteError } = await supabase
                            .from('transacciones_pendientes')
                            .delete()
                            .eq('buy_order', response.buy_order);
                            
                        if (deleteError) {
                            console.error('Error al eliminar transacción pendiente:', deleteError);
                        } else {
                            console.log('Transacción pendiente eliminada correctamente');
                        }
                    } catch (deleteError) {
                        console.error('Error al eliminar transacción pendiente:', deleteError);
                    }
                }
            } catch (dbOperationError) {
                console.error('Error en operaciones de base de datos:', dbOperationError);
            }
        } else {
            console.log(`Transacción NO autorizada. Estado: ${response.status}`);
        }

        // Retornar el resultado al cliente
        console.log('Enviando resultado final al cliente:', resultado);
        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al confirmar transacción WebPay:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al confirmar transacción WebPay',
            details: error.message
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