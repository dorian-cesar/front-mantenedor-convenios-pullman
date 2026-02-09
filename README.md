# Mantenedor Convenios Pullman

---

## faltante
- reconectar las apis de convenios
- reconectar apis de codigos de descuento
- rehacer las paginas de convenios, codigos y borrar descuentos
- hacer pagina de apis
- arreglar pagina de eventos por backend o front

```json
{
      "id": 95,
      "nombre": "Convenio Verano 2026",
      "empresa_id": 1,
      "status": "ACTIVO",
      "tipo_consulta": "CODIGO_DESCUENTO",
      "endpoint": "/api/convenios/validar/{codigo}",
      "fecha_inicio": null,
      "fecha_termino": null,
      "tope_monto_ventas": null,
      "tope_cantidad_tickets": null,
      "porcentaje_descuento": 0,
      "codigo": "VERANO2026",
      "limitar_por_stock": false,
      "limitar_por_monto": false,
      "empresa": {
        "id": 1,
        "nombre": "Empresa Test S.A.",
        "rut": "76.000.000-1"
      }
    },
    {
      "id": 94,
      "nombre": "Convenio Caja La Araucana",
      "empresa_id": 70,
      "status": "ACTIVO",
      "tipo_consulta": "API_EXTERNA",
      "endpoint": "/api/integraciones/araucana/validar",
      "fecha_inicio": null,
      "fecha_termino": null,
      "tope_monto_ventas": null,
      "tope_cantidad_tickets": 100,
      "porcentaje_descuento": 15,
      "codigo": null,
      "limitar_por_stock": true,
      "limitar_por_monto": false,
      "empresa": {
        "id": 70,
        "nombre": "Caja La Araucana",
        "rut": "60101000-1"
      }
    },
```

```json
{
  "nombre": "Convenio Verano 2026",
  "empresa_id": 1,
  "tipo_consulta": "CODIGO_DESCUENTO",
  "codigo": "VERANO2026",
  "porcentaje_descuento": 10,
  "tope_monto_ventas": 1000000,
  "tope_cantidad_tickets": 50
},
{
  "nombre": "Convenio Verano 2026",
  "empresa_id": 1,
  "tipo_consulta": "API_EXTERNA",
  "api_consulta_id":1,
  "codigo": "VERANO2026",
  "porcentaje_descuento": 10,
  "tope_monto_ventas": 1000000,
  "tope_cantidad_tickets": 50
}
```