const { WebpayPlus } = require('transbank-sdk');
const supabase = require('../config/db');
const { WEBPAY_INTEGRATION_URL, WEBPAY_PRODUCTION_URL } = require('../config/webpayConfig');

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

        // Inicializar transacción en WebPay usando Transaction.create
        const response = await WebpayPlus.Transaction.create(
            buyOrder, 
            sessionId, 
            amount, 
            returnUrl
        );

        console.log('Transacción iniciada:', response);

        // Guardamos los datos de la orden para usarlos después
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
            console.error('Error al guardar transacción pendiente:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al guardar transacción pendiente'
            });
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

        // Confirmar transacción usando Transaction.commit
        const response = await WebpayPlus.Transaction.commit(token_ws);
        console.log('Respuesta de confirmación:', response);

        if (response.status === 'AUTHORIZED') {
            // Buscar datos de la transacción pendiente
            const { data: transaccion, error: selectError } = await supabase
                .from('transacciones_pendientes')
                .select('*')
                .eq('buy_order', response.buy_order)
                .single();

            if (selectError || !transaccion) {
                return res.status(404).json({
                    success: false,
                    error: 'Transacción no encontrada'
                });
            }

            // Crear pedido en base de datos
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
                console.error('Error al crear pedido:', insertPedidoError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al crear pedido'
                });
            }

            // Insertar detalles del pedido
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
                console.error('Error al insertar detalles del pedido:', insertDetalleError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al insertar detalles del pedido'
                });
            }

            // Eliminar transacción pendiente
            await supabase
                .from('transacciones_pendientes')
                .delete()
                .eq('buy_order', response.buy_order);

            return res.status(200).json({
                success: true,
                message: 'Pago completado con éxito',
                pedidoId: pedido.id,
                transaction: response
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Transacción rechazada o cancelada',
                transaction: response
            });
        }
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
                const status = await WebpayPlus.Transaction.status(TBK_TOKEN);
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