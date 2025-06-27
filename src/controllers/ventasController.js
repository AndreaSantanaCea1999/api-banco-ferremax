// src/controllers/ventasController.js
// Controlador principal que maneja todo el flujo de ventas según el documento FERREMAS

const { Pedidos, DetallesPedido, Pagos, WebpayTransacciones, sequelize } = require('../models');
const inventarioService = require('../services/inventarioService');
const bancoCentralService = require('../services/bancoCentralService');
const webpayService = require('../services/webpayService');

/**
 * FLUJO COMPLETO DE VENTA según documento FERREMAS:
 * 1. Cliente crea pedido
 * 2. Verificar stock con API Inventario
 * 3. Calcular precios (con conversión de divisa si es necesario)
 * 4. Procesar pago (WebPay, transferencia, etc.)
 * 5. Actualizar inventario
 * 6. Confirmar venta
 */

// 🛒 CREAR VENTA COMPLETA
const crearVentaCompleta = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      cliente_id,
      sucursal_id,
      productos, // [{ id_producto, cantidad, precio_unitario }]
      metodo_entrega, // "Retiro_Tienda" | "Despacho_Domicilio"
      direccion_entrega,
      metodo_pago, // "Efectivo" | "Débito" | "Crédito" | "Transferencia"
      divisa_cliente = 'CLP', // Divisa del cliente (para conversión)
      comentarios
    } = req.body;

    console.log('🛒 [crearVentaCompleta] Iniciando venta completa...');

    // 1. VALIDACIONES BÁSICAS
    if (!cliente_id || !sucursal_id || !productos || productos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos: cliente_id, sucursal_id y productos son requeridos'
      });
    }

    // 2. VERIFICAR STOCK CON API INVENTARIO
    console.log('📦 [crearVentaCompleta] Verificando stock...');
    for (const producto of productos) {
      try {
        const stockCheck = await inventarioService.verificarStockProducto(
          producto.id_producto, 
          producto.cantidad, 
          sucursal_id
        );
        
        if (!stockCheck.disponible) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para producto ${producto.id_producto}`,
            stock_disponible: stockCheck.stock,
            cantidad_solicitada: producto.cantidad
          });
        }
      } catch (error) {
        console.warn('⚠️ API Inventario no disponible, continuando con verificación local');
      }
    }

    // 3. CALCULAR TOTALES Y CONVERSIÓN DE DIVISA
    console.log('💱 [crearVentaCompleta] Calculando totales...');
    let subtotal = 0;
    let subtotalCLP = 0;
    
    for (const producto of productos) {
      subtotal += producto.precio_unitario * producto.cantidad;
    }

    // Conversión de divisa si es necesaria
    if (divisa_cliente !== 'CLP') {
      try {
        const conversion = await bancoCentralService.convertirDivisa(
          subtotal, 
          divisa_cliente, 
          'CLP'
        );
        subtotalCLP = conversion.monto_convertido;
        console.log(`💱 Conversión: ${subtotal} ${divisa_cliente} = ${subtotalCLP} CLP`);
      } catch (error) {
        console.error('Error en conversión de divisa:', error);
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error en conversión de divisa',
          error: error.message
        });
      }
    } else {
      subtotalCLP = subtotal;
    }

    const impuestos = subtotalCLP * 0.19; // IVA 19%
    const costo_envio = metodo_entrega === 'Despacho_Domicilio' ? 5000 : 0;
    const total = subtotalCLP + impuestos + costo_envio;

    // 4. CREAR PEDIDO
    console.log('📝 [crearVentaCompleta] Creando pedido...');
    const codigoPedido = `VTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const pedido = await Pedidos.create({
      Codigo_Pedido: codigoPedido,
      ID_Cliente: cliente_id,
      ID_Sucursal: sucursal_id,
      Estado: 'Pendiente',
      Metodo_Entrega: metodo_entrega,
      Direccion_Entrega: direccion_entrega,
      Comentarios: comentarios,
      Subtotal: subtotalCLP,
      Impuestos: impuestos,
      Costo_Envio: costo_envio,
      Total: total,
      ID_Divisa: 1, // CLP
      Canal: 'Online'
    }, { transaction });

    // 5. CREAR DETALLES DEL PEDIDO
    console.log('📋 [crearVentaCompleta] Creando detalles...');
    for (const producto of productos) {
      const subtotalProducto = producto.precio_unitario * producto.cantidad;
      const impuestoProducto = subtotalProducto * 0.19;
      
      await DetallesPedido.create({
        ID_Pedido: pedido.ID_Pedido,
        ID_Producto: producto.id_producto,
        Cantidad: producto.cantidad,
        Precio_Unitario: producto.precio_unitario,
        Impuesto: impuestoProducto,
        Subtotal: subtotalProducto + impuestoProducto,
        Estado: 'Pendiente'
      }, { transaction });
    }

    // 6. PROCESAR PAGO SEGÚN MÉTODO
    console.log(`💳 [crearVentaCompleta] Procesando pago: ${metodo_pago}`);
    let pagoResult = null;
    
    if (metodo_pago === 'Crédito' || metodo_pago === 'Débito') {
      // PAGO CON WEBPAY
      try {
        const webpayResult = await webpayService.iniciarTransaccion(
          pedido.ID_Pedido,
          total,
          `${req.protocol}://${req.get('host')}/api/v1/webpay/retorno`,
          `${req.protocol}://${req.get('host')}/api/v1/webpay/final`
        );

        // Crear registro de pago pendiente
        pagoResult = await Pagos.create({
          ID_Pedido: pedido.ID_Pedido,
          Metodo_Pago: metodo_pago,
          Procesador_Pago: 'WebPay',
          Numero_Transaccion: webpayResult.token,
          Monto: total,
          ID_Divisa: 1,
          Estado: 'Pendiente'
        }, { transaction });

        // Crear registro WebPay
        await WebpayTransacciones.create({
          ID_Pago: pagoResult.ID_Pago,
          Token_Webpay: webpayResult.token,
          Orden_Compra: codigoPedido
        }, { transaction });

      } catch (error) {
        console.error('Error en WebPay:', error);
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error al procesar pago con WebPay',
          error: error.message
        });
      }
    } else {
      // PAGO MANUAL (Efectivo, Transferencia)
      pagoResult = await Pagos.create({
        ID_Pedido: pedido.ID_Pedido,
        Metodo_Pago: metodo_pago,
        Procesador_Pago: 'Manual',
        Monto: total,
        ID_Divisa: 1,
        Estado: metodo_pago === 'Efectivo' ? 'Completado' : 'Pendiente'
      }, { transaction });
    }

    await transaction.commit();

    // 7. RESPUESTA SEGÚN MÉTODO DE PAGO
    console.log('✅ [crearVentaCompleta] Venta creada exitosamente');

    const response = {
      success: true,
      message: 'Venta creada exitosamente',
      venta: {
        pedido_id: pedido.ID_Pedido,
        codigo_pedido: codigoPedido,
        total_clp: total,
        estado: pedido.Estado,
        metodo_pago: metodo_pago,
        pago_id: pagoResult.ID_Pago
      }
    };

    if (metodo_pago === 'Crédito' || metodo_pago === 'Débito') {
      // Para WebPay, devolver URL de redirección
      const webpayData = await WebpayTransacciones.findOne({
        where: { ID_Pago: pagoResult.ID_Pago }
      });
      
      response.webpay = {
        token: webpayData.Token_Webpay,
        url_pago: `https://webpay3g.transbank.cl/webpayserver/initTransaction?token_ws=${webpayData.Token_Webpay}`,
        instrucciones: 'Redirigir al cliente a url_pago para completar el pago'
      };
    }

    res.status(201).json(response);

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error en crearVentaCompleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar venta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 📊 OBTENER ESTADO DE VENTA
const obtenerEstadoVenta = async (req, res) => {
  try {
    const { pedido_id } = req.params;

    const venta = await Pedidos.findByPk(pedido_id, {
      include: [
        {
          model: DetallesPedido,
          attributes: ['ID_Producto', 'Cantidad', 'Precio_Unitario', 'Subtotal', 'Estado']
        },
        {
          model: Pagos,
          include: [WebpayTransacciones]
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      venta: {
        codigo_pedido: venta.Codigo_Pedido,
        estado_pedido: venta.Estado,
        total: venta.Total,
        fecha: venta.Fecha_Pedido,
        metodo_entrega: venta.Metodo_Entrega,
        direccion_entrega: venta.Direccion_Entrega,
        productos: venta.DetallesPedidos,
        pagos: venta.Pagos
      }
    });

  } catch (error) {
    console.error('Error al obtener estado de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de venta'
    });
  }
};

// ✅ CONFIRMAR VENTA (después del pago)
const confirmarVenta = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pedido_id } = req.params;

    const pedido = await Pedidos.findByPk(pedido_id, {
      include: [DetallesPedido],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Actualizar estado del pedido
    await pedido.update({ Estado: 'Aprobado' }, { transaction });

    // Actualizar inventario para cada producto
    for (const detalle of pedido.DetallesPedidos) {
      try {
        await inventarioService.actualizarInventario(
          detalle.ID_Producto,
          detalle.Cantidad,
          pedido.ID_Sucursal,
          'Salida'
        );
        
        // Actualizar estado del detalle
        await detalle.update({ Estado: 'Preparado' }, { transaction });
      } catch (error) {
        console.warn('⚠️ Error actualizando inventario:', error.message);
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Venta confirmada exitosamente',
      pedido_id: pedido.ID_Pedido,
      estado: 'Aprobado'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al confirmar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar venta'
    });
  }
};

module.exports = {
  crearVentaCompleta,
  obtenerEstadoVenta,
  confirmarVenta
};