// src/services/pedido.service.js
const axios = require('axios');
const pedidoDbModel = require('../models/pedido.db.model');
const inventarioService = require('./inventario.service'); 
const webpayService = require('./webpay.service');

/**
 * Crea un nuevo pedido y registra el pago inicial.
 * @param {Object} datosPedido - Datos del pedido a crear
 * @param {Array} items - Items incluidos en el pedido
 * @returns {Object} Objeto con información del pedido creado y URL de pago
 */
async function crearPedido(datosPedido, items) {
    // 1. Validar stock en todas las sucursales seleccionadas
    for (const item of items) {
        const stockDisponible = await inventarioService.verificarStockEnInventario(
            item.productoId, 
            datosPedido.sucursalId
        );
        
        if (stockDisponible < item.cantidad) {
            throw new Error(`Stock insuficiente para producto ID ${item.productoId}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`);
        }
    }
    
    // 2. Preparar detalles del pedido con la información completa
    const detallesItems = [];
    for (const item of items) {
        // Obtener información completa del producto desde inventario
        const producto = await inventarioService.obtenerProductoDeInventario(item.productoId);
        if (!producto) {
            throw new Error(`Producto con ID ${item.productoId} no encontrado en el catálogo`);
        }
        
        // Calcular subtotal por ítem
        const subtotalItem = item.cantidad * producto.Precio_Venta;
        
        detallesItems.push({
            productoIdExterno: item.productoId,
            nombreProducto: producto.Nombre,
            cantidad: item.cantidad,
            precioUnitario: producto.Precio_Venta,
            descuentoItem: item.descuento || 0,
            impuestoItem: producto.Tasa_Impuesto ? (subtotalItem * producto.Tasa_Impuesto / 100) : 0,
            subtotalItem: subtotalItem
        });
    }
    
    // 3. Crear el pedido en la base de datos
    const pedidoCreado = await pedidoDbModel.crearPedidoConDetalles(datosPedido, detallesItems);
    
    // 4. Registrar el pago inicial pendiente
    const idPago = await pedidoDbModel.crearRegistroPagoInicial(
        pedidoCreado.id, 
        pedidoCreado.total, 
        pedidoCreado.idDivisa,
        'Webpay'
    );
    
    // 5. Iniciar la transacción en Webpay
    const sessionId = `SESSION_${pedidoCreado.id}_${Date.now()}`;
    const returnUrl = `${process.env.API_URL || 'http://localhost:3000'}/api/pedidos/webpay/confirmacion`;
    
    const { token, urlRedireccion } = await webpayService.iniciarTransaccion(
        pedidoCreado.total, 
        pedidoCreado.codigoPedido, 
        sessionId, 
        returnUrl
    );
    
    return {
        pedido: pedidoCreado,
        idPago,
        pago: {
            token,
            urlPago: urlRedireccion
        }
    };
}

/**
 * Procesa la confirmación de un pago Webpay
 * @param {string} token - Token de la transacción Webpay
 * @returns {Object} - Resultado del procesamiento de pago
 */
async function procesarConfirmacionPago(token) {
    try {
        // 1. Confirmar transacción con Webpay
        const resultadoWebpay = await webpayService.confirmarTransaccion(token);
        
        // 2. Verificar que la transacción fue aprobada
        if (resultadoWebpay.status !== 'AUTHORIZED') {
            throw new Error(`Transacción rechazada: ${resultadoWebpay.status}`);
        }
        
        // 3. Buscar el pedido por su código (buy_order)
        const pedido = await pedidoDbModel.obtenerPedidoPorCodigo(resultadoWebpay.buy_order);
        if (!pedido) {
            throw new Error(`Pedido no encontrado para order: ${resultadoWebpay.buy_order}`);
        }
        
        // 4. Buscar el pago pendiente asociado
        const idPago = await pedidoDbModel.obtenerIdPagoPorPedidoIdYEstado(pedido.ID_Pedido, 'Pendiente');
        if (!idPago) {
            throw new Error(`Pago pendiente no encontrado para pedido: ${pedido.ID_Pedido}`);
        }
        
        // 5. Registrar la transacción Webpay
        await pedidoDbModel.registrarTransaccionWebpay({
            idPago,
            tokenWebpay: token,
            ordenCompra: resultadoWebpay.buy_order,
            tipoTarjeta: resultadoWebpay.payment_type_code,
            numeroTarjeta: resultadoWebpay.card_detail?.card_number || null,
            codigoAutorizacion: resultadoWebpay.authorization_code,
            codigoRespuesta: resultadoWebpay.response_code === 0 ? 'APROBADO' : 'RECHAZADO',
            descripcionRespuesta: resultadoWebpay.response_code === 0 ? 'Transacción aprobada' : 'Transacción rechazada',
            cuotas: resultadoWebpay.installments_number || 1,
            jsonRespuestaCompleta: resultadoWebpay
        });
        
        // 6. Actualizar el estado del pago
        await pedidoDbModel.actualizarEstadoPago(idPago, 'Completado');
        
        // 7. Actualizar el estado del pedido
        await pedidoDbModel.actualizarEstadoPedido(
            pedido.ID_Pedido, 
            'Aprobado', 
            pedido.ID_Usuario, 
            'Pago aprobado por Webpay'
        );
        
        // 8. Descontar stock del inventario
        const detallesPedido = await pedidoDbModel.obtenerDetallesPorPedidoId(pedido.ID_Pedido);
        for (const detalle of detallesPedido) {
            try {
                await inventarioService.actualizarStockEnInventario(
                    detalle.ProductoIdExterno,
                    pedido.ID_Sucursal,
                    detalle.Cantidad,
                    pedido.ID_Pedido
                );
            } catch (stockError) {
                // Loguear el error pero no impedir que continue el flujo
                console.error(`Error al actualizar stock para producto ${detalle.ProductoIdExterno}:`, stockError);
            }
        }
        
        return {
            success: true,
            message: 'Pago procesado exitosamente',
            pedidoId: pedido.ID_Pedido,
            codigoPedido: resultadoWebpay.buy_order,
            monto: resultadoWebpay.amount,
            detallesTransaccion: resultadoWebpay
        };
    } catch (error) {
        console.error('Error al procesar confirmación de pago:', error);
        throw error;
    }
}

/**
 * Obtiene un pedido por su ID con todos sus detalles
 * @param {number} idPedido - ID del pedido a obtener
 */
async function obtenerPedidoPorId(idPedido) {
    return pedidoDbModel.obtenerPedidoPorId(idPedido);
}

/**
 * Obtiene una lista de pedidos con filtros opcionales
 * @param {Object} filtros - Filtros a aplicar
 * @param {Object} paginacion - Opciones de paginación
 */
async function listarPedidos(filtros = {}, paginacion = { limit: 10, offset: 0 }) {
    return pedidoDbModel.obtenerTodosLosPedidos(filtros, paginacion);
}

module.exports = {
    crearPedido,
    procesarConfirmacionPago,
    obtenerPedidoPorId,
    listarPedidos
};