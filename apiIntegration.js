// Cargar las variables de entorno desde el archivo .env
require('dotenv').config();

const axios = require('axios');

// Usar la API Key y el puerto desde las variables de entorno
const API_KEY = process.env.BANCO_API_KEY; // Viene de BANCO_API_KEY en .env
const BASE_URL = process.env.BANCO_API_URL; // Viene de BANCO_API_URL en .env
// const PORT = process.env.PORT || 3001; // PORT no se usa en este script si solo obtiene datos

// Función para obtener el valor del dólar
async function obtenerValorDolar() {
  if (!API_KEY) {
    console.error('Error: La variable de entorno BANCO_API_KEY no está configurada.');
    return null; // O lanzar un error: throw new Error('API Key no configurada');
  }
  if (!BASE_URL) {
    console.error('Error: La variable de entorno BANCO_API_URL no está configurada.');
    return null; // O lanzar un error: throw new Error('API URL no configurada');
  }

  try {
    const URL_COMPLETA = `${BASE_URL}?apikey=${API_KEY}&formato=json`; // URL con los parámetros
    console.log(`Consultando URL: ${URL_COMPLETA}`); // Útil para debugging
    const respuesta = await axios.get(URL_COMPLETA);
    
    // Asumiendo la estructura de la CMF: respuesta.data.Dolares[0].Valor
    // Ajusta esto según la estructura real de la respuesta de la API que estés usando
    if (respuesta.data && respuesta.data.Dolares && respuesta.data.Dolares.length > 0) {
      const valorExtraido = respuesta.data.Dolares[0].Valor.replace(',', '.'); // Reemplazar coma por punto para convertir a número
      const valorNumerico = parseFloat(valorExtraido);
      
      console.log('Valor del Dólar (numérico):', valorNumerico);
      return valorNumerico;
    } else {
      console.error('Error: La respuesta de la API no tiene el formato esperado.');
      console.log('Respuesta completa de la API:', respuesta.data);
      return null;
    }

  } catch (error) {
    console.error('Error al obtener el valor del dólar:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Llamar a la función para obtener el valor del dólar
obtenerValorDolar().then(valor => {
  if (valor !== null) {
    console.log(`El valor del dólar obtenido es: ${valor}`);
  } else {
    console.log('No se pudo obtener el valor del dólar.');
  }
});
