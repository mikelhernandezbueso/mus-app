# Mus Eskola 🃏

Aprende a jugar al **mus** desde cero, estilo Duolingo: lecciones cortas, práctica infinita generada por un motor de reglas y partidas 2 contra 2 contra bots con **modo tutor**. Reglas de Euskadi: mus a 8 reyes y juego a 40 (configurable a 4 reyes, a 30, con o sin 31 real).

**App publicada:** https://mikelhernandezbueso.github.io/mus-app/

## Instalarla en el móvil

La app es una PWA: se instala desde el navegador y funciona sin conexión.

### iPhone (Safari)
1. Abre https://mikelhernandezbueso.github.io/mus-app/ en **Safari**.
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Elige **«Añadir a pantalla de inicio»** y confirma con **Añadir**.
4. Ábrela desde el icono: se verá a pantalla completa y funcionará offline.

### Android (Chrome)
1. Abre la URL en **Chrome**.
2. Toca el menú **⋮** → **«Instalar aplicación»** (o «Añadir a pantalla de inicio»).
3. Confirma. El icono aparecerá con tus apps.

La primera vez necesita conexión para descargarse; después funciona en modo avión. El progreso se guarda en el propio móvil (localStorage).

## Ejecutarla en local

Requisitos: Node 20+ y npm.

```bash
npm install
```

```bash
npm run dev
```

Abre la URL que muestra Vite (normalmente http://localhost:5173/mus-app/).

Otros comandos:

```bash
npm test
```

```bash
npm run build
```

```bash
npm run preview
```

Recorrido automático con Playwright (390x844) tras `npm run build` y con `npm run preview -- --port 4173` arrancado:

```bash
node scripts/e2e.cjs
```

## Qué hay dentro

- `src/engine` — motor del mus en TypeScript puro (evaluación de lances, mano completa con mus, descartes, envites, órdago y recuento; partida con juegos y vacas). Probado con Vitest.
- `src/ai` — bots (principiante, normal, experto) con estimación Monte Carlo que respeta lo que cada jugador sabe (declaraciones y señas), y el tutor.
- `src/exercises` — generadores de ejercicios: la respuesta la calcula siempre el motor.
- `src/content` — temario (17 unidades), preguntas de teoría, señas, glosario castellano/euskera, reglamento navegable y logros.
- `docs/REGLAMENTO.md` — reglamento completo con fuentes y reglas de la casa.
- `docs/PLAN.md` — arquitectura, temario y tareas.

Despliegue: `.github/workflows/deploy.yml` compila, pasa los tests y publica en GitHub Pages en cada push.
