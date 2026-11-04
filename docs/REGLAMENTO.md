# Reglamento del mus que usa la app

> Documento de referencia de **Mus Eskola**. Todo el contenido de las lecciones, el motor (`src/engine`) y los bots sigue este texto.
> Cuando las fuentes discrepan se elige la opción más extendida en Euskadi y se marca como **🏠 regla de la casa**, explicando las alternativas.
> Las referencias entre corchetes [n] remiten a la lista de fuentes del final. Cada regla se ha contrastado al menos con tres fuentes.

---

## 1. Material, jugadores y sitio

- **Baraja española de 40 cartas** (sin ochos, nueves ni comodines): cuatro palos —oros, copas, espadas y bastos— con as (1), 2, 3, 4, 5, 6, 7, sota (10), caballo (11) y rey (12) [1][2][3][5].
- **Cuatro jugadores en dos parejas.** Los compañeros se sientan **enfrente** el uno del otro [1][2][4].
- **Sentido de juego: hacia la derecha** (contrario a las agujas del reloj). Se reparte, se habla y se descarta en ese sentido [1][2][6].
- **La mano** es el jugador sentado a la derecha del que reparte; habla siempre el primero y gana todos los empates. **El postre** es el que reparte, el último en hablar [1][2][4].
- Al terminar cada mano (cada reparto), **la mano pasa al jugador de la derecha**, que se convierte en la nueva mano [1][2].
- **Reparto:** el postre baraja, ofrece cortar al jugador de su izquierda y reparte **cuatro cartas a cada jugador, de una en una**, empezando por la mano [1][2][6].

En la app: tú te sientas abajo (asiento 0); a tu derecha el rival 1; enfrente tu compañero (asiento 2); a tu izquierda el rival 3. El orden de juego es 0 → 1 → 2 → 3.

## 2. Variantes: 8 reyes (base) y 4 reyes

| | **Mus a 8 reyes** (🏠 base de la app) | **Mus a 4 reyes** |
|---|---|---|
| Treses | Valen como **reyes** (en todo: grande, chica, pares y juego = 10) | Son treses (valen 3) |
| Doses | Valen como **ases** (en todo, juego = 1) | Son doses (valen 2) |
| Reyes en la baraja | 8 (4 reyes + 4 treses) | 4 |
| Ases ("pitos") | 8 (4 ases + 4 doses) | 4 |
| Orden en grande | R=3 > C > S > 7 > 6 > 5 > 4 > A=2 | R > C > S > 7 > 6 > 5 > 4 > 3 > 2 > A |

Fuentes: [1][2][3][7][8]. El mus a 8 reyes es el habitual en Euskadi y en casi toda España; el reglamento de Bizkaia y el de Txapeldunes fijan **8 reyes y 8 ases** [7][8]. El de 4 reyes se juega en algunas zonas (p. ej. reglamento navarro "4R4A") [9]. La variante se elige en **Ajustes** y cambia todo el motor.

Con 8 reyes un "rey" es cualquier rey o tres, y un "as" cualquier as o dos: un 3 y un rey forman **pareja de reyes**; un 2 y un as forman **pareja de ases (pitos)**.

## 3. Fase de mus

1. Repartidas las cartas, **la mano** habla primero: dice **"mus"** (quiere cambiar cartas) o **"no hay mus"** (corta) [1][2][4].
2. Si **los cuatro** dicen "mus", cada jugador se **descarta** de entre 1 y 4 cartas y el postre le da otras tantas del mazo, empezando por la mano [1][4][6]. 🏠 En la app el descarte mínimo es de **una carta** (pedir mus es pedir descarte [10]).
3. Se repite la ronda de mus tantas veces como quieran los cuatro.
4. En cuanto **un solo jugador** dice "no hay mus", se corta y empiezan los lances. Nadie más cambia cartas [1][2][4].
5. Si el mazo se agota, **se barajan los descartes** y se sigue repartiendo de ellos [4][6]. 🏠 En la app, los descartes de la ronda en curso se apartan y solo se usan si no basta con los anteriores.
6. **Mus corrido:** en algunas mesas la primera ronda de mus de la partida se juega sin señas [6][8]. En la app las señas solo se hacen **después de cortar el mus** (ver §10).

## 4. Los lances, en orden

Cada mano se juega en cuatro lances y **siempre en este orden** [1][2][3][4]:

1. **Grande** (euskera *handia*)
2. **Chica** (*txikia*)
3. **Pares** (*pareak*)
4. **Juego** (*jokoa*) — o **Punto** (*puntua*) si nadie en la mesa tiene juego.

En cada lance se habla empezando por la mano y siguiendo hacia la derecha. **Los empates siempre los gana el jugador más cercano a la mano** (la mano, luego el siguiente a su derecha…) [1][3][11][12]. En el mus no hay empates.

### 4.1 Grande
Gana quien tenga **las cartas más altas**. Se compara la carta más alta de cada mano; si coincide, la segunda; y así hasta la cuarta. El palo no importa [1][2][3].
- 8 reyes: R = 3 > C > S > 7 > 6 > 5 > 4 > A = 2.
- Ejemplo: R-R-C-5 gana a R-R-S-7 (tercera carta: caballo > sota).

### 4.2 Chica
Gana quien tenga **las cartas más bajas**. Se compara la carta más baja de cada mano; si coincide, la siguiente más baja, etc. [1][2][3].
- 8 reyes: A = 2 < 4 < 5 < 6 < 7 < S < C < R = 3.
- Ejemplo: A-A-4-7 gana a A-A-5-6 (tercera carta: 4 < 5).

### 4.3 Pares
Antes del lance cada jugador, desde la mano, **declara si tiene pares ("sí" / "no")**, y debe decir la verdad [1][4][13]. Tipos, de peor a mejor [1][2][3][12]:

| Jugada | Qué es | Vale (tantos por jugador) |
|---|---|---|
| **Pareja** | Dos cartas iguales | 1 |
| **Medias** | Tres cartas iguales | 2 |
| **Duples** | Dos parejas, o cuatro cartas iguales | 3 |

Comparación:
- Duples > medias > pareja, sin importar el valor de las cartas [11][12].
- Entre jugadas del mismo tipo gana la de **cartas más altas** (orden de la grande): pareja de reyes > pareja de caballos > … > pareja de ases [11][12].
- **Duples:** se compara primero la pareja más alta y, si coincide, la segunda. **Cuatro cartas iguales cuentan como dos parejas iguales**: R-R-R-R son "duples de reyes" y ganan a R-R-C-C [12].
- Si todo coincide, gana el más cercano a la mano.
- "Iguales" se mide con la variante: con 8 reyes, 3 y rey son iguales, y 2 y as también.

### 4.4 Juego
Valor de las cartas para el juego [1][2][3][5]:

| Carta | 8 reyes | 4 reyes |
|---|---|---|
| Rey, caballo, sota | 10 | 10 |
| Tres | **10** (es rey) | 3 |
| 7, 6, 5, 4 | su número | su número |
| Dos | **1** (es as) | 2 |
| As | 1 | 1 |

- Se **tiene juego** cuando las cuatro cartas suman **31 o más** (máximo 40) [1][2][3].
- **Orden de los juegos** (de mejor a peor): **31, 32, 40, 37, 36, 35, 34, 33** [1][3][14][15]. (Alguna fuente cita 31, 32, 40, 39, 38… pero 38 y 39 son imposibles con cuatro cartas.)
- A igual juego, gana el más cercano a la mano ("31 de mano") [7][8].
- Valor: **31 = 3 tantos; cualquier otro juego = 2 tantos** por jugador [3][12][16].
- Antes del lance cada jugador declara **"juego sí / no"**.

**La 31 real** [14][15][17][8]:
- Es la 31 formada por **tres sietes y una figura** (7-7-7 + sota, caballo o rey; con 8 reyes también un tres).
- Donde se juega, la real **gana a cualquier otra 31, aunque sea de mano** (entre dos reales, gana la más cercana a la mano). Vale lo mismo que una 31 (3 tantos).
- 🏠 **Regla de la casa: desactivada por defecto.** Las normas de Bizkaia/Txapeldunes dicen "ganan las 31 de mano" y ASESMUS indica expresamente que no vale la real [7][8]; Fournier tampoco la reconoce, y el reglamento de las Comunidades Vascas a 4 reyes sí [14]. Se puede activar en Ajustes. Alguna mesa la define "con cualquier sota" [13]; la app usa la definición más común (tres sietes + figura).

### 4.5 Punto
Solo se juega si **nadie de los cuatro tiene juego** [1][2][3]. Gana la suma **más alta** (máximo 30); empate, la mano. El punto vale **1 tanto** para la pareja ganadora [3][12].

## 5. Quién juega cada lance

- **Grande, chica y punto**: hablan los cuatro.
- **Pares y juego**: solo hablan **los jugadores que tienen la jugada** [1][4][18].
  - Si **nadie** tiene pares, el lance no se juega.
  - Si **solo una pareja** tiene pares (o juego), **no hay envites**: esa pareja cobra el valor de sus jugadas en el recuento [18][19][20].
  - Si las dos parejas tienen, se envida entre los que tienen.

## 6. Envites

Vocabulario [1][4][16][21]:
- **Paso**: no envido (o "me achico" a ver qué hacen los demás).
- **Envido**: apuesto **2 tantos** (envite mínimo). También se puede envidar más: "envido cinco".
- **Envidar más / reenvidar** ("dos más", "cinco más"): subir lo envidado.
- **Quiero**: acepto; el lance se resolverá al final de la mano enseñando las cartas.
- **No quiero**: rechazo; la pareja que hizo el último envite gana el lance y cobra **en el momento** el *deje*.
- **Órdago** (*hordago*): envite de **toda la partida** (de todo el juego). Si se quiere, se enseñan las cartas en el acto y **quien gana ese lance gana el juego** [1][3][16].

Desarrollo de un lance:
1. Desde la mano, cada jugador (que pueda hablar) pasa o envida.
2. Si **todos pasan**, el lance queda **en paso**.
3. Si alguien envida, responde la pareja rival: **quiero, no quiero, envidar más u órdago**.
4. Basta con que **uno de los dos** compañeros quiera para que el envite quede aceptado (prevalece el "quiero" sobre el "no quiero") [19][20]. Para rechazarlo deben no querer los dos (los que tienen voz en ese lance).
5. Si responden envidando más, vuelve a contestar la otra pareja, y así sucesivamente.

### Qué se cobra en cada caso

| Situación | Grande / Chica | Pares / Juego | Punto |
|---|---|---|---|
| **En paso** (nadie envida) | 1 tanto al ganador (al final) | El ganador cobra sus jugadas | 1 tanto al ganador |
| **Envite querido** | Lo envidado (al final) | Lo envidado + sus jugadas | Lo envidado + 1 |
| **No querido** | Deje (en el momento) | Deje + sus jugadas (al final) | Deje (+ 1 al final) |
| **Órdago querido** | Gana el juego entero | Gana el juego entero | Gana el juego entero |

- **Deje** ("el no"): **1 tanto** si se rechaza el primer envite; si se rechaza un reenvite, se cobra **lo que estaba envidado antes** del último envite [4][16][21]. Ej.: A envida 2, B "cinco más" (total 7), A no quiere → B cobra 2.
- Cuando se rechaza un envite de pares o juego, la pareja que envidó **gana el lance** y en el recuento cobra el valor de **sus** jugadas (las de los dos compañeros) [16][19].
- 🏠 En punto rechazado, la pareja que envidó gana el lance: cobra el deje en el momento y el tanto del punto al final.
- "Sus jugadas" son las de **los dos jugadores de la pareja ganadora**: si tú tienes medias (2) y tu compañero pareja (1), cobráis 3 más lo envidado.

## 7. Recuento y puntuación

- **Tanto = piedra**: la unidad. **Amarraco = 5 tantos** [1][22][23].
- 🏠 **Juego a 40 tantos** (8 amarracos), lo más habitual en Euskadi [7][8][22]; en Ajustes se puede jugar **a 30**.
- **Los dejes se apuntan en el momento** [4][21]. El resto se cuenta al final de la mano, levantando las cartas, **en el orden de los lances**: grande, chica, pares, juego/punto [4][22][24].
- **Gana el juego la primera pareja que llega a 40**, contando en ese orden; si con el recuento llegan las dos, gana la que llegue antes (por eso la grande "se cuenta primero") [22][24]. Si un deje te da los 40, ganas en el acto.
- **Órdago querido**: gana el juego la pareja que gana ese lance, se lleve como se lleve el marcador [3][16].
- **Vaca**: conjunto de juegos. Según la zona, a 3, 5, 7 o 9 juegos [22][23][25]. 🏠 En la app se eligen los juegos necesarios para ganar la vaca: **1** (partida rápida, por defecto), **2** (al mejor de 3) o **3** (al mejor de 5). **Partida**: conjunto de vacas que se pacte.

## 8. Ejemplo de mano completa

Mano: tú (0). Cartas: tú R-R-C-7, rival 1 A-A-4-5, compañero 2 R-S-S-6, rival 3 C-C-7-4.
1. Mus: tú dices "no hay mus" → se corta.
2. Grande: tú envidas 2; rival 1 no quiere; rival 3 no quiere → cobráis **1** (deje) en el momento.
3. Chica: todos pasan → en paso, 1 tanto para la mejor chica: rival 1 (A-A-4-5).
4. Pares: tú sí (reyes), 1 sí (ases), 2 sí (sotas), 3 sí (caballos). Se envida y se quiere 2. Mejor pareja: la tuya (reyes) → cobráis 2 (envite) + 1 (tu pareja) + 1 (pareja de sotas de tu compañero) = **4**.
5. Juego: tú 37 (R+R+C+7 = 10+10+10+7), 1: 11, 2: 36, 3: 31 → tienen juego tú, tu compañero y el rival 3. Rival 3 tiene 31, la mejor: si todo pasa, cobran **3**.
Recuento: grande deje (ya apuntado) 1 vosotros; chica 1 ellos; pares 4 vosotros; juego 3 ellos.

## 9. Faltas y verdad

- Hay que **declarar la verdad** al decir "pares" o "juego"; si al enseñar las cartas no se tiene lo declarado, la pareja es sancionada (en torneo, pierde el juego) [13]. La app no permite declarar en falso.
- Hay que enseñar las cartas al final para cobrar las jugadas.

## 10. Señas

Las señas son gestos para avisar al compañero de las cartas que llevas. **Son parte del juego**: el rival puede verlas, y por eso se hacen con disimulo [6][26][27][28].

### Normas de uso 🏠
- Solo se hacen **después de cortar el mus** [8].
- Solo se permiten las señas **reglamentadas** [26]; no vale hablar ni hacer gestos inventados.
- No se pueden hacer **señas falsas** (de algo que no tienes) ni **parciales**: si llevas duples de reyes y ases, haz la seña de duples [26][29].
- Se hace la seña de la **mejor jugada** que tengas; no se pasa "ciego" si llevas algo que tenga seña [29].

### Lista de señas 🏠 (contrastada; se indica alternativa cuando hay discrepancia)

| Jugada | Gesto | Alternativas |
|---|---|---|
| **Dos reyes** | Morderse el **labio inferior** (por el centro) [26][27][28] | — |
| **Tres reyes** (medias de reyes) | Morder el labio inferior **por un lado** [27][30] | Torcer los labios hacia un lado |
| **Dos ases / pitos** | Sacar la **punta de la lengua** de frente [26][27][28] | Arrugar la nariz [28][31] |
| **Tres ases** (medias de ases) | Sacar la lengua **por un lado** de la boca [27][30] | — |
| **Medias** (otras) | **Torcer la boca** cerrada hacia un lado [26][27] | — |
| **Duples** | **Levantar las cejas** [27][28][31] | Mover los labios cerrados a ambos lados [9] |
| **31** | **Guiñar un ojo** [27][28] | — |
| **Ciego** (no llevo nada) | **Cerrar los dos ojos** a la vez [28] | — |
| **Solomillo** (tres reyes y un as: medias de reyes + 31) | Un **beso** sin ruido [30] | Seña doble: no se usa en torneos |

## 11. Vocabulario

El glosario completo (castellano y euskera) está en la app (Consultar → Glosario) y en `src/content/glossary.ts`. Términos vascos principales [10][32][33][34]:
- **Mus**: pedir descarte (*mus egin*, darse mus) [10].
- **Hordago / órdago**: de *hor dago*, "ahí está" [10][33][34].
- **Handia, txikia, pareak, jokoa, puntua**: grande, chica, pares, juego, punto [32][35].
- **Bai / ez**: sí / no (al declarar pares o juego) [32].
- **Iduki / euki / eutsi**: "mantener, aguantar" → **quiero** [10][32].
- **Inbido**: envido [10].
- **Esku**: mano [32].
- **Hamarreko → amarraco** (origen probable, discutido) [36].

---

## Reglas de la casa (resumen)

1. Mus a **8 reyes** (configurable a 4).
2. Juego a **40** (configurable a 30). Vaca de **1** juego por defecto (configurable a 2 o 3 juegos ganados).
3. **31 real desactivada** por defecto (configurable).
4. Envite mínimo **2**; deje **1** o lo envidado antes.
5. Basta un **"quiero"** de la pareja para aceptar.
6. **Descarte mínimo 1** carta; los descartes se rebarajan si se acaba el mazo.
7. **Punto**: 1 tanto (en paso o como premio sobre lo envidado).
8. Señas solo tras cortar el mus; lista de §10.

## Fuentes

1. Wikipedia, "Mus" / "Mus (card game)" (consultado vía buscador): https://en.wikipedia.org/wiki/Mus_(card_game)
2. Ludoteka, "Mus a 8 reyes – Reglas del juego": https://www.ludoteka.com/clasika/mus.html
3. Ludoteka, "Reglas del mus": https://www.ludoteka.com/games/mus/rules
4. Mus2000, "Reglamento del mus": https://www.mus2000.com/ayuda_mus.htm
5. Heraclio Fournier, "Cómo jugar al mus": https://www.nhfournier.es/en/como-jugar/mus/
6. Ludoteka / El Español, "Cómo jugar al mus: reglas y señas": https://www.elespanol.com/como/jugar-mus-reglas-senas/424958271_0.html
7. ASESMUS, "Normas generales para el juego de mus en Bizkaia": https://www.asesmus.com/wp-content/uploads/2022/06/RegMusBIZKAIA.pdf (y copia en http://elmusesmas.blogspot.com/p/normas-generales-de-mus.html)
8. ASESMUS, "Reglamento de juego v2.03" y "Normas Txapeldunes 2018": https://www.asesmus.com/wp-content/uploads/2023/03/Reglamento-Asesmus-2_03.pdf · https://www.asesmus.com/wp-content/uploads/2023/05/RegMusTxapeldunes.pdf
9. Asociación Navarra de Mus, "Reglamento de juego 4R4A": https://musnavarra.com/reglamento/reglamento-de-juego/
10. Euskaltzaindia, Orotariko Euskal Hiztegia (OEH), entradas *mus* y *hordago*: https://www.euskaltzaindia.eus/
11. Tomasito's Space, "Mus – reglas españolas": http://www.tomasito-space.de/mus/musreglas-esp.html
12. Las40, "Normas del mus": https://mus.las40.es/rules/
13. Bases de torneos (UPCT 2024, RS Tenis 2023-24, Colmenar Viejo): https://paellas.upct.es/wp-content/uploads/2024/04/Bases_mus__a13cim2024_firmado.pdf · https://rstenis.com/wp-content/uploads/2023/07/Normativa-Mus-torneo-Verano-Tenis.pdf
14. Bandomóvil, "Reglas del mus" (Fournier vs Comunidades Vascas): https://bandomovil.com/userFiles/52/52BzfReglasMus.pdf
15. Laps4, "¿Qué es la 31 real en el mus?": https://www.laps4.com/preguntas-y-respuestas/que-es-la-31-real-en-el-mus
16. Magnojuegos, "Reglas del mus": https://www.magnojuegos.com/mus-online/reglas
17. Reglamento Campeonato Virgen de los Remedios (Colmenar Viejo): https://colmenarviejo.com/images/concejalias/deportes/Reglamento_Campeonato_Virgen_de_los_Remedios.pdf
18. Abrazo de escorpión, "Reglas del mus": https://sites.google.com/site/abrazodeescorpion/reglas-del-mus
19. Ordago.club, "Envites en el mus": https://www.ordago.club/mus/envites-del-mus
20. CCCJ / Juegon, "Reglas generales del mus": https://www.cccj.es/reglaments/mus.htm
21. Torneos de Mus, "Cómo jugar al mus": https://torneosdemus.com/como-jugar-al-mus
22. Casino.es, "El tanteo en el mus – piedras y amarracos": https://www.casino.es/mus/tanteo/
23. Retos.com, "Reglas de mus": https://www.retos.com/juego/reglas?id=9
24. Usujuegos, "Cómo se juega al mus": https://www.usujuegos.com/juego_usumus1.aspx
25. Elegir juego de mesa, "Mus": https://www.elegirjuegodemesa.com/mus/
26. La Federación de Mus, "Reglamento de juego v7 (2025)": https://lafederaciondemus.es/wp-content/uploads/2026/02/Reglamento-de-Juego-Federacion.pdf
27. Don Naipe, "Te enseñamos las señas del mus": https://donnaipe.com/blog/2019/11/19/te-ensenamos-las-reglas-del-mus/
28. Hablando de Póker, "Señas en el mus": https://www.hablandodepoker.com/otros-juegos/juegos-de-baraja-espanola/senas-en-el-mus/
29. Reglas campeonato "Los de Bronce" 2018: http://www.losdebronce.com/docs/agenda/e28_REGLAS_CAMPEONATO_DE_MUS_-LOS_DE_BRONCE-_2018.pdf
30. Casas de apuestas, "Señas mus": https://www.casasdeapuestas.com/blog/senas-mus/
31. Mus Tembleque, "Señas permitidas": https://www.mustembleque.es/index.php?option=com_content&view=article&id=15&Itemid=149
32. Buber's Basque Page, "Mus": https://www.buber.net/Basque/Sports/mus.php
33. Diccionarios.com, "hordago": https://www.diccionarios.com/diccionario/euskera-castellano/hordago
34. Wikipedia, "List of Spanish words of Basque origin": https://en.wikipedia.org/wiki/List_of_Spanish_words_of_Basque_origin
35. Ontario (Oregon) Basque Club, "Learn mus": https://www.ontariobasqueclub.org/learn_mus.html
36. Onda Vasca, "Palabras que vienen del euskera": https://www.ondavasca.com/las-tres-palabras-que-usas-a-diario-y-no-sabias-que-vienen-del-euskera/

> Nota de método: el entorno de trabajo no permitía descargar páginas completas, así que las reglas se contrastaron mediante los extractos del buscador de las fuentes anteriores. Ver INFORME.md.
