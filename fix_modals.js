const fs = require('fs');

// Fix update-convenio.tsx - handleUpdateRuta calls (select ciudades)
const updateFile = 'components/modals/update-convenio.tsx';
let content = fs.readFileSync(updateFile, 'utf8');

// Replace origen double calls
content = content.replace(
    /const city = cities\.find\(c => c\.name === val\)\r?\n\s+handleUpdateRuta\(rutaIndex, "origen_ciudad", val\)\r?\n\s+handleUpdateRuta\(rutaIndex, "origen_codigo", city \? String\(city\.id\) : ruta\.origen_codigo\)/g,
    'const city = cities.find(c => c.name === val)\n                                                        handleUpdateRuta(rutaIndex, { origen_ciudad: val, origen_codigo: city ? String(city.id) : ruta.origen_codigo })'
);

// Replace destino double calls
content = content.replace(
    /const city = cities\.find\(c => c\.name === val\)\r?\n\s+handleUpdateRuta\(rutaIndex, "destino_ciudad", val\)\r?\n\s+handleUpdateRuta\(rutaIndex, "destino_codigo", city \? String\(city\.id\) : ruta\.destino_codigo\)/g,
    'const city = cities.find(c => c.name === val)\n                                                        handleUpdateRuta(rutaIndex, { destino_ciudad: val, destino_codigo: city ? String(city.id) : ruta.destino_codigo })'
);

fs.writeFileSync(updateFile, content, 'utf8');
console.log('update-convenio.tsx fixed');

// Now scan both files for garbled text (encoding issues)
const files = [
    'components/modals/add-convenio.tsx',
    'components/modals/update-convenio.tsx'
];

for (const f of files) {
    let c = fs.readFileSync(f, 'utf8');
    // Common garbled patterns from UTF-8 read as Latin-1:
    // í = Ã­, é = Ã©, ó = Ã³, ú = Ãº, á = Ã¡, ñ = Ã±
    const origLen = c.length;
    c = c.replace(/Ã­/g, 'í')
        .replace(/Ã©/g, 'é')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã\u00a0/g, 'à')
        .replace(/â€"/g, '—')
        .replace(/â€œ/g, '"')
        .replace(/â€\u009d/g, '"');
    if (c.length !== origLen || c !== fs.readFileSync(f, 'utf8')) {
        fs.writeFileSync(f, c, 'utf8');
        console.log(f + ' - encoding fixed');
    } else {
        console.log(f + ' - no garbled chars found (checking raw bytes...)');
        // Show lines with non-ASCII chars
        const lines = c.split('\n');
        lines.forEach((line, i) => {
            if (/[^\x00-\x7F]/.test(line) && line.includes('Espec')) {
                console.log(`  Line ${i + 1}: ${line.trim().substring(0, 100)}`);
            }
        });
    }
}
