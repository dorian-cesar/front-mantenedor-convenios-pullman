$file = 'components\modals\update-convenio.tsx'
$content = Get-Content $file -Raw

$old1 = "handleUpdateRuta(rutaIndex, `"origen_ciudad`", val)`r`n                                                         handleUpdateRuta(rutaIndex, `"origen_codigo`", city ? String(city.id) : ruta.origen_codigo)"
$new1 = "setRutas(prev => prev.map((r, i) => i === rutaIndex`r`n                                                            ? { ...r, origen_ciudad: val, origen_codigo: city ? String(city.id) : r.origen_codigo }`r`n                                                            : r`r`n                                                        ))"

$old2 = "handleUpdateRuta(rutaIndex, `"destino_ciudad`", val)`r`n                                                         handleUpdateRuta(rutaIndex, `"destino_codigo`", city ? String(city.id) : ruta.destino_codigo)"
$new2 = "setRutas(prev => prev.map((r, i) => i === rutaIndex`r`n                                                            ? { ...r, destino_ciudad: val, destino_codigo: city ? String(city.id) : r.destino_codigo }`r`n                                                            : r`r`n                                                        ))"

$content = $content.Replace($old1, $new1)
$content = $content.Replace($old2, $new2)

[System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.Encoding]::UTF8)
Write-Host "Done - replacements applied"
