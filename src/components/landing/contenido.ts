// Interruptores de contenido de la landing /evento (S1). Lo que no está aprobado no se publica.

/** "Las reglas del juego cambiaron": los cambios de 2027 los define Manu (DECISIONES.md D6). */
export const MOSTRAR_REGLAS_2027 = false;
/** Los cambios de 2027, cuando Manu los dé. Mientras la lista esté vacía, la sección no sale aunque el interruptor esté en true. */
export const REGLAS_2027: string[] = [];

/** Casos de Joaco, Fer y Axel: solo con su permiso escrito (DECISIONES.md D11). */
export const MOSTRAR_CASOS = false;

/** Precio que cobra el link fijo de Mercado Pago (D19). Si settings.price_ars tiene valor, manda ese. */
export const PRECIO_ARS_POR_DEFECTO = 42000;

export const formatoArs = (n: number) => `ARS ${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

/** Fotos reales de Manu, en /public/fotos/. charla: fondo de "Tenés mucho conocimiento"; quien: "¿Por qué yo?";
 *  clase: fondo del cierre (#reservar). En null, la sección sale sin foto. */
export type Foto = { src: string; alt: string; ancho: number; alto: number } | null;
export const FOTOS: { charla: Foto; clase: Foto; quien: Foto } = {
  charla: { src: "/fotos/manu-tent.jpg", alt: "Manu Casaubon como host en el escenario de tent. Creator Summit, frente al público", ancho: 1600, alto: 986 },
  clase: { src: "/fotos/manu-clase.jpg", alt: "Manu Casaubon de espaldas, dando una clase a un grupo sentado alrededor de una mesa", ancho: 1600, alto: 1002 },
  quien: { src: "/fotos/manu-escenario.jpg", alt: "Manu Casaubon dando una charla en un escenario, con micrófono y presentador en la mano", ancho: 1000, alto: 1500 },
};

/** Logos de marcas con las que trabajó Manu (tira que pasa debajo de los datos). Archivos en /public/marcas/,
 *  en blanco o gris claro sobre transparente (SVG o PNG). Vacío = la tira no se muestra. */
/** sinInvertir: logos con fondo propio (un círculo, por ejemplo), que al pasarlos a blanco quedarían como un bloque liso. */
export type Marca = { nombre: string; src: string; ancho: number; alto: number; sinInvertir?: boolean };
// Las de la landing anterior (comunicatumarca.com/v2) que se leen en la captura; logos de los sitios oficiales de cada marca.
export const MARCAS: Marca[] = [
  { nombre: "Tiendanube", src: "/marcas/tiendanube.svg", ancho: 160, alto: 40 },
  { nombre: "Coderhouse", src: "/marcas/coderhouse.svg", ancho: 137, alto: 40 },
  { nombre: "Takenos", src: "/marcas/takenos.svg", ancho: 140, alto: 16 },
  { nombre: "Universidad Torcuato Di Tella", src: "/marcas/di-tella.svg", ancho: 40, alto: 40, sinInvertir: true },
  { nombre: "Nescafé", src: "/marcas/nescafe.png", ancho: 135, alto: 40 },
  { nombre: "Bensimon", src: "/marcas/bensimon.png", ancho: 140, alto: 20 },
];

/** "Qué pasa en las 3 horas": [hora, bloque, título, qué pasa, qué se lleva]. "Te llevás" es borrador para que Manu lo revise. */
export const PROGRAMA: [string, string, string, string, string | null][] = [
  ["18:00", "Bienvenida", "Las reglas cambiaron", "Qué cambió en las redes sociales y en la estrategia de marca para 2027.", "Qué cambió y qué deja de funcionar en 2027, para no poner energía donde ya no rinde."],
  ["18:20", "Comunicación estratégica", "Qué decís", "Trabajás tu mensaje: qué hacés, para quién y por qué te tienen que escuchar a vos.", "Tu mensaje claro, a quién le hablás y en qué etapa está hoy tu comunicación estratégica."],
  ["18:50", "Comunicación creativa", "Cómo lo mostrás", "Definís qué tipo de contenido te conviene hacer y cuál es el formato que te sale natural.", "Los formatos de contenido que mejor te quedan: los que te salen fácil, disfrutás y funcionan."],
  ["19:20", "Pausa", "Break", "15 minutos para descansar y conocer a quienes están en la sala.", null],
  ["19:35", "Comunicación de impacto", "Cómo lo decís", "Practicamos en vivo. Dos o tres personas pasan al frente y las corrijo ahí mismo, para que todos vean qué cambia.", "Las correcciones en vivo y qué practicar para hablar frente a cámara y en un escenario igual que como sos en persona."],
  ["20:05", "Plan 2027", "Tu foco y tus preguntas", "Armamos tu planificación para 2027 y me hacés tus preguntas en vivo.", "Tu planificación 2027 y tus dudas respondidas en persona."],
  ["20:35", "Cierre", "La definición final de tu marca para 2027", "Juntamos todo: qué decís, cómo lo mostrás y cómo lo decís. A las 21 h terminamos.", "Tu marca definida para 2027 y el próximo paso concreto."],
];
