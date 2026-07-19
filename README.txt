PÁGINA WEB VELUNIX POS
=======================

ARCHIVOS
- index.html: estructura y textos de la página.
- styles.css: diseño, colores y versión móvil.
- app.js: carrito de compra, cantidades, subtotal y pedido por WhatsApp.
- assets/flyer-pos.png: imagen entregada como referencia visual.

CÓMO ABRIR
1. Descomprime la carpeta.
2. Abre index.html con Chrome, Edge o Firefox.
3. También puedes subir toda la carpeta a tu hosting.

CONFIGURAR WHATSAPP
En index.html, busca esta línea:
<body data-whatsapp="56900000000">

Reemplaza 56900000000 por tu número, sin +, espacios ni guiones.
Ejemplo: 56912345678

CAMBIAR PRECIOS
En index.html, busca los botones con:
data-price="150000"
data-price="260000"

Cambia tanto el atributo data-price como el precio visible de cada tarjeta.

FUNCIONES INCLUIDAS
- Diseño responsive para computador, tablet y celular.
- Carrito lateral.
- Aumentar y disminuir cantidades.
- Eliminar productos y vaciar carrito.
- Subtotal automático en pesos chilenos.
- Kit Full con precio a cotizar.
- Guardado del carrito en el navegador.
- Formulario de demostración.
- Pedido por WhatsApp.
- Menú móvil.
