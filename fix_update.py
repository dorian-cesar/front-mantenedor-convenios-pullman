import re

file_path = r'c:\Users\EQUIPO1\Desktop\front-mantenedor-convenios-pullman\components\modals\update-convenio.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix origen
old_origen = (
    '                                                         const city = cities.find(c => c.name === val)\r\n'
    '                                                         handleUpdateRuta(rutaIndex, "origen_ciudad", val)\r\n'
    '                                                         handleUpdateRuta(rutaIndex, "origen_codigo", city ? String(city.id) : ruta.origen_codigo)'
)
new_origen = (
    '                                                        const city = cities.find(c => c.name === val)\r\n'
    '                                                        handleUpdateRuta(rutaIndex, { origen_ciudad: val, origen_codigo: city ? String(city.id) : ruta.origen_codigo })'
)

# Fix destino
old_destino = (
    '                                                         const city = cities.find(c => c.name === val)\r\n'
    '                                                         handleUpdateRuta(rutaIndex, "destino_ciudad", val)\r\n'
    '                                                         handleUpdateRuta(rutaIndex, "destino_codigo", city ? String(city.id) : ruta.destino_codigo)'
)
new_destino = (
    '                                                        const city = cities.find(c => c.name === val)\r\n'
    '                                                        handleUpdateRuta(rutaIndex, { destino_ciudad: val, destino_codigo: city ? String(city.id) : ruta.destino_codigo })'
)

replaced = content
if old_origen in content:
    replaced = replaced.replace(old_origen, new_origen)
    print("Origen replaced OK")
else:
    print("ERROR: origen pattern not found")
    # Debug: show the actual bytes around line 585-587
    lines = content.split('\n')
    for i, line in enumerate(lines[583:590], start=584):
        print(f"Line {i} repr: {repr(line[:120])}")

if old_destino in replaced:
    replaced = replaced.replace(old_destino, new_destino)
    print("Destino replaced OK") 
else:
    print("ERROR: destino pattern not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(replaced)

print("Done")
