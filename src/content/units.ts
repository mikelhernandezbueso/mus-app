// Temario: unidades → lecciones → pasos (explicación o ejercicio generado por el motor).
import type { SenaId, Variant } from '../engine';

export type Step =
  | { t: 'teach'; title: string; body: string; cards?: string; face?: SenaId; variant?: Variant; hint?: boolean }
  | { t: 'ex'; gen: string; opts?: Record<string, string | number | boolean>; n?: number; variant?: Variant; real31?: boolean };

export interface Lesson {
  id: string;
  title: string;
  steps: Step[];
}

export interface Unit {
  id: string;
  n: number;
  title: string;
  eu?: string;
  desc: string;
  icon: string;
  lessons: Lesson[];
}

const q = (...ids: string[]): Step[] => ids.map((id) => ({ t: 'ex', gen: 'quiz', opts: { id } }));
const ex = (gen: string, n = 1, opts?: Record<string, string | number | boolean>, variant?: Variant): Step => ({ t: 'ex', gen, n, opts, variant });

export const UNITS: Unit[] = [
  {
    id: 'u1', n: 1, title: 'La baraja', eu: 'Kartak', icon: '🂠', desc: 'Palos, figuras y lo que vale cada carta a 8 reyes.',
    lessons: [
      {
        id: 'u1l1', title: 'Palos y cartas',
        steps: [
          { t: 'teach', title: '¡Ongi etorri a la mesa!', body: 'El mus se juega con la **baraja española de 40 cartas**: no hay ochos, ni nueves, ni comodines.\n\nHay **cuatro palos**: oros, copas, espadas y bastos. Buena noticia: en el mus **el palo no importa nunca**. Solo cuenta el número.', cards: '1o 1c 1e 1b' },
          { t: 'teach', title: 'Números y figuras', body: 'Cada palo tiene: **as (1), 2, 3, 4, 5, 6, 7** y tres figuras:\n• **Sota** = 10\n• **Caballo** = 11\n• **Rey** = 12', cards: '10o 11c 12e' },
          ...q('baraja40', 'palos', 'paloimporta', 'figuras'),
        ],
      },
      {
        id: 'u1l2', title: 'Mus a 8 reyes',
        steps: [
          { t: 'teach', title: 'El truco de los 8 reyes', body: 'En Euskadi se juega casi siempre **a 8 reyes**:\n• Los **treses valen como reyes**.\n• Los **doses valen como ases**.\n\nAsí hay 8 "reyes" y 8 "ases" (los ases también se llaman **pitos**). Vale para todo: grande, chica, pares y juego.', cards: '12o 3c 1e 2b', hint: true },
          { t: 'teach', title: 'Orden de las cartas', body: 'De más alta a más baja:\n**Rey = 3 › Caballo › Sota › 7 › 6 › 5 › 4 › As = 2**\n\nVerás una etiqueta pequeña en los treses y doses para recordarlo.', cards: '3o 11c 10e 7b 4o 2c', hint: true },
          ...q('tresrey', 'dosas', 'cuantosreyes'),
          ex('cardEquiv', 4),
        ],
      },
      {
        id: 'u1l3', title: 'Valor para el juego',
        steps: [
          { t: 'teach', title: 'Sumar puntos', body: 'En el lance de **juego** se suman las cartas:\n• **Figuras** (sota, caballo, rey) **y treses**: 10\n• **4, 5, 6, 7**: su número\n• **As y dos**: 1', cards: '12o 3c 7e 2b', hint: true },
          ...q('valorfiguras'),
          ex('cardValue', 4),
          ex('cardValue', 3, { tricky: true }),
        ],
      },
    ],
  },
  {
    id: 'u2', n: 2, title: 'La mesa', eu: 'Mahaia', icon: '🪑', desc: 'Parejas, la mano, el postre y el orden de los lances.',
    lessons: [
      {
        id: 'u2l1', title: 'Parejas y sitios',
        steps: [
          { t: 'teach', title: 'Dos contra dos', body: 'Se juega **cuatro jugadores en dos parejas**. Tu compañero se sienta **enfrente**; los rivales, a tus lados.\n\nEn esta app: **tú** abajo, **Maite** (tu compañera) arriba, **Iker** a tu derecha y **Jon** a tu izquierda.' },
          { t: 'teach', title: 'Hacia la derecha', body: 'Todo va **hacia la derecha** (al revés que las agujas del reloj): el reparto, el turno de hablar y la rotación de la mano.' },
          ...q('jugadores', 'companero', 'sentido', 'reparto'),
        ],
      },
      {
        id: 'u2l2', title: 'La mano y el postre',
        steps: [
          { t: 'teach', title: 'La mano', body: 'El que reparte es el **postre**. El jugador a su derecha es **la mano**: habla el primero en todo y, muy importante, **gana todos los empates**.\n\nEn cada reparto la mano pasa al de la derecha.' },
          ...q('quienmano', 'postre', 'ventajamano', 'rotamano'),
        ],
      },
      {
        id: 'u2l3', title: 'Los cuatro lances',
        steps: [
          { t: 'teach', title: 'Cuatro apuestas en una mano', body: 'Cada mano se juega en cuatro **lances**, siempre en este orden:\n1. **Grande** (handia): cartas altas.\n2. **Chica** (txikia): cartas bajas.\n3. **Pares** (pareak): cartas iguales.\n4. **Juego** (jokoa): sumar 31 o más… o **Punto** si nadie tiene juego.' },
          ...q('orden'),
          ex('matchTerms', 1, { set: 'basico' }),
        ],
      },
    ],
  },
  {
    id: 'u3', n: 3, title: 'El mus', eu: 'Musa', icon: '🔄', desc: 'Pedir mus, cortar y descartarse.',
    lessons: [
      {
        id: 'u3l1', title: 'Mus o no hay mus',
        steps: [
          { t: 'teach', title: 'Lo primero: ¿mus?', body: 'Tras repartir, desde la mano cada uno dice:\n• **"Mus"**: quiero cambiar cartas.\n• **"No hay mus"**: corto, juguemos con lo que hay.\n\nBasta con que **uno** corte para que empiecen los lances.' },
          { t: 'teach', title: 'Los descartes', body: 'Si los **cuatro** piden mus, cada uno tira **de 1 a 4 cartas** y recibe otras tantas del mazo. Luego se vuelve a preguntar: ¿mus?\n\nSi el mazo se acaba, se barajan los descartes y se sigue.' },
          ...q('quees_mus', 'cortar', 'todosmus', 'cuantasdescartes', 'mazovacio'),
        ],
      },
      {
        id: 'u3l2', title: 'Qué tirar',
        steps: [
          { t: 'teach', title: 'Ir a por algo', body: 'Al descartarte eliges un objetivo:\n• **A reyes** (grande): te quedas los reyes y treses.\n• **A la chica**: te quedas los ases y doses.\n• **A pares**: guardas tu pareja.', cards: '12o 3c 5e 6b', hint: true },
          ex('discardReyes', 2),
          ex('discardChica', 2),
          ex('discardPares', 2),
        ],
      },
    ],
  },
  {
    id: 'u4', n: 4, title: 'Grande', eu: 'Handia', icon: '👑', desc: 'Ganan las cartas más altas.',
    lessons: [
      {
        id: 'u4l1', title: 'Comparar a la grande',
        steps: [
          { t: 'teach', title: 'Carta a carta', body: 'Ordena tus cartas de mayor a menor y compara con el rival **la más alta**. Si es igual, la segunda; luego la tercera…\n\nEj.: **R R C 5** gana a **R R S 7**: empatan los reyes y en la tercera el caballo gana a la sota.', cards: '12o 12c 11e 5b', hint: true },
          ...q('grandeque', 'mejorgrande'),
          ex('grandeWinner', 4, { n: 2 }),
        ],
      },
      {
        id: 'u4l2', title: 'Grande a cuatro',
        steps: [
          { t: 'teach', title: 'En la mesa de verdad', body: 'En la mesa hay cuatro manos. Gana la más alta de todas. Si dos son iguales, gana la que está **más cerca de la mano**.\n\nSi todos pasan, la grande vale **1 tanto** para quien la gane.' },
          ...q('grandepaso'),
          ex('grandeWinner', 3, { n: 4 }),
          ex('orderHands', 2, { lance: 'grande' }),
        ],
      },
    ],
  },
  {
    id: 'u5', n: 5, title: 'Chica', eu: 'Txikia', icon: '🐜', desc: 'Ganan las cartas más bajas.',
    lessons: [
      {
        id: 'u5l1', title: 'Comparar a la chica',
        steps: [
          { t: 'teach', title: 'Al revés que la grande', body: 'A la chica gana **lo más bajo**. Ordena de menor a mayor y compara la **más baja**; si empatan, la siguiente…\n\nEj.: **A A 4 7** gana a **A A 5 6**: en la tercera carta, 4 es más bajo que 5.\n\nA 8 reyes, el **dos es as**: A-2 son "dos ases".', cards: '1o 2c 4e 7b', hint: true },
          ...q('chicaque', 'mejorchica'),
          ex('chicaWinner', 4, { n: 2 }),
        ],
      },
      {
        id: 'u5l2', title: 'Grande y chica',
        steps: [
          { t: 'teach', title: 'No se puede tener todo', body: 'Una mano con reyes suele ser mala a la chica, y al revés. Por eso los buenos jugadores deciden pronto **a qué van**.' },
          ex('chicaWinner', 3, { n: 4 }),
          ex('orderHands', 2, { lance: 'chica' }),
          ex('grandeWinner', 1, { n: 4 }),
        ],
      },
    ],
  },
  {
    id: 'u6', n: 6, title: 'Pares', eu: 'Pareak', icon: '👯', desc: 'Pareja, medias y duples.',
    lessons: [
      {
        id: 'u6l1', title: 'Pareja, medias y duples',
        steps: [
          { t: 'teach', title: 'Cartas iguales', body: '• **Pareja**: dos iguales (R R).\n• **Medias**: tres iguales (S S S).\n• **Duples**: dos parejas (R R A A) o cuatro iguales.\n\nA 8 reyes, **R y 3 son iguales**, y **A y 2 también**.', cards: '12o 3c 10e 10b', hint: true },
          ex('paresKind', 4),
          ex('tapPares', 3),
        ],
      },
      {
        id: 'u6l2', title: 'Quién gana los pares',
        steps: [
          { t: 'teach', title: 'Primero el tipo, luego el valor', body: '**Duples › medias › pareja**, sea cual sea el valor. A igual tipo, ganan las cartas **más altas** (orden de la grande).\n\nEn duples se compara la pareja alta y, si empata, la baja. **Cuatro reyes** son duples "de reyes y reyes": ganan a R R C C.', cards: '12o 12c 11e 11b' },
          ...q('paresorden', 'cuatroreyes', 'paresdeclarar', 'paresvoz'),
          ex('paresWinner', 3, { n: 2 }),
          ex('paresWinner', 2, { n: 4 }),
          ex('orderHands', 1, { lance: 'pares' }),
        ],
      },
      {
        id: 'u6l3', title: 'Cuánto valen',
        steps: [
          { t: 'teach', title: 'El premio de los pares', body: 'En el recuento, la pareja que gana los pares cobra **las jugadas de los dos**:\n• Pareja: **1**\n• Medias: **2**\n• Duples: **3**\n\nSi solo una pareja tiene pares, no hay envites: cobra sus jugadas y listo.' },
          ...q('paresvalor', 'cobrancompanero', 'paresuna'),
          ex('paresValue', 3),
          ex('cobroLance', 2, { lance: 'pares' }),
        ],
      },
    ],
  },
  {
    id: 'u7', n: 7, title: 'Juego y punto', eu: 'Jokoa', icon: '🎯', desc: 'Sumar 31 o más, el orden de los juegos y el punto.',
    lessons: [
      {
        id: 'u7l1', title: '¿Tengo juego?',
        steps: [
          { t: 'teach', title: 'Sumar 31', body: 'Suma tus cartas (figuras y treses 10, ases y doses 1, el resto su número). Con **31 o más** tienes **juego**. Lo máximo es 40.\n\nEj.: R + C + 7 + 4 = 10 + 10 + 7 + 4 = **31**.', cards: '12o 11c 7e 4b' },
          ...q('juegocuanto'),
          ex('juegoSum', 4),
          ex('hasJuego', 3),
        ],
      },
      {
        id: 'u7l2', title: 'El orden de los juegos',
        steps: [
          { t: 'teach', title: 'La 31 manda', body: 'No gana el que más suma. El orden es:\n**31 › 32 › 40 › 37 › 36 › 35 › 34 › 33**\n\n(38 y 39 son imposibles con cuatro cartas.) Valor: la 31, **3 tantos**; los demás juegos, **2**.' },
          ...q('juegoorden', 'juego38', 'juegovalor'),
          ex('juegoWinner', 3, { n: 2 }),
          ex('orderHands', 1, { lance: 'juego' }),
          ex('cobroLance', 1, { lance: 'juego' }),
        ],
      },
      {
        id: 'u7l3', title: 'El punto',
        steps: [
          { t: 'teach', title: 'Cuando nadie tiene juego', body: 'Si **ninguno de los cuatro** llega a 31, el último lance es el **punto**: gana la suma más alta (máx. 30). Vale **1 tanto**.\n\nBasta con que uno tenga juego para que se juegue el juego.' },
          ...q('puntocuando', 'puntovale'),
          ex('juegoOrPunto', 3),
          ex('puntoWinner', 2),
        ],
      },
      {
        id: 'u7l4', title: 'La 31 real',
        steps: [
          { t: 'teach', title: 'Una regla que cambia de mesa', body: 'La **31 real** son **tres sietes y una figura**. Donde se juega, gana a cualquier otra 31, aunque sea de mano.\n\nEn Bizkaia y en muchos torneos **no vale** ("ganan las 31 de mano"), así que en la app viene desactivada. Puedes activarla en Ajustes.', cards: '7o 7c 7e 10b' },
          ...q('real31'),
          { t: 'ex', gen: 'juegoWinner', n: 2, opts: { n: 2 }, real31: true },
        ],
      },
    ],
  },
  {
    id: 'u8', n: 8, title: 'Empates y la mano', icon: '✋', desc: 'En el mus no hay empates: manda la mano.',
    lessons: [
      {
        id: 'u8l1', title: 'Desempates',
        steps: [
          { t: 'teach', title: 'La mano siempre gana el empate', body: 'Si dos jugadores tienen exactamente lo mismo en un lance, gana **el más cercano a la mano**, contando hacia la derecha: la mano, luego el de su derecha, etc.\n\nPasa en todos los lances: grande, chica, pares, juego y punto.' },
          ...q('empate', 'empateorden'),
          ex('tieMano', 3),
        ],
      },
      {
        id: 'u8l2', title: 'La mano en todos los lances',
        steps: [
          { t: 'teach', title: 'La 31 de mano', body: 'Por eso una **31 de mano** es casi imbatible: solo puede perderla una 31 real (si se juega). Y por eso ser mano vale tanto en pares y juego.' },
          ...q('posicion'),
          ex('tieMano', 2, { lance: 'pares' }),
          { t: 'ex', gen: 'juegoWinner', n: 2, opts: { n: 2, tie: true } },
          ex('puntoWinner', 1, { n: 4, tie: true }),
        ],
      },
    ],
  },
  {
    id: 'u9', n: 9, title: 'Envites', icon: '🪙', desc: 'Paso, envido, quiero y no quiero.',
    lessons: [
      {
        id: 'u9l1', title: 'Paso y envido',
        steps: [
          { t: 'teach', title: 'Apostar en cada lance', body: 'En cada lance, desde la mano, cada uno puede:\n• **Paso**: no apuesto (por ahora).\n• **Envido**: apuesto **2 tantos** (o más: "envido cinco").\n\nSi todos pasan, el lance queda **en paso**.' },
          ...q('envidocuanto', 'paso'),
          ex('betDecision', 3, { respond: false }),
        ],
      },
      {
        id: 'u9l2', title: 'Quiero / no quiero',
        steps: [
          { t: 'teach', title: 'Responder a un envite', body: 'Si te envidan, tu pareja responde:\n• **Quiero**: aceptamos; se ve al final quién gana.\n• **No quiero**: ellos cobran el **deje** ahora mismo.\n• **Envidar más**: "dos más", "cinco más"…\n\nBasta con que **uno** de la pareja quiera.' },
          ...q('quiero', 'noquiero', 'bastauno', 'noquierosubida'),
          ex('betDecision', 3, { respond: true }),
        ],
      },
      {
        id: 'u9l3', title: 'Qué se cobra',
        steps: [
          { t: 'teach', title: 'La tabla de cobros', body: '• **En paso**: grande, chica y punto, 1 tanto; pares y juego, sus jugadas.\n• **Querido**: lo envidado (+ jugadas en pares y juego; + 1 en el punto).\n• **No querido**: el deje (1, o lo envidado antes de la última subida), en el momento. En pares y juego, además, el que envidó cobra sus jugadas al final.' },
          ...q('enpasopares', 'noquieropares'),
          ex('cobroDeje', 3),
          ex('cobroLance', 2),
        ],
      },
    ],
  },
  {
    id: 'u10', n: 10, title: 'El órdago', eu: 'Hordago', icon: '💥', desc: '¡Hor dago! Todo a una carta.',
    lessons: [
      {
        id: 'u10l1', title: '¡Hor dago!',
        steps: [
          { t: 'teach', title: 'Todo o nada', body: 'El **órdago** es envidar **la partida entera**. Viene del euskera **"hor dago"**: "¡ahí está!".\n\nSi se quiere, **se enseñan las cartas en el acto** y quien gana ese lance gana el juego. Si no se quiere, es como un envite rechazado (deje).' },
          ...q('ordago', 'ordagoquerido', 'ordagonoquerido', 'ordagosubir'),
          ex('ordagoWinner', 3),
        ],
      },
      {
        id: 'u10l2', title: 'Cuándo echarlo',
        steps: [
          { t: 'teach', title: 'Un arma de doble filo', body: 'Se suele echar órdago:\n• Con una jugada **casi segura** (p. ej. 31 de mano).\n• Cuando **el rival está a punto de ganar** y no tienes nada que perder.\n• Como **farol**, si crees que no te lo van a querer.\n\nY se quiere solo si crees que lo ganas más de la mitad de las veces.' },
          ex('ordagoWinner', 2, { lance: 'grande' }),
          ex('ordagoWinner', 2, { lance: 'chica' }),
        ],
      },
    ],
  },
  {
    id: 'u11', n: 11, title: 'Puntuación', icon: '🪨', desc: 'Piedras, amarracos, el recuento, juegos y vacas.',
    lessons: [
      {
        id: 'u11l1', title: 'Piedras y amarracos',
        steps: [
          { t: 'teach', title: 'Contar con piedras', body: 'La unidad es el **tanto** o **piedra**. Cinco tantos son un **amarraco** (del euskera *hamarreko*, según la tradición).\n\nSe juega **a 40 tantos** (8 amarracos) o a 30.' },
          ...q('amarraco', 'juego40'),
          ex('amarracos', 3),
        ],
      },
      {
        id: 'u11l2', title: 'El recuento',
        steps: [
          { t: 'teach', title: 'Al levantar las cartas', body: 'Los **dejes** se apuntan en el momento. Todo lo demás se cuenta al final, **en orden**: grande, chica, pares y juego (o punto).\n\nGana el juego **la primera pareja que llega a 40** en ese orden, aunque la otra llegara después.' },
          ...q('dejecuando', 'recuentoorden'),
          ex('recuentoPaso', 2),
          ex('quienLlega', 2),
        ],
      },
      {
        id: 'u11l3', title: 'Juegos y vacas',
        steps: [
          { t: 'teach', title: 'La vaca', body: 'Ganar 40 tantos es ganar **un juego**. Varios juegos forman una **vaca** (por ejemplo, al mejor de 3). En la app puedes elegir 1, 2 o 3 juegos para ganar la vaca.' },
          ...q('vaca'),
          ex('quienLlega', 1),
        ],
      },
    ],
  },
  {
    id: 'u12', n: 12, title: 'Mano completa', icon: '🃏', desc: 'De principio a fin, y examen.',
    lessons: [
      {
        id: 'u12l1', title: 'Paso a paso',
        steps: [
          { t: 'teach', title: 'Una mano entera', body: '1. Reparto: 4 cartas a cada uno.\n2. **Mus**: se pide o se corta; descartes.\n3. **Grande**, **chica**, **pares** (declarando sí/no) y **juego** o **punto**, con sus envites.\n4. **Recuento** en orden.\n\nVamos a analizar unas cuantas manos.' },
          ex('examHand', 1),
          ex('recuentoPaso', 1),
        ],
      },
      {
        id: 'u12l2', title: 'Examen',
        steps: [
          { t: 'teach', title: 'Manos de examen', body: 'Dos manos completas. Sin prisa: mira bien quién es mano.' },
          ex('examHand', 2),
          ex('cobroDeje', 1),
          ex('ordagoWinner', 1),
        ],
      },
    ],
  },
  {
    id: 'u13', n: 13, title: 'Las señas', icon: '😉', desc: 'Hablar con tu compañero sin abrir la boca.',
    lessons: [
      {
        id: 'u13l1', title: 'Reyes y ases',
        steps: [
          { t: 'teach', title: 'El idioma secreto', body: 'Las **señas** son gestos para contarle a tu compañero lo que llevas. Son legales, pero **el rival también puede verlas**: hazlas con disimulo.\n\n**Dos reyes**: morderse el labio inferior.', face: 'dosReyes' },
          { t: 'teach', title: 'Tres reyes', body: '**Tres reyes** (medias de reyes): morderse el labio inferior **por un lado**.', face: 'tresReyes' },
          { t: 'teach', title: 'Los pitos', body: '**Dos ases**: sacar la punta de la lengua.\n**Tres ases**: sacarla por un lado.', face: 'dosAses' },
          ex('senaMeaning', 3),
        ],
      },
      {
        id: 'u13l2', title: 'Medias, duples, 31 y ciego',
        steps: [
          { t: 'teach', title: 'Medias y duples', body: '**Medias** (que no sean de reyes ni ases): torcer la boca hacia un lado.\n**Duples**: levantar las cejas.', face: 'duples' },
          { t: 'teach', title: '31 y ciego', body: '**31**: guiñar un ojo.\n**Ciego** (no llevo nada): cerrar los dos ojos.\n\nCuriosidad: **solomillo** (tres reyes y un as, medias y 31) se indica con un beso.', face: 'treintaYUna' },
          ex('senaMeaning', 2),
          ex('senaGesture', 2),
          ex('senaForHand', 3),
        ],
      },
      {
        id: 'u13l3', title: 'Normas de las señas',
        steps: [
          { t: 'teach', title: 'Juego limpio', body: '• Solo **después de cortar el mus**.\n• Solo las **señas reglamentadas**.\n• **Nunca falsas** ni parciales: con duples de reyes y ases, la seña es duples.\n• Si pillas una seña del rival, ¡aprovéchala!' },
          ...q('senacuando', 'senafalsa', 'senarival', 'senaparcial'),
          ex('senaForHand', 2),
        ],
      },
    ],
  },
  {
    id: 'u14', n: 14, title: 'Estrategia básica', icon: '🧠', desc: 'Cuándo cortar, qué tirar, cuándo envidar.',
    lessons: [
      {
        id: 'u14l1', title: 'Cuándo cortar el mus',
        steps: [
          { t: 'teach', title: 'Corta con algo bueno', body: 'Se corta el mus con:\n• **Duples** o **medias** altas.\n• **La 31** (sobre todo de mano).\n• **Dos reyes y juego**, o buena chica con pares de ases.\n\nCon una mano floja, pide mus: cambiar no cuesta nada.' },
          ...q('cortar31', 'cortarduples'),
          ex('discardReyes', 1),
          ex('discardPares', 1),
        ],
      },
      {
        id: 'u14l2', title: 'Envidar o pasar',
        steps: [
          { t: 'teach', title: 'Piensa en probabilidades', body: 'Antes de envidar pregúntate: **¿cuántas veces gano este lance?** Si es la mayoría, envida. Si es poco, pasa.\n\nCuenta también con tu compañero: si te ha hecho seña de reyes, la grande es vuestra.' },
          ex('betDecision', 3, { respond: false }),
          ex('betDecision', 3, { respond: true }),
        ],
      },
    ],
  },
  {
    id: 'u15', n: 15, title: 'Estrategia avanzada', icon: '♟️', desc: 'Probabilidades, faroles, leer al rival y el marcador.',
    lessons: [
      {
        id: 'u15l1', title: 'Probabilidades',
        steps: [
          { t: 'teach', title: 'Lo que dicen los números', body: 'Algunas cifras útiles (a 8 reyes):\n• Hay **8 reyes y 8 ases** de 40 cartas: un 20% cada uno.\n• Tener **juego** con las cuatro cartas iniciales: más o menos **1 de cada 4** veces (27%). La **31**, un 9%.\n• Tener **pares**: algo más de **la mitad** de las veces (56%). **Duples**, solo un 4%.\n\nUsa lo declarado (pares sí/no, juego sí/no) para afinar.' },
          ex('betDecision', 4),
        ],
      },
      {
        id: 'u15l2', title: 'Faroles y lectura',
        steps: [
          { t: 'teach', title: 'Mentir con estilo', body: 'Un **farol** funciona mejor:\n• Siendo **postre** después de que todos pasen.\n• Contra rivales que no quieren casi nunca.\n• Con el marcador a tu favor (el deje suma).\n\nY **lee al rival**: quien corta el mus suele llevar algo; quien pide mus muchas veces, poco.' },
          ...q('faroles', 'postrefarol'),
          ex('betDecision', 2, { respond: true }),
        ],
      },
      {
        id: 'u15l3', title: 'El marcador',
        steps: [
          { t: 'teach', title: 'Jugar con los tantos', body: '• Si vas **muy por detrás**, el órdago es tu amigo.\n• Si vas **por delante**, no quieras órdagos dudosos.\n• Cerca de 40, recuerda: **la grande se cuenta primero**. A veces 1 tanto de grande en paso vale más que un envite a juego.' },
          ex('quienLlega', 3),
        ],
      },
    ],
  },
  {
    id: 'u16', n: 16, title: 'Mus a 4 reyes', icon: '4️⃣', desc: 'La otra variante: qué cambia.',
    lessons: [
      {
        id: 'u16l1', title: 'Qué cambia',
        steps: [
          { t: 'teach', title: 'Treses y doses normales', body: 'En el **mus a 4 reyes** los treses y doses **valen su número**:\n• Solo hay **4 reyes** y **4 ases**.\n• A la grande: R › C › S › 7 › … › 3 › 2 › A.\n• En el juego, el 3 vale 3 y el 2 vale 2.\n• Un 3 y un rey **ya no son pareja**.', cards: '3o 2c 12e 1b', variant: '4reyes' },
          ...q('4r_tres', '4r_dos', '4r_grande', '4r_cuantos'),
          ex('cardValue', 3, { tricky: true }, '4reyes'),
        ],
      },
      {
        id: 'u16l2', title: 'Practica a 4 reyes',
        steps: [
          { t: 'teach', title: 'Cambia el chip', body: 'Las reglas de lances, envites y tanteo son las mismas. Solo cambia cómo cuentan treses y doses. Puedes jugar a 4 reyes cambiándolo en Ajustes.', variant: '4reyes' },
          ex('paresKind', 2, undefined, '4reyes'),
          ex('grandeWinner', 2, { n: 2 }, '4reyes'),
          ex('chicaWinner', 2, { n: 2 }, '4reyes'),
          ex('juegoSum', 2, undefined, '4reyes'),
        ],
      },
    ],
  },
  {
    id: 'u17', n: 17, title: 'Vocabulario', eu: 'Hiztegia', icon: '📖', desc: 'Habla como en la sociedad: castellano y euskera.',
    lessons: [
      {
        id: 'u17l1', title: 'En castellano',
        steps: [
          { t: 'teach', title: 'Palabras de mesa', body: '**Pitos**: ases. **Postre**: el que reparte. **Deje**: lo que se cobra por un no quiero. **Farol**: envidar sin cartas. **Solomillo**: tres reyes y as. **En paso**: nadie envida.' },
          ex('matchTerms', 2, { set: 'envites' }),
          ex('matchTerms', 1, { set: 'jugadas' }),
        ],
      },
      {
        id: 'u17l2', title: 'En euskera',
        steps: [
          { t: 'teach', title: 'Euskaraz', body: '**Handia** (grande), **txikia** (chica), **pareak** (pares), **jokoa** (juego), **puntua** (punto). **Bai / ez**: sí / no. **Iduki / eutsi**: quiero (aguanto). **Hordago**: "ahí está". **Hamarreko**: amarraco. **Esku**: mano.' },
          ex('matchTerms', 3, { set: 'euskera' }),
        ],
      },
    ],
  },
];

export const ALL_LESSONS: { unit: Unit; lesson: Lesson; index: number }[] = UNITS.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l }))).map((x, index) => ({ ...x, index }));

export const lessonById = (id: string) => ALL_LESSONS.find((x) => x.lesson.id === id);
