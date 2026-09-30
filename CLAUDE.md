# Proyecto: Baby Shower de Evangeline

Invitación web con efectos y lista de invitados para el baby shower de Evangeline.
Todo está hecho en HTML, CSS y JavaScript sin frameworks. Cada página es un solo archivo autocontenido.

## Datos del evento

- Evento: Baby Shower de Evangeline ("la pronta llegada de nuestra bebita")
- Fecha: domingo 11 de octubre de 2026, 2:00 p.m. (hora Colombia, UTC-5)
- Lugar: Calle 5A Sur #18-60, Barrio La Veredita, Soacha, Cundinamarca
- Regalos: lluvia de regalos + pañal (talla sugerida: etapa 1 o 2)
- Confirmaciones: por WhatsApp al 3114591946 (formato wa.me: 573114591946)
- Cierre: "¡Te esperamos para compartir esta gran alegría con nosotros! 👶💖"

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Invitación pública para enviar a los invitados |
| `musica.mp3` | Música de fondo de la invitación (MP3, 59 s, 128 kbps, en bucle) |
| `luciernaga.webp` | Ilustración original de la luciérnaga (fuente; ya va incrustada en `index.html`) |
| `invitados-evangeline.html` | Lista de invitados, de uso privado de los anfitriones |

Publicación:
- Repositorio: https://github.com/tadoando/aven (rama `main`)
- Invitación en GitHub Pages: https://tadoando.github.io/aven/ (sale de `index.html`)
- Nada se publica ya en claude.ai: los artifacts de la invitación y de la lista de invitados se eliminaron.

## Identidad visual

Está basada en la invitación original: acuarela rosa con nubes azules, mariposas rosadas y una luciérnaga azul con cola arcoíris.

Paleta:
- `#F9E4EA` blush (fondo)
- `#F2C9D3` petal (bordes y detalles)
- `#B5566A` rose (color principal, nombre y botones)
- `#6E2A3A` wine (fecha y títulos)
- `#A9CBE6` sky (nubes y foco de teclado)
- `#F6EDA8` glow (luz de luciérnagas)
- `#FFF8FA` paper (tarjetas)

Tipografías (Google Fonts):
- `Parisienne`: nombre "Evangeline" y títulos manuscritos
- `Cormorant Garamond`: fecha, "BABY SHOWER" y textos de acento
- `Quicksand`: texto general

Las dos páginas incluyen modo oscuro (`prefers-color-scheme`) y respetan `prefers-reduced-motion`.

## Invitación (`index.html`)

Configuración al inicio del `<script>`:

```js
const WHATSAPP = "573114591946";
const EVENT = new Date("2026-10-11T14:00:00-05:00");
const ADDRESS = "Calle 5A Sur #18-60, Barrio La Veredita, Soacha, Cundinamarca";
```

Funcionalidades:
- **Intro de anochecer**: el invitado toca la luciérnaga, un destello ilumina la pantalla y se revela la invitación.
- **Título "BABY SHOWER"**: se dibuja en arco con un `textPath` de SVG.
- **Luciérnaga**: es la ilustración de la luciérnaga sobre la nube (`luciernaga.webp`, 520×497, fondo transparente), incrustada como data URI en los dos `<img>` (`.jar` en la intro y `.hero-fly` en la invitación). El archivo `.webp` se guarda como fuente, pero la página no lo necesita.
- **Nombre**: aparece letra por letra con una animación CSS escalonada.
- **Efectos en `<canvas>`**: luciérnagas flotantes, chispas que siguen el puntero y explosiones de luz al tocar.
- **Mariposas SVG**: vuelan por la pantalla y aletean. Se insertan como SVG inline, porque la animación CSS no funciona dentro de `<use>`.
- **Cuenta regresiva**: al llegar la fecha cambia a "¡Es hoy!" y luego a "¡Gracias por acompañarnos!".
- **Botón de mapa**: abre Google Maps con la dirección.
- **Botón de calendario**: abre Google Calendar con el evento de 2:00 a 6:00 p.m.
- **Música de fondo**: `<audio id="bgm" src="musica.mp3" loop>`. Empieza con un fundido al tocar la luciérnaga, porque los navegadores no dejan reproducir audio sin un toque del usuario. El volumen se ajusta con `MUSIC_VOLUME` (0.6). Hay un botón flotante abajo a la derecha para silenciar o reactivar. La música se pausa cuando la pestaña queda oculta y el botón se esconde si el archivo no carga.
- **Formulario de confirmación**: pide nombre y número de personas (1 a 5) y abre WhatsApp con este mensaje:
  `¡Hola! Soy {nombre} y confirmo mi asistencia al baby shower de Evangeline 💖 Vamos {n} persona(s).`

## Lista de invitados (`invitados-evangeline.html`)

Cada invitado tiene este modelo:

```js
{ id, name, count, status: "confirmado" | "pendiente" | "no asiste", note, createdAt, updatedAt }
```

Funcionalidades:
- **Resumen**: personas confirmadas (suma de `count`), invitados por responder y los que no asisten.
- **Gestión de invitados**: agregar, editar y quitar, con aviso de nombre duplicado.
- **Estado en línea**: se cambia desde un `<select>` en cada fila.
- **Buscador y filtros**: búsqueda por nombre y filtros por estado.
- **Pegar confirmación de WhatsApp**: una expresión regular extrae el nombre (`Soy X y confirmo`) y las personas (`Vamos N`).
- **Exportar CSV**: separador `;` y BOM UTF-8 para que Excel lo abra bien.

Almacenamiento:
- Usa `localStorage` con la clave `evangeline-guests`: los datos quedan solo en el navegador donde se abre (también en GitHub Pages).
- El código aún tiene la ruta de `claude.use("db")`/`claude.use("downloads")`, pero ya no se usa porque la página no está publicada en claude.ai.

## Limitaciones conocidas

- **Registro de invitados**: los invitados no pueden anotarse solos en la lista, porque no hay una base compartida (solo `localStorage`). El flujo actual es: el invitado confirma por WhatsApp y el anfitrión pega el mensaje en la lista.
- **Tipografías sin internet**: las fuentes se cargan desde Google Fonts, así que sin conexión se usan fuentes de respaldo.
- **Dirección en el mapa**: falta verificar que el punto de Google Maps caiga en la casa correcta.

## Ideas para siguientes pasos

- **Registro automático**: que las confirmaciones lleguen solas a una base propia, con un Google Form, Google Sheets + Apps Script o un backend pequeño.
- **Dominio corto**: apuntar un dominio propio a GitHub Pages.
- **Vista previa en WhatsApp**: agregar la imagen de vista previa (Open Graph) para cuando se comparta el enlace.
