// Simulación de base de datos en memoria para sucursales
let sucursalesDB = [
    { id: 1, nombre: 'Sucursal Central Santiago', direccion: 'Av. Libertador Bernardo O Higgins 123', ciudad: 'Santiago', region: 'Metropolitana', activa: true, fecha_creacion: new Date(), fecha_actualizacion: new Date() },
    { id: 2, nombre: 'Sucursal Providencia', direccion: 'Nueva Providencia 456', ciudad: 'Santiago', region: 'Metropolitana', activa: true, fecha_creacion: new Date(), fecha_actualizacion: new Date() }
];
let nextId = 3;

const getAllSucursales = async (queryParams) => {
    console.log('Servicio: Obtener todas las sucursales con params:', queryParams);
    // Aquí podrías filtrar `sucursalesDB` basado en `queryParams` si es necesario
    return sucursalesDB.filter(s => s.activa !== false); // No mostrar sucursales "eliminadas lógicamente" por defecto
};

const createSucursal = async (datosSucursal) => {
    console.log('Servicio: Crear sucursal:', datosSucursal);
    if (sucursalesDB.some(s => s.nombre.toLowerCase() === datosSucursal.nombre.toLowerCase())) {
        throw new Error('Nombre de sucursal ya existe');
    }
    const nuevaSucursal = {
        id: nextId++,
        ...datosSucursal,
        activa: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
    };
    sucursalesDB.push(nuevaSucursal);
    return { ...nuevaSucursal }; // Devuelve una copia
};

const getSucursalById = async (id) => {
    console.log('Servicio: Obtener sucursal por ID:', id);
    const sucursal = sucursalesDB.find(s => s.id === id && s.activa !== false);
    return sucursal ? { ...sucursal } : null;
};

const updateSucursal = async (id, datosActualizar) => {
    console.log('Servicio: Actualizar sucursal ID:', id, 'con datos:', datosActualizar);
    const sucursalIndex = sucursalesDB.findIndex(s => s.id === id && s.activa !== false);
    if (sucursalIndex === -1) {
        return null;
    }
    // Verificar unicidad de nombre si se está cambiando
    if (datosActualizar.nombre && sucursalesDB.some(s => s.nombre.toLowerCase() === datosActualizar.nombre.toLowerCase() && s.id !== id)) {
        throw new Error('Nombre de sucursal ya existe para otra sucursal');
    }

    sucursalesDB[sucursalIndex] = {
        ...sucursalesDB[sucursalIndex],
        ...datosActualizar,
        fecha_actualizacion: new Date()
    };
    return { ...sucursalesDB[sucursalIndex] };
};

const deleteSucursal = async (id) => {
    console.log('Servicio: Eliminar (lógico) sucursal ID:', id);
    const sucursalIndex = sucursalesDB.findIndex(s => s.id === id);
    if (sucursalIndex === -1) {
        return false; // No encontrado
    }
    // Borrado físico para la simulación:
    sucursalesDB = sucursalesDB.filter(s => s.id !== id);
    return true;
};

module.exports = {
    getAllSucursales,
    createSucursal,
    getSucursalById,
    updateSucursal,
    deleteSucursal
};