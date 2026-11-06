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
