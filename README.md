# 🌸 KPop Gala

**KPop Gala** es una aplicación web local-first para registrar, organizar, comparar y analizar rankings musicales a lo largo de distintas temporadas.

El proyecto comenzó como un sistema sencillo de puntuaciones semanales y ha evolucionado hasta convertirse en una aplicación completa para gestionar canciones, artistas, álbumes y B-Sides, con rankings históricos, estadísticas, temporadas, catálogo editable, backups y Hall of Fame.

La aplicación está desarrollada completamente con **HTML, CSS y JavaScript Vanilla**, sin frameworks ni dependencias externas obligatorias.

---

## ✨ Características principales

### 🏆 Rankings globales

KPop Gala mantiene rankings acumulativos independientes para:

* 🎵 Canciones
* ⭐ Artistas
* 💿 Álbumes
* 🎧 B-Sides

Cada ranking permite visualizar:

* Posición actual
* Puntaje acumulado
* Puntos de Persona 1 y Persona 2
* Peak histórico
* Semanas en ranking
* Movimiento respecto a la semana anterior
* Entradas nuevas
* Top 3 destacado visualmente

Los movimientos utilizan indicadores como:

```text
↑ 2     Subió dos posiciones
↓ 3     Bajó tres posiciones
—       Se mantiene
NEW     Nueva entrada
```

---

## 📅 Registro semanal

La aplicación permite registrar información semanal para dos participantes.

Cada entrada puede incluir:

* Posición en Spotify
* Posición en Instafest
* Número de reproducciones
* Participante
* Semana
* Temporada
* Elemento seleccionado

Los registros pueden realizarse para:

* Canciones
* Artistas
* Álbumes
* B-Sides

La aplicación calcula automáticamente el puntaje antes de guardar la entrada.

---

## 🧮 Sistema de puntuación

Las posiciones de Spotify e Instafest generan puntos utilizando una escala del puesto 1 al 15.

| Posición | Puntos |
| -------: | -----: |
|        1 |     15 |
|        2 |     14 |
|        3 |     13 |
|      ... |    ... |
|       14 |      2 |
|       15 |      1 |
|     > 15 |      0 |

Además, las reproducciones agregan puntos adicionales.

Las reproducciones utilizadas para el cálculo están limitadas a un máximo de **200 puntos por entrada**.

De forma general:

```text
Puntaje =
Puntos Spotify
+
Puntos Instafest
+
Reproducciones
```

La aplicación mantiene compatibilidad con registros creados con versiones antiguas del sistema de puntuación.

---

# 🗓️ Temporadas

Desde la versión 2.0, KPop Gala permite administrar múltiples temporadas.

Por ejemplo:

```text
2026
2027
2028
2029
```

Cada temporada mantiene de forma independiente:

* Registros
* Rankings
* Semanas
* Analytics
* Peaks
* Movimientos
* Estadísticas
* Hall of Fame

El catálogo de canciones, artistas, álbumes y B-Sides se comparte entre temporadas.

---

## 🔄 Temporada activa

Una temporada puede establecerse como activa.

La temporada activa determina dónde se guardarán los nuevos registros.

Ejemplo:

```text
Temporada activa: 2027
```

Los nuevos registros creados desde ese momento pertenecerán a 2027 sin modificar los datos históricos de 2026.

---

## 🔒 Cierre de temporadas

Cuando una temporada finaliza puede cerrarse.

Cerrar una temporada:

* Bloquea nuevos registros
* Protege el historial
* Conserva rankings
* Conserva Analytics
* Guarda los líderes de la temporada
* Genera automáticamente candidatos para el Hall of Fame

Una temporada cerrada puede volver a abrirse si es necesario.

---

# 👑 Hall of Fame

Cada temporada puede tener sus ganadores oficiales.

Actualmente se contemplan:

* 🏆 Song of the Year
* ⭐ Artist of the Year
* 💿 Album of the Year
* 🎧 B-Side of the Year

Al cerrar una temporada, KPop Gala utiliza automáticamente los líderes de cada ranking como ganadores iniciales.

Posteriormente estos resultados pueden modificarse manualmente.

Esto permite que los premios oficiales no tengan que coincidir obligatoriamente con el ranking matemático.

---

# 📊 Analytics

KPop Gala incluye una sección completa de análisis estadístico.

El dashboard general muestra información como:

* Puntos totales
* Número de registros
* Puntos de Persona 1
* Puntos de Persona 2
* Canción líder
* Artista líder
* Álbum líder
* B-Side líder
* Mayores movimientos
* Elementos con más semanas en ranking

---

## 🔎 Perfiles individuales

Cada canción, artista, álbum o B-Side puede abrirse desde el ranking para consultar su perfil.

El perfil contiene datos como:

```text
Ranking actual
Puntos acumulados
Peak histórico
Semanas en ranking
Movimiento reciente
Número de registros
```

También muestra:

* Distribución de puntos P1/P2
* Evolución semanal
* Puntaje semanal
* Puntaje acumulado
* Posición histórica
* Historial completo

---

## 📈 Gráficas

Las gráficas están implementadas directamente utilizando:

* JavaScript Vanilla
* SVG

No se utilizan librerías externas como Chart.js.

Esto mantiene el proyecto ligero y elimina dependencias innecesarias.

---

# 📚 Gestor de catálogo

KPop Gala incluye un sistema para administrar contenido directamente desde la aplicación.

Ya no es necesario modificar manualmente `data.js` cada vez que se agrega contenido.

Desde **Catálogo** se pueden administrar:

### 🎵 Canciones

* Crear
* Editar
* Archivar
* Buscar
* Asignar artista
* Subir portada

### ⭐ Artistas

* Crear
* Editar
* Archivar
* Asignar categoría
* Subir fotografía

Categorías disponibles:

```text
Boy Group
Girl Group
Solista Masculino
Solista Femenino
```

### 💿 Álbumes

* Crear
* Editar
* Archivar
* Asignar artista
* Subir portada

### 🎧 B-Sides

* Crear
* Editar
* Archivar
* Asignar artista
* Asociar contenido
* Reutilizar portadas

---

# 📦 Archivado de contenido

Los elementos que ya tienen historial no se eliminan de forma destructiva.

En su lugar pueden archivarse.

Un elemento archivado:

* Deja de aparecer para nuevos registros
* Mantiene sus registros históricos
* Sigue existiendo en Analytics
* Sigue apareciendo donde sea necesario para preservar el historial

Esto evita referencias rotas y pérdida accidental de información.

---

# 🖼️ Gestión de imágenes

Las imágenes agregadas desde el gestor de catálogo se almacenan utilizando **IndexedDB**.

Esto permite seleccionar una imagen directamente desde el ordenador sin necesidad de:

1. Copiarla manualmente a `assets`
2. Buscar el nombre del archivo
3. Editar rutas en JavaScript
4. Modificar `data.js`

Las imágenes incluidas originalmente con el proyecto continúan almacenadas dentro de:

```text
assets/
```

---

# 👥 Participantes

KPop Gala utiliza internamente dos participantes:

```text
p1
p2
```

Estos identificadores permanecen estables para proteger la compatibilidad con los datos históricos.

Desde la interfaz pueden personalizarse sus nombres y emojis.

Por ejemplo:

```text
🌸 Marcos
💙 Alex
```

Internamente los registros continúan utilizando:

```javascript
personaId: "p1"
```

o:

```javascript
personaId: "p2"
```

Esto permite cambiar nombres sin modificar registros existentes.

---

# 🔎 Búsqueda

La aplicación incluye búsqueda instantánea en diferentes áreas.

Puede utilizarse para localizar:

* Canciones
* Artistas
* Álbumes
* B-Sides

También está disponible durante el proceso de registro, facilitando el uso cuando el catálogo comienza a crecer.

---

# ↩️ Eliminación segura

Al eliminar un registro, KPop Gala ofrece la opción:

```text
Deshacer
```

durante unos segundos.

Además, antes de operaciones importantes se generan respaldos automáticos.

El objetivo es reducir la posibilidad de pérdida accidental de información.

---

# 💾 Persistencia de datos

KPop Gala es una aplicación **local-first**.

No necesita servidor ni base de datos externa para funcionar.

La información se almacena principalmente mediante:

* `localStorage`
* `IndexedDB`

---

## localStorage

Las colecciones históricas principales utilizan estas claves:

```text
kpop_gala_registros
kpop_gala_artistas_registros
kpop_gala_albumes_registros
kpop_gala_bsides_registros
```

El catálogo personalizado utiliza:

```text
kpop_gala_catalog_v1
```

También existen claves adicionales para:

* Configuración
* Temporadas
* Temporada activa
* Hall of Fame
* Backups internos

---

## IndexedDB

IndexedDB se utiliza principalmente para almacenar imágenes cargadas mediante el gestor de catálogo.

Esto evita almacenar grandes archivos dentro de `localStorage`.

---

# 🛡️ Compatibilidad con versiones anteriores

Uno de los objetivos principales del proyecto es mantener compatibilidad con los datos históricos.

Los registros creados antes del sistema de temporadas no contienen `seasonId`.

KPop Gala interpreta automáticamente estos registros como pertenecientes a la temporada:

```text
2026
```

Por ejemplo, un registro histórico como:

```javascript
{
  id: "c_123",
  semanaId: "S08",
  personaId: "p1",
  cancionId: 1
}
```

continúa siendo válido.

Los registros de nuevas temporadas utilizan:

```javascript
{
  seasonId: "2027",
  semanaId: "S01",
  personaId: "p1",
  cancionId: 1
}
```

De esta manera no es necesario reescribir los datos históricos.

---

# 💾 Sistema de backups

KPop Gala permite exportar una copia completa de los datos a un archivo JSON.

El backup puede incluir:

* Canciones registradas
* Artistas registrados
* Álbumes registrados
* B-Sides registrados
* Catálogo personalizado
* Imágenes personalizadas
* Configuración
* Participantes
* Temporadas
* Temporada activa
* Hall of Fame

---

## Restauración

Desde la sección **Datos** puede importarse nuevamente un backup.

Antes de restaurar información, la aplicación crea un punto de restauración adicional.

Los backups de versiones anteriores también mantienen compatibilidad cuando es posible.

---

# 🗂️ Estructura del proyecto

```text
kpop-gala-web/
│
├── index.html
├── registro.html
├── semanas.html
├── catalogo.html
├── analytics.html
├── datos.html
├── temporadas.html
├── hall-of-fame.html
│
├── css/
│   ├── global.css
│   ├── index.css
│   ├── registro.css
│   ├── semanas.css
│   ├── catalogo.css
│   ├── analytics.css
│   ├── datos.css
│   ├── temporadas.css
│   └── hall-of-fame.css
│
├── js/
│   ├── data.js
│   ├── app.js
│   ├── registro.js
│   ├── semanas.js
│   ├── catalogo.js
│   ├── analytics.js
│   ├── backup.js
│   ├── temporadas.js
│   └── hall-of-fame.js
│
└── assets/
    ├── canciones/
    ├── artistas/
    └── albumes/
```

---

# 🧱 Arquitectura

El proyecto utiliza una arquitectura basada en múltiples páginas estáticas.

### `data.js`

Contiene:

* Catálogo base
* Configuración principal
* Sistema de puntuación
* Helpers de persistencia
* Rankings
* Compatibilidad histórica
* Utilidades relacionadas con temporadas

### `app.js`

Controla principalmente:

* Página principal
* Rankings
* Filtros
* Búsqueda
* Métricas históricas
* Navegación hacia Analytics

### `registro.js`

Gestiona:

* Registro semanal
* Formularios P1/P2
* Edición
* Detección de duplicados
* Previsualización de puntos
* Historial de la semana

### `semanas.js`

Gestiona:

* Historial por semana
* Filtros
* Resúmenes
* Eliminación segura
* Compatibilidad de registros históricos

### `catalogo.js`

Gestiona:

* Creación de contenido
* Edición
* Archivado
* Imágenes
* Relaciones entre catálogo

### `analytics.js`

Gestiona:

* Dashboard
* Perfiles
* Estadísticas
* Rankings históricos
* Gráficas SVG
* Comparaciones P1/P2

### `backup.js`

Gestiona:

* Exportación
* Importación
* Restauración
* Configuración
* Catálogo
* Imágenes
* Compatibilidad de backups

### `temporadas.js`

Gestiona:

* Creación de temporadas
* Activación
* Edición
* Cierre
* Reapertura

### `hall-of-fame.js`

Gestiona:

* Ganadores históricos
* Premios automáticos
* Premios personalizados

---

# 🎨 Diseño

KPop Gala mantiene una identidad visual inspirada en una estética K-pop moderna y colorida.

El sistema visual utiliza principalmente:

* Fondos crema
* Rosa
* Cyan
* Violeta
* Amarillo
* Verde
* Gradientes suaves
* Glassmorphism
* Bordes redondeados
* Sombras cálidas
* Animaciones ligeras

Las principales tipografías utilizadas son:

```text
Nunito
DM Sans
```

El objetivo del diseño es mantener una interfaz visualmente atractiva sin sacrificar legibilidad ni facilidad de uso.

---

# ⚙️ Tecnologías

| Tecnología   | Uso                    |
| ------------ | ---------------------- |
| HTML5        | Estructura             |
| CSS3         | Diseño y responsive    |
| JavaScript   | Lógica                 |
| localStorage | Persistencia principal |
| IndexedDB    | Imágenes               |
| SVG          | Gráficas               |
| Google Fonts | Tipografía             |

El proyecto no requiere:

```text
React
Vue
Angular
Node.js
npm
Base de datos externa
Backend
```

para funcionar localmente.

---

# 🚀 Cómo ejecutar el proyecto

## Requisitos

Solo necesitas:

* Un navegador moderno
* Visual Studio Code recomendado
* Una extensión de servidor local como **Live Server**

---

## VS Code

1. Clona o descarga el repositorio.

2. Abre la carpeta del proyecto en Visual Studio Code.

3. Abre:

```text
index.html
```

4. Ejecuta la opción:

```text
Go Live
```

o:

```text
Ver en línea
```

dependiendo de la extensión instalada.

Normalmente el proyecto se abrirá en una dirección similar a:

```text
http://127.0.0.1:5500/
```

---

# ⚠️ Importante sobre localStorage

Los datos del navegador están asociados al **origen** desde donde se ejecuta la aplicación.

Por ejemplo:

```text
http://127.0.0.1:5500
```

y:

```text
http://127.0.0.1:5501
```

son considerados sitios distintos por el navegador.

Si cambias de puerto puede parecer que los datos desaparecieron aunque todavía estén guardados en el origen anterior.

Por esta razón se recomienda mantener el mismo servidor y puerto durante el desarrollo.

También se recomienda exportar periódicamente un backup desde la sección **Datos**.

---

# 🌐 Despliegue

KPop Gala puede publicarse como sitio estático porque no necesita backend para ejecutar la interfaz.

Puede alojarse, por ejemplo, en servicios compatibles con sitios estáticos.

Sin embargo, los datos almacenados mediante `localStorage` e IndexedDB pertenecen a cada navegador y dispositivo.

Esto significa que publicar la aplicación en Internet no sincroniza automáticamente los datos existentes de localhost.

Para mover información entre dispositivos puede utilizarse el sistema de:

```text
Exportar backup
↓
Importar backup
```

Una futura versión podría incorporar sincronización mediante backend y base de datos.

---

# 🧪 Principios de desarrollo

El desarrollo de KPop Gala sigue varios principios importantes.

### Compatibilidad primero

Las nuevas versiones deben continuar leyendo registros históricos.

### Migraciones no destructivas

Se evita modificar datos antiguos salvo cuando sea estrictamente necesario.

### Local-first

La aplicación debe poder funcionar sin servicios externos.

### Evolución progresiva

Las nuevas funciones se agregan manteniendo la experiencia original.

### Seguridad de datos

Las operaciones destructivas deben incluir mecanismos de respaldo o recuperación.

### Vanilla JavaScript

Mientras la complejidad del proyecto lo permita, se evita introducir frameworks innecesarios.

---

# 🛣️ Evolución del proyecto

KPop Gala ha evolucionado progresivamente:

```text
v1.0
Sistema original de rankings y registro

v1.1
Estabilidad, compatibilidad y backups

v1.2
Mejoras UX, búsqueda y personalización

v1.3
Peak, movimientos y estadísticas de ranking

v1.4
Gestor de catálogo e imágenes

v1.5
Analytics y perfiles individuales

v2.0
Temporadas y Hall of Fame
```

---

# 🔮 Posibles mejoras futuras

Algunas ideas contempladas para futuras versiones:

* Perfiles completos de artistas
* Relaciones artista → canción → álbum → B-Side
* Estadísticas históricas entre temporadas
* Comparación 2026 vs 2027
* Récords globales
* Hall of Fame histórico
* Mejoras responsive
* PWA
* Modo offline avanzado
* Sincronización en la nube
* Backend opcional
* Sistema de cuentas
* Compartir rankings
* Modo presentación
* Exportación de resultados como imágenes
* Dashboard histórico global

---

# 👨‍💻 Desarrollo

Proyecto desarrollado y mantenido por **MarcosGr14**.

Repositorio:

```text
MarcosGr14/kpop-gala-web
```

---

# 📌 Estado

**Versión actual:** `2.0`

**Estado del proyecto:** Desarrollo activo

KPop Gala continúa evolucionando manteniendo como prioridad la compatibilidad con los datos históricos y la conservación de la experiencia original.
