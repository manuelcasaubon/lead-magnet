import Vsl from "../Vsl";
import { LogosFondo, MarcasTexto, Paso } from "../Detalles";
import { IconoFecha, IconoPin, IconoReloj, IconoTicket } from "../Iconos";
import s from "../landing.module.css";
import h from "./hero.module.css";

// S1 · Hero, variante A (cartel centrado con luces), con los logos reales en movimiento alrededor del VSL (LogosFondo)
// y la entrada como ticket troquelado. Sin nombre ni bajada; el resumen se oculta en el celular.

const DATOS = [
  { Ic: IconoFecha, k: "Cuándo", v: "Miércoles 18/11" },
  { Ic: IconoReloj, k: "Horario", v: "18 a 21 h" },
  { Ic: IconoPin, k: "Dónde", v: "Palermo Soho" },
  { Ic: IconoTicket, k: "Entrada", v: "USD 27" },
];

type Props = { agotado: boolean; quedan: number | null; total: number };

export default function Hero({ agotado, quedan, total }: Props) {
  return (
    <section className={`${s.banda} ${s.luces} ${h.hero}`} id="inicio-evento"><div>
      <h1 className={h.titulo}>Cómo <span className={s.rojo}>destacar</span> con tu marca personal en 2027</h1>
      <p className={h.resumen}>3 horas para entender cómo <strong>cambiaron las reglas</strong> de las redes y de la estrategia de marca, y salir con tu plan de acción para 2027: tu plan de marca y tu plan de contenido.</p>

      <div className={h.video}>
        <Paso n={1}>Mirá el video</Paso>
        <div className={s.vslMarco}>
          <LogosFondo />
          <div className={s.vslFrente}><Vsl /></div>
        </div>
        <MarcasTexto />
      </div>

      <div className={h.ticket}>
        <div className={h.datos}>
          {DATOS.map(({ Ic, k, v }) => (
            <div key={k} className={h.dato}><span className={h.ic} aria-hidden="true"><Ic /></span><span className={h.etq}>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
        <div className={h.talon}>
          <a className={`${s.boton} ${agotado ? s.agotado : ""}`} href="#reservar" data-track="talon_reservar">
            {agotado ? "Agotado" : "Reservar mi lugar"}
          </a>
        </div>
      </div>

      {/* Con ventas, el 30 tachado y al lado los que quedan (número real de la base). */}
      <p className={h.lugares}>
        <span className={h.punto} aria-hidden="true" />
        <span>
          {agotado ? "Se agotaron los lugares." : quedan !== null && quedan < total
            ? <>Quedan solo <s className={h.tachado}>{total}</s> <span className={h.restan}>{quedan}</span> lugares.</>
            : <>Quedan solo {total} lugares.</>}
        </span>
      </p>
    </div></section>
  );
}
