import type { Cupo } from "@/lib/evento";
import BarraCta from "./BarraCta";
import LinkInstagram from "./LinkInstagram";
import Reserva from "./Reserva";
import Vsl from "./Vsl";
import { MOSTRAR_CASOS, MOSTRAR_REGLAS_2027, REGLAS_2027, formatoArs } from "./contenido";
import s from "./landing.module.css";

// Landing de la clase del 18/11, versión A "Fiel al boceto" (elegida por Manu el 6/11/26).
// Textos: docs/referencia/landing-boceto.html. Server component: solo el formulario, la barra y los links medidos son de cliente.

type Props = { cupo: Cupo | null; precioArs: number; agotado: boolean };

const LUGARES_PUBLICOS = 30;

export default function Landing({ cupo, precioArs, agotado }: Props) {
  // Siempre el número real (reglas de comunicación). Sin dato de la base, se dice el total.
  const quedan = cupo ? Math.max(0, cupo.left_public) : null;
  const lugares = agotado
    ? "Se agotaron los lugares."
    : quedan !== null && quedan < LUGARES_PUBLICOS
      ? `Quedan ${quedan} de ${LUGARES_PUBLICOS} lugares.`
      : `Solo ${LUGARES_PUBLICOS} lugares.`;
  const precio = formatoArs(precioArs);

  return (
    <main className={s.raiz}>
      <section className={`${s.banda} ${s.hero}`} id="inicio-evento"><div>
        <p className={s.marca}><b>Manu Casaubon</b><span>Clase en vivo presencial en Buenos Aires</span></p>
        <div>
          <h1>Cómo destacar con tu marca personal en 2027</h1>
          <p className={s.promesa}>De que nadie te conozca a que te llamen a vos.</p>
        </div>
        <p className={s.resumen}>3 horas para entender cómo cambiaron las reglas de las redes y de la estrategia de marca, y salir con tu plan para 2027.</p>
        <div className={s.entrada}>
          <div className={s.dato}><span>Cuándo</span><strong>Miércoles 18/11</strong></div>
          <div className={s.dato}><span>Horario</span><strong>18 a 21 h</strong></div>
          <div className={s.dato}><span>Dónde</span><strong>Palermo Soho</strong></div>
          <div className={s.dato}><span>Entrada</span><strong>USD 27</strong></div>
          <div className={s.talon}>
            <a className={`${s.boton} ${agotado ? s.agotado : ""}`} href="#reservar" data-track="talon_reservar">
              {agotado ? "Agotado" : "Reservar mi lugar"}
            </a>
          </div>
        </div>
        <p className={s.aviso}>{lugares} Niceto Vega 4601, CABA. Pagás {precio} por Mercado Pago.</p>
        <p className={s.secundario}>¿Preferís por Instagram? <LinkInstagram place="hero">Mandame TALLER</LinkInstagram></p>
      </div></section>

      <section className={`${s.banda} ${s.sinArriba}`} aria-label="Video de presentación"><div>
        <Vsl />
      </div></section>

      <section className={`${s.banda} ${s.crema}`}><div>
        <p className={s.frase}>Vas a un evento, escuchás al speaker y pensás: <em>«Sabe, pero no sabe tanto como yo».</em></p>
        <p className={s.texto}>Entonces, ¿por qué lo llaman a él y a vos no? Porque él está comunicando lo que sabe. En esta clase trabajamos para que tu sector te conozca, en las redes y arriba del escenario, con una comunicación profesional.</p>
      </div></section>

      <section className={s.banda}><div>
        <h2>Si hoy te preguntás esto</h2>
        <ul className={s.preguntas}>
          <li>¿Qué debería hacer con mi marca?</li>
          <li>¿Qué tipo de contenido tendría que hacer?</li>
          <li>¿Qué estrategia tendría que seguir?</li>
          <li>¿Qué va a funcionar en 2027?</li>
        </ul>
        <p className={s.remate}>Esta clase es para vos. Eso es lo que vamos a trabajar.</p>
      </div></section>

      {MOSTRAR_REGLAS_2027 && REGLAS_2027.length > 0 && (
        <section className={`${s.banda} ${s.crema}`}><div>
          <h2>Las reglas del juego cambiaron</h2>
          <p className={s.texto}>En las redes y en la estrategia de marca. Estos son los cambios que vamos a trabajar en la clase.</p>
          <ul className={s.reglas}>{REGLAS_2027.map((r) => <li key={r}>{r}</li>)}</ul>
        </div></section>
      )}

      <section className={`${s.banda} ${s.crema}`}><div>
        <h2>Qué te llevás</h2>
        <div className={s.lleva}>
          <div><h3>Tu planificación para 2027</h3><p>Una planificación completa para saber exactamente dónde poner el foco en tus redes y en tu marca personal.</p></div>
          <div><h3>Una auditoría personalizada</h3><p>La auditoría de tu marca, mirada en los 3 niveles de comunicación.</p></div>
          <div><h3>Cómo diferenciarte</h3><p>Entendés cómo cambiaron las reglas del juego y cómo diferenciar tu marca en 2027.</p></div>
          <div><h3>Tus preguntas, en persona</h3><p>Me preguntás lo que necesites en vivo, cara a cara.</p></div>
        </div>
      </div></section>

      <section className={s.banda}><div>
        <h2>Qué pasa en las 3 horas</h2>
        <div className={s.prog}>
          {PROGRAMA.map(([hora, nivel, titulo, texto]) => (
            <div className={s.fila} key={hora}>
              <div className={s.hora}>{hora}</div>
              <div><div className={s.nivel}>{nivel}</div><h3>{titulo}</h3><p>{texto}</p></div>
            </div>
          ))}
        </div>
      </div></section>

      <section className={`${s.banda} ${s.crema}`}><div>
        <h2>Para quién es</h2>
        <div className={s.dos}>
          <div>
            <h3>Es para vos si</h3>
            <ul className={s.lista}>
              <li>Ya tenés una marca personal o la querés empezar.</li>
              <li>Querés una estrategia clara y saber hacia dónde ir en 2027.</li>
              <li>Sabés de lo tuyo y querés que tu sector te conozca.</li>
            </ul>
          </div>
          <div>
            <h3>No es para vos si</h3>
            <ul className={`${s.lista} ${s.no}`}>
              <li>Buscás hacerte viral o famoso.</li>
              <li>Esperás resultados de un día para el otro.</li>
              <li>Querés una fórmula para repetir sin pensar.</li>
            </ul>
          </div>
        </div>
      </div></section>

      {MOSTRAR_CASOS && (
        <section className={`${s.banda} ${s.crema} ${s.sinArriba}`}><div>
          <h2>Algunos alumnos</h2>
          <div className={s.casos}>
            <div className={s.caso}><strong>USD 5.000</strong><h3>Joaco Comar</h3><p>Lo cerró en su primera charla propia, con 12 personas en la sala.</p></div>
            <div className={s.caso}><strong>2.000 a 8.700</strong><h3>Fer Di Tomasso</h3><p>Sommelier de más de 45 años. Seguidores en 8 meses, más invitaciones a charlas y capacitaciones.</p></div>
            <div className={s.caso}><strong>30.000 a 48.000</strong><h3>Axel Becker</h3><p>Seguidores en 5 a 6 meses. Hoy es referente de finanzas y cripto.</p></div>
          </div>
          <p className={s.chico}>Son resultados de cada uno, con su trabajo y su contexto. No son una promesa.</p>
        </div></section>
      )}

      <section className={s.banda}><div>
        <h2>Quién la da</h2>
        <div className={s.bio}>
          <p>Soy Manu Casaubon. Trabajo con personas que tienen algo importante para decir, para que aprendan a comunicarlo siendo ellas mismas, sin armar un personaje.</p>
          <p>Tengo más de 200.000 seguidores en TikTok y más de 100.000 en YouTube. Desde que cambié de tema sumé unos 30.000 seguidores nuevos en Instagram. Doy charlas y capacitaciones en universidades y eventos.</p>
        </div>
      </div></section>

      <section className={`${s.banda} ${s.crema}`}><div>
        <h2>Preguntas</h2>
        <div className={s.faq}>
          <details><summary>¿Dónde es?</summary><p>En Niceto Vega 4601, Palermo Soho, CABA.</p></details>
          <details><summary>¿Cuánto dura?</summary><p>3 horas, de 18 a 21 h. Las puertas abren a las 17:45.</p></details>
          <details><summary>Recién empiezo con mi marca, ¿me sirve?</summary><p>Sí. Te llevás una estrategia clara para arrancar y saber dónde poner el foco.</p></details>
          <details><summary>¿Tengo que tener muchos seguidores?</summary><p>No. Lo que importa es que tengas algo para decir.</p></details>
          <details><summary>Nunca di una charla, ¿me sirve?</summary><p>Sí. Somos 30 personas y pasar al frente es opcional.</p></details>
          <details><summary>¿Cómo pago?</summary><p>Con Mercado Pago, en pesos ({precio}). Completás tus datos, pagás y volvés acá a ver tu entrada. Si después entrás a mi programa, la entrada se descuenta. Si preferís, también podés <LinkInstagram place="faq_pago">mandarme TALLER por Instagram</LinkInstagram>.</p></details>
          <details><summary>¿Y si ese día no puedo ir?</summary><p><LinkInstagram place="faq_no_puedo">Escribime TALLER igual</LinkInstagram> y te cuento lo que sigue.</p></details>
        </div>
      </div></section>

      <section className={`${s.banda} ${s.final}`} id="reservar"><div>
        <h2>Nos vemos el 18/11</h2>
        <p className={s.bajada}>{agotado ? "Se agotaron los lugares." : `${lugares.replace(/\.$/, "")}, miércoles de 18 a 21 h, en Palermo Soho.`}</p>
        {agotado ? (
          <div className={s.cerrado} role="status">
            <strong>Agotado</strong>
            <p>No quedan lugares para el 18/11.</p>
          </div>
        ) : (
          <Reserva />
        )}
        {agotado && (
          <p className={s.secundario}>¿Querés que te avise si se libera un lugar? <LinkInstagram place="agotado">Mandame TALLER</LinkInstagram></p>
        )}
      </div></section>

      <BarraCta heroId="inicio-evento" destinoId="reservar" texto="Miércoles 18/11 · USD 27"
        detalle={agotado ? "Se agotaron los lugares" : `${lugares.replace(/\.$/, "")} · Palermo Soho`} agotado={agotado} />
    </main>
  );
}

const PROGRAMA: [string, string, string, string][] = [
  ["18:00", "Bienvenida", "Las reglas cambiaron", "Qué cambió en las redes sociales y en la estrategia de marca para 2027."],
  ["18:20", "Comunicación estratégica", "Qué decís", "Trabajás tu mensaje: qué hacés, para quién y por qué te tienen que escuchar a vos."],
  ["18:50", "Comunicación creativa", "Cómo lo mostrás", "Definís qué tipo de contenido te conviene hacer y cuál es el formato que te sale natural."],
  ["19:20", "Pausa", "Break", "15 minutos para descansar y conocer a quienes están en la sala."],
  ["19:35", "Comunicación de impacto", "Cómo lo decís", "Practicamos en vivo. Dos o tres personas pasan al frente y las corrijo ahí mismo, para que todos vean qué cambia."],
  ["20:05", "Plan 2027", "Tu foco y tus preguntas", "Cerramos tu planificación para 2027 y me hacés tus preguntas en vivo."],
  ["20:35", "Cierre", "Cómo seguir", "Te cuento cómo es mi programa de 4 meses, para quien quiera seguir trabajando conmigo. A las 21 h terminamos."],
];
