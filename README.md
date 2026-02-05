
## 🟡 Pendientes (front)
> Tareas técnicas del front pendientes de implementación.

### Dashboard
- [ ] conectar dashboard

### Boletos
- [ ] conectar boletos

### Empresas
- [ ] agregar filtros

### Convenios
- [ ] agregar filtros
- [ ] agregar vista de códigos de descuento
- [ ] conectar descuentos y códigos de descuento

### Usuarios
- [ ] conectar usuarios
- [ ] validar roles

### Pasajeros
- [ ] conectar pasajeros
- [ ] modal de pasajeros

### UX / UI
- [ ] agregar límite de resultados en page header
- [ ] cambiar select por combobox en filtros


---

## 🟠 Requerimientos / peticiones / errores (backend)
> Solicitudes al backend.

### Usuarios
- [ ] Búsqueda por correo en api get
- [ ] Agregar campos en creación (post) (nombre, RUT, teléfono)

### Descuentos
- [ ] Agregar filtro de búsqueda

### Convenios
- [ ] arreglar api delete convenios
- [ ] corregir api listar convenios para no traer IDs duplicados
- [ ] arreglar api put:
```
ReferenceError: ValidationError is not defined
    at module.exports (/home/bitnami/backend-convenios-pullman/src/middlewares/error.middleware.js:5:22)
    at Layer.handleError (/home/bitnami/backend-convenios-pullman/node_modules/router/lib/layer.js:116:17)
    at trimPrefix (/home/bitnami/backend-convenios-pullman/node_modules/router/index.js:340:13)
    at /home/bitnami/backend-convenios-pullman/node_modules/router/index.js:297:9
    at processParams (/home/bitnami/backend-convenios-pullman/node_modules/router/index.js:582:12)
    at next (/home/bitnami/backend-convenios-pullman/node_modules/router/index.js:291:5)
    at /home/bitnami/backend-convenios-pullman/node_modules/router/index.js:688:15
    at next (/home/bitnami/backend-convenios-pullman/node_modules/router/index.js:276:14)
    at /home/bitnami/backend-convenios-pullman/node_modules/router/index.js:688:15
    at next (/home/bitnami/backend-convenios-pullman/node_modules/router/index.js:276:14)
```
<!-- - [ ] agregar campo fecha_inicio - fecha_termino en la creacion (post) de un convenio -->

---

## 🔵 Cambios importantes
> Decisiones funcionales tomadas que afectan el comportamiento del front.

- El pasajero ya no se asocia a una empresa
- Se agregan los campos `tope_monto_ventas` y `tope_cantidad_tickets` en convenios


---

```
empresa => convenio => descuento => codigo descuento

----------------------------------------------------

pasajero => tipo_pasajero
```