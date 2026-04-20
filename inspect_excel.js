const XLSX = require('xlsx');
const path = require('path');

const inputPath = path.join(__dirname, 'BD - PILLADO Y CIA LTDA CONVENIO.xlsx');
const outputPath = path.join(__dirname, 'BD - PILLADO Y CIA LTDA CONVENIO - MODIFICADO.xlsx');

// Leer el archivo
const workbook = XLSX.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON para ver las columnas
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('Columnas encontradas:', Object.keys(data[0] || {}));
console.log('Primeras 3 filas:', data.slice(0, 3));
