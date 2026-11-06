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

/** Fotos reales de Manu (charla, clase, capacitación). Van en /public/fotos/ y se cargan acá cuando Manu las pase.
 *  Sin archivo, el lugar no se muestra. Con FOTOS_BOCETO=1 (solo para el boceto) se ve un recuadro con lo que va. */
export type Foto = { src: string; alt: string; ancho: number; alto: number } | null;
export const FOTOS: { charla: Foto; clase: Foto; quien: Foto } = {
  charla: { src: "/fotos/manu-tent.jpg", alt: "Manu Casaubon como host en el escenario de tent. Creator Summit, frente al público", ancho: 1600, alto: 1067 },
  clase: { src: "/fotos/manu-clase.jpg", alt: "Manu Casaubon de espaldas, dando una clase a un grupo sentado alrededor de una mesa", ancho: 1600, alto: 1200 },
  quien: { src: "/fotos/manu-escenario.jpg", alt: "Manu Casaubon dando una charla en un escenario, con micrófono y presentador en la mano", ancho: 1000, alto: 1500 },
};
