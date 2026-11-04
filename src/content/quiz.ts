// Preguntas de teoría (conceptos). Las preguntas sobre manos concretas las genera el motor.
import { parseHand, type Card, type SenaId } from '../engine';

export interface QuizQ {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explain: string;
  cards?: Card[];
  face?: SenaId;
  keepOrder?: boolean;
}

export const QUIZ: QuizQ[] = [
  // Unidad 1: la baraja
  { id: 'baraja40', q: '¿Cuántas cartas tiene la baraja del mus?', options: ['40', '48', '52', '36'], answer: 0, explain: 'Se juega con la baraja española de 40 cartas: sin ochos, sin nueves y sin comodines.' },
  { id: 'palos', q: '¿Cuáles son los cuatro palos de la baraja española?', options: ['Oros, copas, espadas y bastos', 'Corazones, picas, tréboles y diamantes', 'Oros, copas, reyes y ases', 'Espadas, bastos, sotas y caballos'], answer: 0, explain: 'Oros, copas, espadas y bastos. En el mus el palo no importa nunca.' },
  { id: 'paloimporta', q: '¿Importa el palo de las cartas en el mus?', options: ['No, nunca', 'Sí, oros gana a todos', 'Solo en la grande', 'Solo en los pares'], answer: 0, explain: 'El palo no cuenta en ningún lance: solo importa el valor de la carta.' },
  { id: 'figuras', q: '¿Qué números llevan la sota, el caballo y el rey?', options: ['10, 11 y 12', '8, 9 y 10', '11, 12 y 13', '1, 2 y 3'], answer: 0, explain: 'Sota = 10, caballo = 11, rey = 12. No hay 8 ni 9.', keepOrder: true },
  { id: 'tresrey', q: 'Jugando a 8 reyes, ¿qué es un tres?', options: ['Un rey', 'Un as', 'Un tres normal', 'Un caballo'], answer: 0, explain: 'A 8 reyes los treses valen como reyes en todo. Por eso hay 8 "reyes" en la baraja.', cards: parseHand('3o') },
  { id: 'dosas', q: 'Jugando a 8 reyes, ¿qué es un dos?', options: ['Un as', 'Un rey', 'Un dos normal', 'Una sota'], answer: 0, explain: 'A 8 reyes los doses valen como ases (pitos): 8 ases en la baraja.', cards: parseHand('2c') },
  { id: 'cuantosreyes', q: 'A 8 reyes, ¿cuántas cartas cuentan como rey?', options: ['8', '4', '12', '6'], answer: 0, explain: 'Los 4 reyes y los 4 treses.' },
  { id: 'valorfiguras', q: '¿Cuánto vale una figura (sota, caballo o rey) para el juego?', options: ['10', 'Su número (10, 11, 12)', '1', '5'], answer: 0, explain: 'Todas las figuras valen 10 para sumar el juego.' },
  // Unidad 2: la mesa
  { id: 'jugadores', q: '¿Cuántos jugadores hay en una partida normal de mus?', options: ['4, en dos parejas', '2, uno contra uno', '3', '6, en tres parejas'], answer: 0, explain: 'Cuatro jugadores en dos parejas.' },
  { id: 'companero', q: '¿Dónde se sienta tu compañero?', options: ['Enfrente de ti', 'A tu derecha', 'A tu izquierda', 'Donde quiera'], answer: 0, explain: 'Los compañeros se sientan enfrente, así se alternan las parejas al hablar.' },
  { id: 'sentido', q: '¿En qué sentido se juega (se reparte y se habla)?', options: ['Hacia la derecha', 'Hacia la izquierda', 'Primero los de una pareja', 'Al azar'], answer: 0, explain: 'El mus va hacia la derecha: contrario a las agujas del reloj.' },
  { id: 'quienmano', q: '¿Quién es "la mano"?', options: ['El jugador a la derecha del que reparte', 'El que reparte', 'El que va ganando', 'El más veterano'], answer: 0, explain: 'La mano está a la derecha del que reparte (el postre). Habla siempre el primero.' },
  { id: 'postre', q: '¿Quién es "el postre"?', options: ['El que reparte, el último en hablar', 'El primero en hablar', 'El compañero de la mano', 'El que pierde'], answer: 0, explain: 'El postre reparte y es el último en hablar.' },
  { id: 'ventajamano', q: '¿Qué ventaja tiene ser mano?', options: ['Gana todos los empates', 'Cobra el doble', 'Puede ver una carta del rival', 'Ninguna'], answer: 0, explain: 'En el mus no hay empates: los gana la mano (o el más cercano a ella).' },
  { id: 'rotamano', q: 'Al acabar cada mano, ¿quién pasa a ser mano?', options: ['El jugador de la derecha', 'El que ha ganado', 'El mismo', 'El de la izquierda'], answer: 0, explain: 'La mano va rotando hacia la derecha en cada reparto.' },
  { id: 'orden', q: '¿En qué orden se juegan los lances?', options: ['Grande, chica, pares y juego', 'Pares, juego, grande y chica', 'Juego, pares, chica y grande', 'Chica, grande, juego y pares'], answer: 0, explain: 'Siempre: grande, chica, pares y juego (o punto). Y en ese mismo orden se cuenta al final.' },
  { id: 'reparto', q: '¿Cuántas cartas recibe cada jugador?', options: ['4', '5', '3', '6'], answer: 0, explain: 'Cuatro cartas, repartidas de una en una empezando por la mano.' },
  // Unidad 3: el mus
  { id: 'quees_mus', q: '¿Qué significa decir "mus"?', options: ['Que quieres cambiar cartas', 'Que tienes buenas cartas', 'Que envidas', 'Que te retiras'], answer: 0, explain: 'Pedir mus es pedir descarte: cambiar alguna carta.' },
  { id: 'cortar', q: '¿Qué pasa si un solo jugador dice "no hay mus"?', options: ['Se corta y empiezan los lances', 'Solo él no cambia cartas', 'Se vuelve a repartir', 'Pierde un tanto'], answer: 0, explain: 'Basta con que uno corte: nadie cambia cartas y empieza la grande.' },
  { id: 'todosmus', q: '¿Cuándo se descartan los jugadores?', options: ['Cuando los cuatro dicen mus', 'Cuando lo pide la mano', 'Siempre una vez', 'Cuando lo dice el postre'], answer: 0, explain: 'Solo si los cuatro piden mus.' },
  { id: 'cuantasdescartes', q: '¿Cuántas cartas puedes descartar?', options: ['De 1 a 4', 'Exactamente 2', 'Solo 1', 'Hasta 3'], answer: 0, explain: 'Puedes tirar de una a cuatro cartas, y recibes otras tantas.' },
  { id: 'mazovacio', q: 'Si se acaba el mazo durante los descartes…', options: ['Se barajan los descartes y se sigue', 'Se corta el mus', 'Se reparte de nuevo', 'Pierde quien no tenga cartas'], answer: 0, explain: 'Se recogen los descartes, se barajan y se sigue repartiendo de ellos.' },
  // Unidades 4-5
  { id: 'grandeque', q: 'A la grande, ¿quién gana?', options: ['Las cartas más altas', 'Las más bajas', 'La suma más alta', 'Quien tenga pares'], answer: 0, explain: 'A la grande ganan las cartas más altas: se compara la mejor de cada uno; si empatan, la segunda…' },
  { id: 'chicaque', q: 'A la chica, ¿quién gana?', options: ['Las cartas más bajas', 'Las más altas', 'La suma más baja de todas', 'Quien tenga el as de oros'], answer: 0, explain: 'A la chica ganan las cartas más bajas, comparando de una en una empezando por la más baja.' },
  { id: 'mejorgrande', q: '¿Cuál es la mejor mano posible a la grande (8 reyes)?', options: ['Cuatro reyes (o treses)', 'Rey, caballo, sota y siete', 'Cuatro sietes', 'La 31'], answer: 0, explain: 'R R R R: nadie puede tener nada más alto.', cards: parseHand('R 3 R 3') },
  { id: 'mejorchica', q: '¿Cuál es la mejor mano posible a la chica (8 reyes)?', options: ['Cuatro ases (o doses)', 'As, dos, tres y cuatro', 'Cuatro cuatros', 'As, cuatro, cinco y seis'], answer: 0, explain: 'A 8 reyes los doses son ases: A A A A es lo más bajo.', cards: parseHand('A 2 A 2') },
  { id: 'grandepaso', q: 'Si todos pasan a la grande, ¿qué ocurre?', options: ['La mejor grande cobra 1 tanto al final', 'Nadie cobra nada', 'Se repite el lance', 'La mano cobra 2'], answer: 0, explain: 'La grande "en paso" vale 1 tanto para quien la gane, que se cobra en el recuento.' },
  // Unidad 6 pares
  { id: 'paresorden', q: '¿Cuál es el orden de las jugadas de pares, de mejor a peor?', options: ['Duples, medias, pareja', 'Medias, duples, pareja', 'Pareja, medias, duples', 'Duples, pareja, medias'], answer: 0, explain: 'Duples (dos parejas o cuatro iguales) > medias (tres iguales) > pareja (dos iguales).' },
  { id: 'paresvalor', q: '¿Cuánto valen pareja, medias y duples en el recuento?', options: ['1, 2 y 3', '2, 3 y 4', '1, 3 y 5', '1, 1 y 2'], answer: 0, explain: 'Pareja 1, medias 2 y duples 3 tantos por jugador.' },
  { id: 'paresdeclarar', q: 'Antes de jugar los pares, cada jugador…', options: ['Dice si tiene pares (sí o no)', 'Enseña sus cartas', 'Descarta una carta', 'Hace una seña'], answer: 0, explain: 'Desde la mano, cada uno declara "pares sí" o "pares no", siempre con la verdad.' },
  { id: 'paresvoz', q: '¿Quién puede envidar a los pares?', options: ['Solo quienes tienen pares', 'Todos', 'Solo la mano', 'Solo quien tenga duples'], answer: 0, explain: 'En pares (y en juego) solo hablan los que tienen la jugada.' },
  { id: 'paresuna', q: 'Si solo una pareja tiene pares, ¿qué pasa?', options: ['No hay envites: cobran sus pares al final', 'Se juega igual', 'Nadie cobra', 'Cobran el doble'], answer: 0, explain: 'No tiene sentido apostar: esa pareja cobra el valor de sus jugadas en el recuento.' },
  { id: 'cuatroreyes', q: 'R R R R contra R R C C a los pares, ¿quién gana?', options: ['R R R R', 'R R C C', 'Empatan y gana la mano', 'Ninguno, son medias'], answer: 0, explain: 'Cuatro iguales son duples "de reyes y reyes": empatan la pareja alta y la segunda pareja (reyes) gana a caballos.' },
  { id: 'cobrancompanero', q: 'Ganas los pares con pareja y tu compañero tiene medias. ¿Qué cobráis?', options: ['3 tantos (1 + 2), más lo envidado', 'Solo tu tanto', 'Solo las medias', 'Nada, gana quien tenga las mejores'], answer: 0, explain: 'La pareja ganadora cobra las jugadas de los dos compañeros.' },
  // Unidad 7 juego
  { id: 'juegocuanto', q: '¿Con cuántos puntos se tiene juego?', options: ['31 o más', '30 o más', 'Exactamente 31', '40'], answer: 0, explain: 'Hay juego cuando las cuatro cartas suman 31 o más (máximo 40).' },
  { id: 'juegoorden', q: '¿Cuál es el orden de los juegos, de mejor a peor?', options: ['31, 32, 40, 37, 36, 35, 34, 33', '40, 37, 36, 35, 34, 33, 32, 31', '31, 32, 33, 34, 35, 36, 37, 40', '31, 40, 32, 33, 34, 35, 36, 37'], answer: 0, explain: 'La 31 es la mejor, luego 32 y luego 40; después de 37 hacia abajo hasta 33.' },
  { id: 'juego38', q: '¿Por qué no aparecen el 38 ni el 39 en el orden de juegos?', options: ['Porque son imposibles con cuatro cartas', 'Porque valen como 40', 'Porque son la real', 'Porque pierden siempre'], answer: 0, explain: 'Con 3 figuras (30) la cuarta carta es 1-7 o 10: 31-37 o 40. Nunca 38 ni 39.' },
  { id: 'juegovalor', q: '¿Cuánto vale el juego en el recuento?', options: ['La 31, 3 tantos; los demás, 2', 'Todos 2', 'Todos 3', 'Lo que sume / 10'], answer: 0, explain: 'La 31 vale 3 tantos; cualquier otro juego, 2 (por jugador de la pareja ganadora).' },
  { id: 'puntocuando', q: '¿Cuándo se juega al punto?', options: ['Cuando nadie de los cuatro tiene juego', 'Cuando la mano no tiene juego', 'Siempre después del juego', 'Cuando hay empate'], answer: 0, explain: 'Si nadie tiene juego, el último lance es el punto: gana la suma más alta.' },
  { id: 'puntovale', q: '¿Cuánto vale el punto si se pasa?', options: ['1 tanto', '2 tantos', '3 tantos', 'Nada'], answer: 0, explain: 'El punto vale 1 tanto en paso (y si se envida y se quiere, lo envidado más 1).' },
  { id: 'real31', q: '¿Qué es la 31 real?', options: ['Tres sietes y una figura', 'Cuatro reyes', 'Rey, caballo, sota y as', 'Cualquier 31 de la mano'], answer: 0, explain: 'La real es 7-7-7 + figura. Donde se juega, gana a cualquier otra 31. En la app es opcional (Ajustes).', cards: parseHand('7o 7c 7e Sb') },
  // Unidad 8 empates
  { id: 'empate', q: 'Dos jugadores tienen exactamente lo mismo. ¿Quién gana?', options: ['El más cercano a la mano', 'Se reparte', 'El que hable antes de envidar', 'El postre'], answer: 0, explain: 'En el mus no hay empates: gana la mano o el que esté más cerca de ella (a su derecha).' },
  { id: 'empateorden', q: 'Si la mano no juega el lance, ¿quién gana los empates?', options: ['El siguiente a la derecha de la mano', 'El postre', 'Nadie', 'El de la izquierda de la mano'], answer: 0, explain: 'Se mira el orden de juego desde la mano: el primero que aparezca gana el empate.' },
  // Unidad 9 envites
  { id: 'envidocuanto', q: '¿Cuántos tantos son un "envido"?', options: ['2', '1', '5', '4'], answer: 0, explain: 'Envidar es apostar 2 tantos (el mínimo). Se puede envidar más: "envido cinco".' },
  { id: 'paso', q: '¿Qué significa "paso"?', options: ['No envido (por ahora)', 'Me retiro de la mano', 'Quiero el envite', 'Pido mus'], answer: 0, explain: 'Pasar es no envidar; si después alguien envida, podrás responder.' },
  { id: 'quiero', q: 'Si quieres un envite, ¿cuándo se sabe quién lo gana?', options: ['Al final de la mano, enseñando las cartas', 'En ese momento', 'Al final de la partida', 'Nunca'], answer: 0, explain: 'Los envites queridos se resuelven en el recuento, al final de la mano.' },
  { id: 'noquiero', q: 'Envidas 2 y los rivales no quieren. ¿Qué cobras?', options: ['1 tanto, en el momento', '2 tantos al final', 'Nada', '3 tantos'], answer: 0, explain: 'Al no querer el primer envite, cobras 1 tanto (el deje) en el acto.' },
  { id: 'noquierosubida', q: 'Envidas 2, el rival dice "cinco más" y no lo quieres. ¿Qué cobran?', options: ['2 tantos', '7 tantos', '5 tantos', '1 tanto'], answer: 0, explain: 'Al rechazar una subida se cobra lo que estaba envidado antes: tus 2.' },
  { id: 'bastauno', q: 'Un rival dice "no quiero" y su compañero "quiero". ¿Qué pasa?', options: ['El envite queda querido', 'No se quiere', 'Se repite', 'Decide la mano'], answer: 0, explain: 'Basta con que uno de la pareja quiera.' },
  { id: 'enpasopares', q: 'Si todos pasan a los pares, ¿qué se cobra?', options: ['El ganador cobra sus jugadas (pareja 1, medias 2, duples 3)', 'Nada', '1 tanto', '2 tantos'], answer: 0, explain: 'En pares y juego en paso se cobran solo las jugadas de la pareja ganadora.' },
  { id: 'noquieropares', q: 'Envidas a pares, no te quieren y el rival tenía mejores pares. ¿Qué cobras al final?', options: ['El deje y tus pares', 'Solo el deje', 'Nada', 'El rival cobra sus pares'], answer: 0, explain: 'Si no te quieren, el lance es tuyo: cobras el deje en el momento y el valor de tus pares (y los de tu compañero) al final.' },
  // Unidad 10 órdago
  { id: 'ordago', q: '¿Qué es un órdago?', options: ['Un envite de toda la partida', 'Un envite de 10 tantos', 'Pedir mus dos veces', 'Una seña'], answer: 0, explain: 'Órdago (del euskera "hor dago", "ahí está") es apostar el juego entero.' },
  { id: 'ordagoquerido', q: 'Si un órdago se quiere…', options: ['Se enseñan las cartas y quien gana ese lance gana el juego', 'Se juega el resto de la mano y se ve', 'Se cobran 40 tantos', 'Gana quien va por delante'], answer: 0, explain: 'Se ven las cartas en el acto y el ganador del lance gana el juego.' },
  { id: 'ordagonoquerido', q: 'Echas un órdago como primer envite y no te lo quieren. ¿Qué cobras?', options: ['1 tanto', '40 tantos', 'Nada', '2 tantos'], answer: 0, explain: 'Un órdago no querido es como cualquier envite rechazado: 1 tanto si era el primero.' },
  { id: 'ordagosubir', q: '¿Se puede subir un órdago?', options: ['No: solo se quiere o no se quiere', 'Sí, con dos órdagos', 'Sí, cinco más', 'Solo la mano'], answer: 0, explain: 'Más que todo no se puede apostar.' },
  // Unidad 11 puntuación
  { id: 'amarraco', q: '¿Cuántos tantos es un amarraco?', options: ['5', '10', '2', '8'], answer: 0, explain: 'Un amarraco son 5 tantos (o piedras). 8 amarracos = 40.' },
  { id: 'juego40', q: '¿Cuántos tantos hacen falta para ganar un juego (regla de la casa)?', options: ['40', '30', '50', '21'], answer: 0, explain: 'Lo habitual en Euskadi es a 40 (en Ajustes puedes jugar a 30).' },
  { id: 'dejecuando', q: '¿Cuándo se apuntan los tantos de un envite no querido?', options: ['En el momento', 'Al final de la mano', 'Al final del juego', 'Nunca'], answer: 0, explain: 'El deje se cobra en el acto; lo demás, en el recuento.' },
  { id: 'recuentoorden', q: '¿En qué orden se cuentan los tantos al final de la mano?', options: ['Grande, chica, pares, juego', 'Juego, pares, chica, grande', 'Primero los envites', 'Como quiera la mano'], answer: 0, explain: 'Se cuenta en el orden de los lances, y el primero en llegar a 40 gana.' },
  { id: 'vaca', q: '¿Qué es una vaca?', options: ['Un conjunto de juegos (p. ej. al mejor de 3)', 'Un envite de 5', 'Una mala mano', 'Una seña'], answer: 0, explain: 'La vaca reúne varios juegos; gana la vaca quien gana más juegos.' },
  // Unidad 13 señas
  { id: 'senacuando', q: '¿Cuándo se pueden hacer señas (regla de la casa)?', options: ['Después de cortar el mus', 'Antes de repartir', 'Solo en el recuento', 'Nunca'], answer: 0, explain: 'Las señas se pasan una vez cortado el mus, con disimulo.' },
  { id: 'senafalsa', q: '¿Se puede hacer una seña falsa a tu compañero?', options: ['No, está prohibido', 'Sí, es un farol', 'Solo al rival', 'Solo en la chica'], answer: 0, explain: 'Las señas deben decir la verdad y ser completas (nada de señas parciales).' },
  { id: 'senarival', q: 'Si ves la seña de un rival…', options: ['Es legal aprovecharla', 'Debes avisar al árbitro', 'Se repite la mano', 'Pierde un tanto'], answer: 0, explain: 'Pillar señas es parte del juego: por eso hay que hacerlas con disimulo.' },
  { id: 'senaparcial', q: 'Llevas duples de reyes y ases. ¿Qué seña haces?', options: ['Duples (levantar las cejas)', 'Dos reyes', 'Dos ases', 'Ninguna'], answer: 0, explain: 'No se hacen señas parciales: con duples se hace la seña de duples.' },
  // Unidad 14 estrategia
  { id: 'cortar31', q: 'Eres mano y tienes la 31. ¿Qué sueles hacer?', options: ['Cortar el mus', 'Pedir mus para mejorar', 'Tirar la 31', 'Envidar en el mus'], answer: 0, explain: 'La 31 de mano es casi imbatible al juego: no la arriesgues, corta.' },
  { id: 'cortarduples', q: 'Tienes duples. ¿Pides mus?', options: ['No, se corta', 'Sí, siempre', 'Solo si eres postre', 'Depende del palo'], answer: 0, explain: 'Los duples son la mejor jugada de pares: corta y a cobrar.' },
  { id: 'faroles', q: '¿Qué es un farol?', options: ['Envidar sin cartas para que no te quieran', 'Una seña', 'Un tipo de pares', 'Cortar sin mirar'], answer: 0, explain: 'Un farol bien elegido gana el deje; si te lo quieren, lo pierdes.' },
  { id: 'posicion', q: '¿Por qué ser mano ayuda tanto en pares y juego?', options: ['Porque gana los empates', 'Porque cobra doble', 'Porque habla el último', 'No ayuda'], answer: 0, explain: 'Con la misma jugada que un rival, la mano gana. Por eso una 31 de mano es tan fuerte.' },
  { id: 'postrefarol', q: '¿Qué posición es buena para un farol a la grande?', options: ['Ser postre y que todos hayan pasado', 'Ser mano', 'Cuando el rival ha envidado', 'Ninguna'], answer: 0, explain: 'Si los tres han pasado, nadie ha mostrado fuerza: un envite del postre puede llevarse el deje.' },
  // Unidad 16 4 reyes
  { id: '4r_tres', q: 'A 4 reyes, ¿cuánto vale un tres para el juego?', options: ['3', '10', '1', '12'], answer: 0, explain: 'A 4 reyes el tres es un tres normal.' },
  { id: '4r_dos', q: 'A 4 reyes, ¿cuál es la carta más baja a la chica?', options: ['El as', 'El dos', 'El tres', 'El cuatro'], answer: 0, explain: 'As < dos < tres < cuatro…: el dos ya no es as.' },
  { id: '4r_grande', q: 'A 4 reyes, ¿qué gana a la grande: 3-3-3-3 o 4-A-A-A?', options: ['4-A-A-A', '3-3-3-3', 'Empatan', 'Depende del palo'], answer: 0, explain: 'A 4 reyes el 4 es más alto que el 3.' },
  { id: '4r_cuantos', q: 'A 4 reyes, ¿cuántos reyes hay en la baraja?', options: ['4', '8', '12', '6'], answer: 0, explain: 'Solo los cuatro reyes: los treses son treses.' },
];
