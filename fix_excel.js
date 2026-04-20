const XLSX = require('xlsx');
const path = require('path');

const inputPath = path.join(__dirname, 'BD - PILLADO Y CIA LTDA CONVENIO.xlsx');
const outputPath = path.join(__dirname, 'BD - PILLADO Y CIA LTDA CONVENIO - MODIFICADO.xlsx');

// Leer el archivo
const workbook = XLSX.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

// Transformar: quitar ceros al inicio del RUT y reordenar columnas (RUT primero, Nombre después)
const transformed = data.map(row => {
    const rut = String(row['RUT'] || '');
    // Quitar ceros al inicio: ej. "008.404.432-6" → "8.404.432-6"
    const cleanRut = rut.replace(/^0+/, '');

    return {
        'Trabajador': row['Trabajador'],
        'RUT': cleanRut,
    };
});

console.log('Ejemplos transformados:');
transformed.slice(0, 5).forEach(r => console.log(r));

// Crear nuevo worksheet y workbook
const newWs = XLSX.utils.json_to_sheet(transformed);
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newWs, sheetName);

// Guardar
XLSX.writeFile(newWb, outputPath);
console.log('\n✅ Archivo guardado en:', outputPath);
