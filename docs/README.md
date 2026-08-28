# Automóviles Atuel — Documentación

## Intención del proyecto

**Automóviles Atuel** es un **catálogo web** para la agencia de autos **Automóviles Atuel**. Su objetivo es mostrar el stock de vehículos disponibles a los clientes de forma simple y ordenada, y permitir que la agencia gestione ese contenido desde un **panel privado con login**.

### Público

- **Catálogo de autos:** listado de vehículos publicados en la página principal.
- **Buscador y filtros:** búsqueda por marca o modelo, y filtro entre autos **0km** y **usados**.
- **Ficha de detalle:** cada auto tiene su propia página con fotos, información general (nombre, modelo, año, descripción), ficha técnica (kilometraje, tracción, combustible, transmisión, motor, etc.) y características del vehículo.
- **Contacto:** enlaces a Instagram, WhatsApp y ubicación en Google Maps.

### Administración (panel privado)

- **Login de administradores:** acceso restringido mediante autenticación con JWT almacenado en una cookie `httpOnly`.
- **Panel de control:** visualización de todos los autos (publicados y no publicados).
- **Gestión de autos:** creación, edición de información general, ficha técnica y fotos (subidas a ImgBB).
- **Códigos QR:** generación de un QR que enlaza directamente a la ficha de cada auto.

### Resumen

Un catálogo digital de autos con panel administrativo, pensado para que la agencia pueda mostrar sus vehículos a los clientes y administrar su contenido sin necesidad de tocar código.