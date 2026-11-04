# Plan de Mus Eskola

App PWA para aprender mus desde cero (estilo Duolingo). Reglas en [`REGLAMENTO.md`](./REGLAMENTO.md).

## Arquitectura

```
src/
  engine/        Motor puro TS (sin UI): cartas, evaluación, mano, partida, recuento
    types.ts       Tipos: Card, Rules, Seat, Lance, acciones
    rng.ts         RNG con semilla (mulberry32) → ejercicios reproducibles
    cards.ts       Baraja, barajar, valores según variante, nombres
    evaluate.ts    Grande, chica, pares, juego, punto, comparar y ganador con la mano
    hand.ts        Máquina de estados de una mano: mus → descartes → lances → recuento
    scoring.ts     Recuento final en orden de lances
    game.ts        Partida: tantos, juegos, vacas, rotación de la mano
    senas.ts       Qué seña corresponde a una mano
    __tests__/     Vitest (>100 casos)
  ai/            Bots: estimación Monte Carlo condicionada a lo que se sabe (declaraciones, señas)
    estimate.ts    Probabilidad de ganar cada lance
    bot.ts         Decisiones (mus, descartes, envites) por nivel
    tutor.ts       Sugerencias + explicación + análisis al final de la mano
  exercises/     Generadores de ejercicios (respuesta SIEMPRE calculada por el motor)
  content/       Temario (unidades, lecciones, pasos), glosario, señas, reglamento navegable, logros
  state/         Progreso en localStorage (XP, racha, estrellas, repaso espaciado, ajustes)
  ui/            Componentes: Carta SVG, Cara de señas SVG, botones, hojas de feedback
  screens/       Onboarding, Aprender, Lección, Practicar, Jugar, Consultar, Ajustes
  audio.ts       Sonidos sintetizados con WebAudio (sin ficheros)
```

- Navegación por hash (`#/aprender`…) para que funcione en GitHub Pages sin 404.
- PWA con `vite-plugin-pwa` (precache de todo → offline), iconos propios SVG/PNG generados.
- Despliegue: `.github/workflows/deploy.yml` → GitHub Pages, `base: '/mus-app/'`.

## Temario

| # | Unidad | Lecciones |
|---|---|---|
| 1 | La baraja | Palos y cartas · Valores a 8 reyes · Valor para el juego |
| 2 | La mesa | Parejas y asientos · La mano y el postre · Orden de los lances |
| 3 | El mus | Pedir mus o cortar · Descartarse |
| 4 | Grande | Comparar a la grande · Practica la grande |
| 5 | Chica | Comparar a la chica · Grande y chica a la vez |
| 6 | Pares | Pareja, medias y duples · Comparar pares · Cuánto valen |
| 7 | Juego y punto | ¿Tengo juego? · El orden de los juegos · El punto |
| 8 | Empates y la mano | Desempates · La mano en todos los lances |
| 9 | Envites | Paso y envido · Quiero / no quiero · Qué se cobra |
| 10 | El órdago | El órdago · Cuándo se echa |
| 11 | Puntuación | Piedras y amarracos · El recuento · Juegos y vacas |
| 12 | Mano completa | Mano de principio a fin · Examen |
| 13 | Las señas | Señas de reyes y ases · Medias, duples, 31 y ciego · Normas |
| 14 | Estrategia básica | Cuándo cortar · Qué descartar · Envidar o pasar |
| 15 | Estrategia avanzada | Probabilidades · Faroles · Leer al rival · El marcador |
| 16 | Mus a 4 reyes | Qué cambia · Practica a 4 reyes |
| 17 | Vocabulario | Castellano · Euskera |

## Tipos de ejercicio
Opción múltiple (teoría) · ¿Quién gana el lance? · Toca las cartas de los pares · Valor del juego · ¿Juego o punto? · Ordenar manos · Qué descartar · Decidir el envite · Reconocer señas (cara SVG) · Qué seña harías · Relacionar términos · Cuánto se cobra · Mano de examen.

## Tareas

- [x] Investigación y REGLAMENTO.md
- [x] PLAN.md
- [x] Proyecto Vite + React + TS + PWA + workflow Pages
- [x] Motor + tests (≥100)
- [x] Generadores de ejercicios
- [x] Temario unidades 1-12 + reproductor de lecciones
- [x] Practicar + repaso espaciado
- [ ] Despliegue verificado en GitHub Pages (bloqueado: sin permiso de escritura en GitHub, ver INFORME.md)
- [x] Jugar contra bots + modo tutor + señas
- [x] Unidades 13-17, Consultar (reglamento, chuletas, glosario con buscador)
- [x] Logros, racha, niveles, sonidos, animaciones
- [x] Onboarding, modo oscuro
- [x] Recorrido Playwright 390x844 + capturas
- [x] Revisión experta del contenido
- [x] README.md, INFORME.md

## Siguientes mejoras
- [x] Mano guiada en la unidad 12
- [ ] Bots que modelen faroles del rival
- [ ] Animaciones de fichas y reparto en la mesa
- [ ] Estadísticas por lance
