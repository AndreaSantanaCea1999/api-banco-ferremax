// c:\Users\andre\api-banco-ferremax\src\controllers\pedidos.controller.js

const PedidoDB = require('../models/pedido.db.model'); // Usar el modelo de base de datos
const webpayService = require('../services/webpay.service');
const bancoCentralService = require('../services/bancoCentral.service'); // Importar el servicio completo
const inventarioService = require('../services/inventario.service'); // Para interactuar con API de Inventario
const axios = require('axios'); // Importar axios para verificar si el error es de red

// POST /api/pedidos
exports.crearPedido = async (req, res) => {
  // Extraer todos los campos necesarios del body, incluyendo los que necesita PedidoDB.crearPedidoConDetalles
  const { clienteId, items, moneda = 'CLP', montoUSD, sucursalId, usuarioId, vendedorId, metodoEntrega, direccionEntrega, ciudadEntrega, regionEntrega, paisEntrega, comentarios, fechaEstimadaEntrega, prioridad } = req.body;

  if (!clienteId || !items || !Array.isArray(items) || items.length === 0 || !sucursalId || !usuarioId) {
    return res.status(400).json({ error: 'Datos incompletos: clienteId, items, sucursalId y usuarioId son requeridos.' });
  }

  let totalPedido = 0;
  const itemsConInfoInventario = []; // Para almacenar info del inventario y evitar llamadas duplicadas

  for (const item of items) {
    if (!item.productoId || typeof item.cantidad !== 'number' || typeof item.precioUnitario !== 'number') {
      return res.status(400).json({ error: `Item inválido: ${JSON.stringify(item)}. Se requiere productoId (string), cantidad (number) y precioUnitario (number).` });
    }

    try { // Un solo try-catch para todas las operaciones del item que pueden fallar (obtener producto, verificar stock)
      // 1. Obtener información del producto (precio, nombre) desde la API de Inventario
      const productoInventario = await inventarioService.obtenerProductoDeInventario(item.productoId);
      if (!productoInventario) {
        return res.status(400).json({ error: `Producto con ID '${item.productoId}' no fue encontrado en el sistema de inventario o no se pudo obtener su información.` });
      }

      // Usar el precio de la API de inventario para mayor seguridad y consistencia
      const precioReal = productoInventario.Precio_Venta; // Ajusta 'Precio_Venta' al nombre real del campo en tu API de inventario

      // 2. Verificar stock desde la API de Inventario
      const stockDisponible = await inventarioService.verificarStockEnInventario(item.productoId, sucursalId);
      if (item.cantidad <= 0 || item.cantidad > stockDisponible) { // Validar cantidad positiva y stock
        return res.status(400).json({ error: `Stock insuficiente para ${productoInventario.Nombre || `producto ${item.productoId}`}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`});
      }

      totalPedido += item.cantidad * precioReal;
      itemsConInfoInventario.push({
        ...item, // productoId, cantidad (precioUnitario del request se ignora si usamos precioReal)
        precioReal,
        nombreProducto: productoInventario.Nombre || `Producto ${item.productoId}` // Usar un placeholder si el nombre no viene
      });

    } catch (invError) {
      console.error(`Error al procesar el item ${item.productoId} durante la interacción con el inventario:`, invError);
      let statusCode = 502; // Bad Gateway si la API externa falla
      let errorMessage = `Error al interactuar con el inventario para el producto ${item.productoId}.`;
      let errorDetail = invError.message;

      if (axios.isAxiosError(invError) && invError.response) {
          statusCode = invError.response.status; // Usar el código de estado de la API de inventario si está disponible
          errorMessage = invError.response.data?.error || invError.response.data?.message || `Error ${statusCode} desde el servicio de inventario para el producto ${item.productoId}.`;
          errorDetail = invError.response.data || invError.message;
      } else {
          errorMessage = invError.message || errorMessage; // Actualiza errorMessage si invError.message existe
          errorDetail = invError.message || errorDetail; // Actualiza errorDetail si invError.message existe
      }
      return res.status(statusCode).json({ error: errorMessage, detalle: errorDetail });
    }
  }

  // TODO: Calcular impuestos, descuentos y costo de envío para el total final
  const subtotalPedido = totalPedido;
  const impuestosPedido = 0; // Simulación, calcular basado en items o configuración
  const costoEnvioPedido = 0; // Simulación, calcular basado en dirección/método
  const totalFinalDelPedidoEnSuMoneda = subtotalPedido + impuestosPedido + costoEnvioPedido;

  let montoCLPParaWebpay = totalFinalDelPedidoEnSuMoneda;
  let idDivisaPedido = 1; // Asumir CLP por defecto (ID 1 en tu tabla DIVISAS)

  if (moneda === 'USD') {
    if (!montoUSD || typeof montoUSD !== 'number' || montoUSD <= 0) {
      return res.status(400).json({ error: 'Si la moneda es USD, se requiere un montoUSD numérico y positivo.' });
    }
    try {
      const tasaDolar = await bancoCentralService.getDolarRate();
      montoCLPParaWebpay = parseFloat((montoUSD * tasaDolar).toFixed(2));
      // totalFinalDelPedidoEnSuMoneda = montoUSD; // El total del pedido es el montoUSD
      // TODO: Obtener el ID_Divisa para 'USD' de tu tabla DIVISAS
      // Necesitarías una función en el modelo o un servicio para obtener ID_Divisa por código
      idDivisaPedido = 2; // Asumir USD es ID 2
      console.log(`Pedido en USD: ${montoUSD}, Tasa: ${tasaDolar}, Monto para Webpay (CLP): ${montoCLPParaWebpay}`);
    } catch (error) {
      console.error('Error al convertir moneda para pedido:', error);
      return res.status(500).json({ error: 'Error al procesar conversión de moneda para el pago.', detalle: error.message });
    }
  }

  // TODO: Validar que clienteId, sucursalId, usuarioId existan en la BD
  // Podrías añadir llamadas a modelos de Usuario, Cliente, Sucursal aquí.

  const datosPedidoParaBD = {
    clienteId,
    sucursalId,
    usuarioId, // Usuario que crea el pedido
    vendedorId: vendedorId || null,
    canal: canal || 'Online',
    metodoEntrega: metodoEntrega || 'Despacho_Domicilio',
    direccionEntrega,
    ciudadEntrega,
    regionEntrega,
    paisEntrega: paisEntrega || 'Chile',
    comentarios,
    subtotal: subtotalPedido,
    descuento: 0, // TODO: Implementar lógica de descuentos
    impuestos: impuestosPedido,
    costoEnvio: costoEnvioPedido,
    total: totalFinalDelPedidoEnSuMoneda, // Total en la moneda del pedido
    idDivisa: idDivisaPedido,
    fechaEstimadaEntrega: fechaEstimadaEntrega || null,
    prioridad: prioridad || 'Normal'
  };

  // Usar la información ya obtenida de la API de inventario
  const detallesItemsParaBD = itemsConInfoInventario.map(item => {
    return {
      productoIdExterno: item.productoId,
      nombreProducto: item.nombreProducto, // Nombre obtenido del inventario
      cantidad: item.cantidad,
      precioUnitario: item.precioReal, // Precio obtenido del inventario
      descuentoItem: 0, // TODO
      impuestoItem: 0, // TODO: Calcular impuesto por item si es necesario
      subtotalItem: item.cantidad * item.precioReal
    };
  });

  try {
    // 1. Crear el pedido en la base de datos de ESTA API
    const nuevoPedidoConId = await PedidoDB.crearPedidoConDetalles(datosPedidoParaBD, detallesItemsParaBD);

    // 2. Crear un registro de PAGO inicial
    const idPago = await PedidoDB.crearRegistroPagoInicial(nuevoPedidoConId.id, montoCLPParaWebpay, datosPedidoParaBD.idDivisa); // Usar idDivisa del pedido

    // 3. Iniciar transacción con Webpay
    // En una app real, la returnUrl apuntaría a un endpoint de tu frontend/backend para confirmar el pago
    const returnUrl = `${req.protocol}://${req.get('host')}/api/pedidos/webpay/confirmacion`;
    const webpayResponse = await webpayService.iniciarTransaccion(
      montoCLPParaWebpay, // Siempre en CLP para Webpay
      nuevoPedidoConId.codigoPedido, // Usar el código de pedido único generado
      req.sessionID || `session_${Date.now()}`, // Un ID de sesión
      returnUrl
    );

    // 4. Registrar el inicio de la transacción de Webpay (token inicial)
    // Solo registramos el token inicial y la orden de compra. Los detalles completos se registran en la confirmación.
    await PedidoDB.registrarTransaccionWebpay({
        idPago,
        tokenWebpay: webpayResponse.token, // Este es el token inicial para la redirección
        ordenCompra: nuevoPedidoConId.codigoPedido,
        cuotas: 1, // O un valor por defecto/configurable
        codigoRespuesta: 'INIT', // Estado inicial
        descripcionRespuesta: 'Transacción Webpay iniciada',
        jsonRespuestaCompleta: { token_inicial: webpayResponse.token, url_redireccion: webpayResponse.urlRedireccion }
    });
    res.status(201).json({
      mensaje: 'Pedido creado e iniciada transacción en Webpay.',
      pedido: nuevoPedidoConId, // Devolver el pedido con el ID y código de la BD
      urlRedireccionWebpay: webpayResponse.urlRedireccion
    });
  } catch (error) {
    console.error('Error en el proceso de creación de pedido o iniciación con Webpay:', error);
    let statusCode = 500;
    if (axios.isAxiosError(error) && error.response) {
        statusCode = error.response.status; // Podría ser un error de Webpay o Inventario
    }
    const errorMessage = error.response?.data?.message || error.message;
    // Si el pedido se creó en BD pero Webpay falló, podrías querer marcar el pedido como 'error_pago'
    res.status(statusCode).json({ error: 'Error al procesar el pedido.', detalle: errorMessage });
  }
};

// GET /api/pedidos
exports.obtenerPedidos = async (req, res) => {
  try {
    const paginacion = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0
    };
    // TODO: Pasar filtros desde req.query al modelo si es necesario
    const pedidos = await PedidoDB.obtenerTodosLosPedidos({}, paginacion);
    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener todos los pedidos:", error);
    res.status(500).json({ error: "Error interno al listar los pedidos." });
  }
};

// GET /api/pedidos/:id
exports.obtenerPedidoPorId = async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.id);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ error: 'ID de pedido inválido.' });
    }
    const pedido = await PedidoDB.obtenerPedidoPorId(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener pedido por ID:", error);
    res.status(500).json({ error: "Error interno al buscar el pedido." });
  }
};

// PATCH /api/pedidos/:id
exports.actualizarPedido = async (req, res) => {
  // Este endpoint es para actualizaciones manuales de estado por un admin/vendedor
  const pedidoId = parseInt(req.params.id);
  const { estado, usuarioId, comentario } = req.body; // usuarioId es quien realiza la acción

  if (isNaN(pedidoId)) {
    return res.status(400).json({ error: 'ID de pedido inválido.' });
  }
  if (!estado || !usuarioId) {
    return res.status(400).json({ error: 'Estado y usuarioId son requeridos para actualizar.' });
  }

  try {
    const actualizado = await PedidoDB.actualizarEstadoPedido(pedidoId, estado, usuarioId, comentario);
    if (!actualizado) {
      return res.status(404).json({ error: 'Pedido no encontrado para actualizar.' });
    }
    res.json({ mensaje: `Pedido ${pedidoId} actualizado a estado ${estado}.` });
  } catch (error) {
    console.error(`Error al actualizar pedido ${pedidoId}:`, error);
    res.status(500).json({ error: "Error interno al actualizar el pedido." });
  }
};

// DELETE /api/pedidos/:id (Ej. para cancelar un pedido antes del pago)
exports.eliminarPedido = (req, res) => {
  // Generalmente no se eliminan pedidos, se cancelan.
  // Si necesitas eliminar, implementa la lógica en PedidoDB.
  // Considera las implicaciones (reversión de stock, etc.)
  res.status(501).json({ error: 'Eliminar pedido no implementado. Considere cambiar el estado a "Cancelado".' });
};

// Endpoint para el callback de Webpay (llamado por Transbank)
// POST o GET /api/pedidos/webpay/confirmacion
exports.confirmacionWebpay = async (req, res) => {
  // Webpay puede retornar por POST (flujo normal) o GET (si el usuario cancela y vuelve desde Webpay)
  const tokenWs = req.body.token_ws || req.query.token_ws; // Token de la transacción finalizada
  // Token si el usuario anula la compra en Webpay y es redirigido (TBK_TOKEN es el token inicial)
  const tbkToken = req.body.TBK_TOKEN || req.query.TBK_TOKEN;
  const tbkOrdenCompra = req.body.TBK_ORDEN_COMPRA || req.query.TBK_ORDEN_COMPRA;
  // const tbkIdSesion = req.body.TBK_ID_SESION || req.query.TBK_ID_SESION; // No siempre necesario para la lógica de negocio

  console.log(`[WebpayConfirmacion] Recibido token_ws: ${tokenWs}, TBK_TOKEN: ${tbkToken}, TBK_ORDEN_COMPRA: ${tbkOrdenCompra}`);

  if (tbkToken && tbkOrdenCompra) {
    // Flujo: El usuario canceló el pago en Webpay o hubo un timeout antes de pagar.
    // TBK_TOKEN es el mismo token que se generó al iniciar la transacción.
    // TBK_ORDEN_COMPRA es tu número de orden.
    console.log(`[WebpayConfirmacion] Pago cancelado o timeout para orden ${tbkOrdenCompra} con token inicial ${tbkToken}.`);
    try {
      // Buscar el pedido por Codigo_Pedido (que es tbkOrdenCompra)
      const pedido = await PedidoDB.obtenerPedidoPorCodigo(tbkOrdenCompra);
      if (pedido) {
        // TODO: Definir un ID_USUARIO_SISTEMA o obtener el usuario relevante
        const idUsuarioSistema = pedido.usuarioId || process.env.USUARIO_SISTEMA_ID || 1; // Usar el usuario del pedido o un ID de sistema
        await PedidoDB.actualizarEstadoPedido(pedido.ID_Pedido, 'Cancelado_Webpay', idUsuarioSistema, 'Pago cancelado/interrumpido por usuario en Webpay');
        console.log(`[WebpayConfirmacion] Pedido ${pedido.ID_Pedido} (Orden: ${tbkOrdenCompra}) marcado como Cancelado_Webpay.`);
      }
    } catch (dbError) {
      console.error('[WebpayConfirmacion] Error de BD al procesar cancelación:', dbError);
    }
    // Redirigir al usuario a una página de pago cancelado en tu frontend
    if (process.env.FRONTEND_URL) {
      return res.redirect(`${process.env.FRONTEND_URL}/pago/cancelado?orden=${tbkOrdenCompra}`);
    }
    return res.status(400).json({ mensaje: `Pago cancelado o interrumpido para la orden ${tbkOrdenCompra}.`, flujo: 'cancelado_interrumpido' });
  }

  if (!tokenWs) {
    console.error('[WebpayConfirmacion] No se recibió token_ws ni TBK_TOKEN válidos.');
    // Redirigir a una página de error genérico en tu frontend
    if (process.env.FRONTEND_URL) {
      return res.redirect(`${process.env.FRONTEND_URL}/pago/error?mensaje=token_invalido`);
    }
    return res.status(400).json({ error: "Token de Webpay (token_ws) no recibido y no es un flujo de cancelación." });
  }

  try {
    const confirmacion = await webpayService.confirmarTransaccion(tokenWs);
    console.log('[WebpayConfirmacion] Respuesta de confirmación de Webpay:', confirmacion);

    // Usualmente, un response_code == 0 significa éxito.
    // La orden de compra original (buy_order) debería estar en la respuesta de confirmación.
    const ordenCompraConfirmada = confirmacion.buy_order;

    const pedido = await PedidoDB.obtenerPedidoPorCodigo(ordenCompraConfirmada);

    if (!pedido || !pedido.ID_Pedido) {
      console.error(`[WebpayConfirmacion] No se encontró el pedido para la orden ${ordenCompraConfirmada}.`);
      if (process.env.FRONTEND_URL) {
        return res.redirect(`${process.env.FRONTEND_URL}/pago/error?mensaje=pedido_no_encontrado&orden=${ordenCompraConfirmada}`);
      }
      return res.status(404).json({ error: "Pedido asociado a la transacción no encontrado." });
    }
    const pedidoId = pedido.ID_Pedido;
    const sucursalDelPedido = pedido.ID_Sucursal; // Necesario para actualizar stock
    const idUsuarioSistema = pedido.usuarioId || process.env.USUARIO_SISTEMA_ID || 1; // Usar el usuario del pedido o un ID de sistema

    if (confirmacion.response_code === 0) {
      // Pago APROBADO
      await PedidoDB.actualizarEstadoPedido(pedidoId, 'Pagado', idUsuarioSistema, `Pago Webpay confirmado. AuthCode: ${confirmacion.authorization_code}`);

      // Obtener el ID_Pago pendiente para este pedido
      const idPago = await PedidoDB.obtenerIdPagoPorPedidoIdYEstado(pedidoId, 'Pendiente');
      if (!idPago) {
        console.error(`[WebpayConfirmacion] No se encontró un PAGO pendiente para el pedido ${pedidoId}. No se puede registrar la transacción de Webpay ni actualizar el estado del pago.`);
        // Considerar marcar el pedido con un estado de error o alerta administrativa
      } else {
        await PedidoDB.actualizarEstadoPago(idPago, 'Completado');
      }

      const datosTransaccionWebpay = {
        idPago: idPago || null, // Usar el idPago encontrado, o null si no se encontró (para loggear al menos)
        tokenWebpay: tokenWs, // El token de confirmación
        ordenCompra: ordenCompraConfirmada,
        tipoTarjeta: confirmacion.card_detail?.card_number ? 'Terminada en ' + confirmacion.card_detail.card_number.slice(-4) : 'No disponible',
        // Considerar no guardar el número completo de tarjeta por seguridad
        // numeroTarjeta: confirmacion.card_detail?.card_number,
        numeroTarjeta: null, // No guardar número completo por defecto
        codigoAutorizacion: confirmacion.authorization_code,
        codigoRespuesta: confirmacion.response_code.toString(),
        descripcionRespuesta: 'Transacción aprobada',
        cuotas: confirmacion.installments_number,
        jsonRespuestaCompleta: confirmacion
      };
      await PedidoDB.registrarTransaccionWebpay(datosTransaccionWebpay);

      // Notificar a la API de Inventario para descontar stock
      const detallesDelPedido = await PedidoDB.obtenerDetallesPorPedidoId(pedidoId);
      for (const detalle of detallesDelPedido) {
        try {
          await inventarioService.actualizarStockEnInventario(detalle.ProductoIdExterno, sucursalDelPedido, detalle.Cantidad, pedidoId); // La función en el servicio manejará la cantidad negativa
          console.log(`Actualización de stock solicitada para producto ${detalle.ProductoIdExterno}, cantidad ${detalle.Cantidad}, sucursal ${sucursalDelPedido}`);
        } catch (invError) {
          console.error(`[WebpayConfirmacion] Error al intentar actualizar stock para producto ${detalle.ProductoIdExterno} del pedido ${pedidoId}: ${invError.message}. El pedido está PAGADO pero el stock podría estar inconsistente.`);
          // Aquí deberías tener un mecanismo de reintento o alerta para el administrador.
        }
      }
      console.log(`[WebpayConfirmacion] Pedido ${pedidoId} marcado como PAGADO. Código de autorización: ${confirmacion.authorization_code}`);
      if (process.env.FRONTEND_URL) {
        return res.redirect(`${process.env.FRONTEND_URL}/pago/exitoso?orden=${ordenCompraConfirmada}`);
      }
      return res.json({ mensaje: `Pago confirmado para el pedido ${pedidoId}.`, detalle: confirmacion });
    } else {
      // Pago RECHAZADO u otro error
      await PedidoDB.actualizarEstadoPedido(pedidoId, 'Rechazado_Webpay', idUsuarioSistema, `Pago Webpay rechazado. Código: ${confirmacion.response_code}`);

      const datosTransaccionFallida = {
        idPago: await PedidoDB.obtenerIdPagoPorPedidoIdYEstado(pedidoId, 'Pendiente') || null,
        tokenWebpay: tokenWs,
        ordenCompra: ordenCompraConfirmada,
        codigoRespuesta: confirmacion.response_code.toString(),
        descripcionRespuesta: `Transacción rechazada. Código: ${confirmacion.response_code}`,
        jsonRespuestaCompleta: confirmacion
      };
      await PedidoDB.registrarTransaccionWebpay(datosTransaccionFallida);
      if (datosTransaccionFallida.idPago) {
        await PedidoDB.actualizarEstadoPago(datosTransaccionFallida.idPago, 'Rechazado');
      }


      console.log(`[WebpayConfirmacion] Pago RECHAZADO para pedido ${pedidoId}. Código de respuesta Webpay: ${confirmacion.response_code}`);
      if (process.env.FRONTEND_URL) {
        return res.redirect(`${process.env.FRONTEND_URL}/pago/fallido?orden=${ordenCompraConfirmada}&codigo=${confirmacion.response_code}`);
      }
      return res.status(400).json({ mensaje: `Pago rechazado para el pedido ${pedidoId}.`, detalle: confirmacion });
    }
  } catch (error) {
    console.error('[WebpayConfirmacion] Error al procesar confirmación de Webpay:', error); // Loggear el error completo
    let statusCode = 500;
    if (axios.isAxiosError(error) && error.response) {
        statusCode = error.response.status; // Podría ser un error de Webpay o Inventario
    }
    if (process.env.FRONTEND_URL) {
      return res.redirect(`${process.env.FRONTEND_URL}/pago/error?mensaje=procesamiento_confirmacion`);
    }
    return res.status(statusCode).json({ error: "Error al procesar la confirmación del pago.", detalle: error.message });
  }
};
