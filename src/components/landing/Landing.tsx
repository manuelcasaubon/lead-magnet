import type { Cupo } from "@/lib/evento";
import BarraCta from "./BarraCta";
import { MOSTRAR_CASOS, MOSTRAR_REGLAS_2027, REGLAS_2027, formatoArs } from "./contenido";
import Hero from "./secciones/Hero";
import Conocimiento from "./secciones/Conocimiento";
import Preguntas from "./secciones/Preguntas";
import Llevas from "./secciones/Llevas";
import Programa from "./secciones/Programa";
import ParaQuien from "./secciones/ParaQuien";
import Quien from "./secciones/Quien";
import Faq from "./secciones/Faq";
import Cierre from "./secciones/Cierre";
import s from "./landing.module.css";

// Landing de la clase del 18/11, armada con las variantes que eligió Manu el 7/11 (una por sección, ver secciones/).
// Server component: solo el formulario, la barra y los links medidos son de cliente.

type Props = { cupo: Cupo | null; precioArs: number; agotado: boolean };

const LUGARES_PUBLICOS = 30;

export default function Landing({ cupo, precioArs, agotado }: Props) {
  // Siempre el número real (reglas de comunicación). Sin dato de la base, se dice el total.
  // CUPO_BOCETO: solo para la vista previa local (simula lugares vendidos); en producción no está definida.
  const simulado = process.env.CUPO_BOCETO ? Number(process.env.CUPO_BOCETO) : null;
  const quedan = cupo ? Math.max(0, cupo.left_public) : simulado;
  const lugares = agotado
    ? "Se agotaron los lugares."
    : quedan !== null && quedan < LUGARES_PUBLICOS
      ? `Quedan ${quedan} de ${LUGARES_PUBLICOS} lugares.`
      : `Solo ${LUGARES_PUBLICOS} lugares.`;
  const precio = formatoArs(precioArs);

  return (
    <main className={s.raiz}>
      <Hero agotado={agotado} quedan={quedan} total={LUGARES_PUBLICOS} />
      <Conocimiento agotado={agotado} />
      <Preguntas />

      {MOSTRAR_REGLAS_2027 && REGLAS_2027.length > 0 && (
        <section className={`${s.banda} ${s.lucesC}`}><div>
          <h2>Las reglas del juego cambiaron</h2>
          <p className={s.texto}>En las redes y en la estrategia de marca. Estos son los cambios que vamos a trabajar en la clase.</p>
          <ul className={s.reglas}>{REGLAS_2027.map((r) => <li key={r}>{r}</li>)}</ul>
        </div></section>
      )}

      <Llevas />
      <Programa />
      <ParaQuien />

      {MOSTRAR_CASOS && (
        <section className={`${s.banda} ${s.lucesC} ${s.sinArriba}`}><div>
          <h2>Algunos alumnos</h2>
          <div className={s.casos}>
            <div className={s.caso}><strong>USD 5.000</strong><h3>Joaco Comar</h3><p>Lo cerró en su primera charla propia, con 12 personas en la sala.</p></div>
            <div className={s.caso}><strong>2.000 a 8.700</strong><h3>Fer Di Tomasso</h3><p>Sommelier de más de 45 años. Seguidores en 8 meses, más invitaciones a charlas y capacitaciones.</p></div>
            <div className={s.caso}><strong>30.000 a 48.000</strong><h3>Axel Becker</h3><p>Seguidores en 5 a 6 meses. Hoy es referente de finanzas y cripto.</p></div>
          </div>
          <p className={s.chico}>Son resultados de cada uno, con su trabajo y su contexto. No son una promesa.</p>
        </div></section>
      )}

      <Quien />
      <Faq precio={precio} />
      <Cierre agotado={agotado} lugares={lugares} precio={precio} />

      <BarraCta heroId="inicio-evento" destinoId="reservar" texto="Miércoles 18/11 · USD 27"
        detalle={agotado ? "Se agotaron los lugares" : `${lugares.replace(/\.$/, "")} · Palermo Soho`} agotado={agotado} />
    </main>
  );
}
