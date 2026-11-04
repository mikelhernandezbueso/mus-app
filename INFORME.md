# Informe de trabajo — Mus Eskola

## Estado del despliegue (léelo primero)

- **Todo el código está en la rama `claude/vibrant-mendel-ps8dqv`** de este repositorio local, con commits pequeños.
- **No se ha podido hacer push a GitHub.** Tanto `git push` (a `main` y a la rama) como la API de GitHub devolvieron **403**: la app de Claude no tiene permiso de escritura en `mikelhernandezbueso/mus-app` («Claude doesn't have GitHub access to mikelhernandezbueso/mus-app for your organization»). Se reintentó varias veces durante la noche, sin éxito. Por eso **el workflow de Actions no ha podido ejecutarse y GitHub Pages aún no tiene la app**.
- **Alternativa para probarla ya:** publiqué la misma app como página privada de claude.ai (Artifact): https://claude.ai/artifact/8VMyBTsEUsqw8inTKGdNrS. Se puede usar en el móvil, pero ahí no se instala como PWA ni funciona offline (el entorno de Artifacts no permite service workers) y el progreso es independiente del de la PWA.

### Cómo publicarla en GitHub Pages (5 minutos)
1. Dale acceso a Claude al repo: https://claude.ai/connect-github (y, si no está instalada, la app de GitHub de Claude en el repo: https://github.com/apps/claude/installations/select_target). Después pídeme en esta misma sesión «haz el push» y lo hago yo.
2. O hazlo tú desde un ordenador con este código:
   ```bash
   git push origin claude/vibrant-mendel-ps8dqv:main
   ```
   El workflow `.github/workflows/deploy.yml` se ejecuta con cada push (en cualquier rama: `branches: ['**']`), pasa los tests, compila con `base: '/mus-app/'` y publica en https://mikelhernandezbueso.github.io/mus-app/. Como Pages está configurado con «GitHub Actions», no hace falta nada más. Si haces push primero a `main`, `main` queda como rama por defecto, que es la que el entorno `github-pages` deja desplegar.

## Qué he construido

Una PWA (Vite + React + TypeScript) para aprender mus desde cero, estilo Duolingo, en castellano y con vocabulario en euskera.

- **Motor** (`src/engine`, TS puro): baraja, valores a 8 y 4 reyes, grande, chica, pares (pareja/medias/duples, 4 iguales = duples), juego (orden 31, 32, 40, 37…33), 31 real opcional, punto, desempates por la mano, máquina de estados de la mano (mus, descartes con rebarajado, lances con voz solo para quien tiene la jugada, envites, subidas, órdago, dejes inmediatos), recuento en orden con victoria al llegar primero, partida con juegos y vacas, señas que corresponden a cada mano.
- **Tests**: 294 casos con Vitest (motor, bots, generadores, y una batería que comprueba con el motor los ejemplos escritos en las lecciones y en el reglamento).
- **Bots** (`src/ai`): 3 niveles. Deciden mus/corte y descartes con heurísticas de jugador real, y los envites con una estimación **Monte Carlo** que solo usa lo que ese jugador sabe (sus cartas, lo declarado en pares/juego y las señas vistas). Tienen en cuenta el marcador para el órdago. En la simulación el experto gana a principiantes la mayoría de las partidas.
- **Tutor**: en cada decisión sugiere la jugada (razonando como el bot experto, sin ver cartas ajenas) y explica por qué con la probabilidad estimada; al final de la mano lista lo que hiciste bien y mal.
- **Señas en partida**: tu compañera (Maite) te hace su seña al cortar el mus (cara animada) y tú puedes hacerle la tuya; no deja hacer señas falsas. Puedes "pillar" señas de los rivales y ellos las tuyas (probabilidad según el nivel).
- **Generador de ejercicios** (`src/exercises`): 30 generadores con respuesta calculada por el motor: ¿quién gana cada lance? (2 o 4 manos, con empates), tipo de pares, tocar las cartas de los pares, sumar el juego, ¿juego o punto?, ordenar manos, qué descartar, decidir el envite (solo situaciones claras según la probabilidad), reconocer señas (cara SVG animada), qué seña harías, relacionar términos, cuánto se cobra (dejes, pares, juego), recuento completo, quién llega a 40, órdagos, amarracos y manos de examen de 6 preguntas.
- **Temario**: 17 unidades y 43 lecciones (las 17 pedidas), con explicaciones cortas y cercanas y feedback inmediato con el porqué.
- **Gamificación**: XP, niveles con títulos ("Mirón de barra" → "Leyenda del txoko"), racha diaria, estrellas por lección, 20 logros, repaso de errores con repetición espaciada (Leitner: 1, 3, 7 y 16 días), sonidos sintetizados (silenciables), confeti y animaciones sutiles.
- **Secciones**: Aprender (camino), Practicar (14 temas + mezcla + repaso), Jugar (2 contra 2, nivel elegible, tutor, partida guardada para continuar), Consultar (reglamento navegable con reglas de la casa, tabla rápida, orden de juegos, chuleta de señas, glosario castellano/euskera con buscador), Ajustes (variante, 31 real, a 30/40, juegos por vaca, sonido, ayudas visuales, tema claro/oscuro/auto, nivel de bots, tutor, reiniciar progreso).
- **Diseño propio**: tapete verde, madera, crema; tipografías Fraunces + Nunito (autoalojadas, funcionan offline); cartas de la baraja española dibujadas en SVG desde cero (las "pintas" del marco según el palo, el rey con corona, el caballo, la sota con txapela), etiquetas "=R"/"=A" en treses y doses; onboarding de 3 pantallas; modo oscuro. Pensado para una mano en 390x844.
- **PWA**: manifest, iconos propios (generados desde un SVG propio), service worker con precache: probado que recarga sin conexión.

## Decisiones tomadas

- **Investigación**: no se podían descargar páginas (la red del entorno bloquea WebFetch/curl salvo npm), así que contrasté cada regla con extractos del buscador de 3 o más fuentes (Ludoteka, Las40, Mus2000, normas de Bizkaia y Txapeldunes de ASESMUS, reglamento de La Federación de Mus, Asociación Navarra, Fournier, Euskaltzaindia…). Todo está citado en `docs/REGLAMENTO.md`.
- **Rutas por hash** (`#/aprender`) para no tener 404 en GitHub Pages; en la vista de Artifact se usa un router en memoria.
- **Progreso en localStorage** con todo envuelto en try/catch.
- **Los ejercicios de envite** solo se generan cuando la decisión es clara (≥80% o ≤20% para envidar/pasar; ≥72% o ≤22% para querer/no querer), para que la respuesta "correcta" lo sea de verdad.
- Las preguntas de teoría (conceptos) están escritas a mano; todas las preguntas sobre manos concretas las calcula el motor.
- Nombres de la mesa: Tú y Maite contra Iker y Jon.

## Reglas de la casa

1. Mus a **8 reyes** (treses = reyes, doses = ases), configurable a 4 reyes.
2. Juego a **40** tantos (configurable a 30); vaca de 1 juego por defecto (configurable a 2 o 3 juegos ganados).
3. **31 real desactivada** por defecto ("ganan las 31 de mano", normas de Bizkaia/ASESMUS); si se activa: tres sietes y una figura, gana a cualquier 31 y vale 3.
4. Envite mínimo 2; deje de 1 (primer envite) o lo envidado antes (subida); los dejes se cobran en el momento.
5. Basta un "quiero" de la pareja para aceptar.
6. En pares y juego solo hablan quienes tienen la jugada; si solo una pareja tiene, no hay envites.
7. Envite no querido en pares/juego: quien envidó cobra el deje y sus jugadas al final. En el punto, el deje y el tanto del punto.
8. Punto: 1 tanto en paso; querido, lo envidado + 1.
9. Descarte mínimo de una carta; si se acaba el mazo, se barajan los descartes anteriores.
10. Señas solo tras cortar el mus; sin señas falsas ni parciales; lista: dos reyes (morder labio inferior), tres reyes (morderlo por un lado), dos ases (punta de la lengua), tres ases (lengua por un lado), medias (torcer la boca), duples (levantar cejas), 31 (guiñar un ojo), ciego (cerrar los ojos), solomillo (beso).

## Problemas encontrados

- **Sin permiso de escritura en GitHub** (ver arriba): es lo único que falta para cumplir "desplegada en GitHub Pages". Todo lo demás está hecho y verificado en local.
- Sin acceso web completo: la investigación se hizo con extractos de buscador; algún término coloquial vasco (p. ej. *kanpo*) tiene uso variable y así se indica en el glosario.
- Las fuentes discrepan en algunas señas (tres reyes, duples), en la 31 real y en la vaca: se eligió lo más extendido en Euskadi y se documentan las alternativas.

## Verificación

- `npm test`: 294 tests en verde. `npm run build`: sin errores de TypeScript.
- Playwright en 390x844 (`scripts/e2e.cjs`): onboarding, dos lecciones completas, una ronda de práctica, todas las pestañas de Consultar, Ajustes, Logros y **una partida completa contra bots** hasta el final, en claro y oscuro, sin errores de consola ni scroll horizontal. `scripts/offline.cjs` comprueba el manifest y la carga sin conexión.

## Qué mejoraría después

- Mano guiada interactiva paso a paso (con cartas fijas) en la unidad 12.
- Bots expertos que modelen los faroles del rival y la información de quién corta el mus.
- Animación de reparto/recogida de cartas y fichas en la mesa; vibración háptica.
- Más variantes regionales (mus corrido, "juego a la mano", tantos de la real distintos).
- Estadísticas por lance (en qué fallas más) y repaso dirigido por tema.
- Sincronizar el progreso entre dispositivos (exportar/importar).
