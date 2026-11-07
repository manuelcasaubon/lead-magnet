import Image from "next/image";
import type { Cupo } from "@/lib/evento";
import BarraCta from "./BarraCta";
import LinkInstagram from "./LinkInstagram";
import Reserva from "./Reserva";
import Vsl from "./Vsl";
import { LogosFondo, MarcasTexto, Paso } from "./Detalles";
import { FOTOS, MOSTRAR_CASOS, MOSTRAR_REGLAS_2027, REGLAS_2027, formatoArs, type Foto } from "./contenido";
import s from "./landing.module.css";

// Landing de la clase del 18/11. Versión A del boceto, con el feedback de Manu del 6/11 (segunda ronda):
// título centrado → bajada → VSL → datos de la entrada → "Solo 30 lugares" en rojo; dirección y precio, abajo, al reservar.
// Server component: solo el formulario, la barra y los links medidos son de cliente.

type Props = { cupo: Cupo | null; precioArs: number; agotado: boolean };

const LUGARES_PUBLICOS = 30;
const BOCETO_FOTOS = process.env.FOTOS_BOCETO === "1";

function FotoReal({ foto, que, vertical }: { foto: Foto; que: string; vertical?: boolean }) {
  if (foto) {
    return (
      <figure className={`${s.foto} ${vertical ? s.fotoVertical : ""}`}>
        <Image src={foto.src} alt={foto.alt} width={foto.ancho} height={foto.alto} sizes={vertical ? "(max-width: 820px) 100vw, 380px" : "(max-width: 980px) 100vw, 980px"} />
      </figure>
    );
  }
  if (!BOCETO_FOTOS) return null;
  return <figure className={`${s.foto} ${s.fotoFalta}`}><span>Foto de Manu: {que}</span></figure>;
}

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
      <section className={`${s.banda} ${s.hero}`} id="inicio-evento"><div>
        <p className={s.marca}><b>Manuel Casaubon</b><span>Clase en vivo presencial en Buenos Aires</span></p>
        <div className={s.centro}>
          <h1>Cómo destacar con tu marca personal en 2027</h1>
          <p className={s.promesa}>De que nadie te conozca a que te llamen <span className={s.acento}>a vos</span>.</p>
        </div>
        <p className={`${s.resumen} ${s.centro}`}>3 horas para entender cómo <strong className={s.resalta}>cambiaron las reglas</strong> de las redes y de la estrategia de marca, y salir con tu plan de acción para 2027: tu plan de marca y tu plan de contenido.</p>
        <div className={s.conPaso}>
          <Paso n={1}>Mirá el video</Paso>
          <div className={s.vslMarco}>
            <LogosFondo />
            <div className={s.vslFrente}><Vsl /></div>
          </div>
          <MarcasTexto />
        </div>
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
        <p className={s.lugares}>
          {agotado ? "Se agotaron los lugares." : quedan !== null && quedan < LUGARES_PUBLICOS
            ? <>Quedan solo <s className={s.tachado}>{LUGARES_PUBLICOS}</s> <span className={s.restan}>{quedan}</span> lugares.</>
            : <>Quedan solo {LUGARES_PUBLICOS} lugares.</>}
        </p>
      </div></section>


      <section className={`${s.banda} ${s.crema}`}><div>
        <p className={s.frase}>Tenés mucho conocimiento y experiencia, <em>pero pocas personas saben lo que sabés.</em></p>
        <p className={s.texto}>Lo que te falta es comunicar tu marca de manera genuina y auténtica: con claridad y un plan de comunicación, sabiendo qué tipo de contenido, formato y mejorando tu forma de comunicar (oratoria y storytelling).</p>
        <FotoReal foto={FOTOS.charla} que="dando una charla o una conferencia" />
        {!agotado && (
          <div className={s.ctaMedio}>
            <a className={s.boton} href="#reservar" data-track="medio_reservar">Reservar mi lugar</a>
          </div>
        )}
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
          <div><span className={s.icono} aria-hidden="true">🗓️</span><h3>Tu planificación para 2027</h3><p>Una planificación completa para saber exactamente dónde poner el foco en tus redes y en tu marca personal.</p></div>
          <div><span className={s.icono} aria-hidden="true">🔍</span><h3>Una auditoría personalizada</h3><p>La auditoría de tu marca, mirada en los 3 niveles de comunicación.</p></div>
          <div><span className={s.icono} aria-hidden="true">🎯</span><h3>Cómo diferenciarte</h3><p>Entendés cómo cambiaron las reglas del juego y cómo diferenciar tu marca en 2027.</p></div>
          <div><span className={s.icono} aria-hidden="true">🙋</span><h3>Tus preguntas, en persona</h3><p>Me preguntás lo que necesites en vivo, cara a cara.</p></div>
        </div>
      </div></section>

      <section className={s.banda}><div>
        <h2>Qué pasa en las 3 horas</h2>
        <div className={s.prog}>
          {PROGRAMA.map(([hora, nivel, titulo, texto, lleva]) => (
            // Desplegable: cerrado se ve la hora, el bloque y el título; al abrir, qué pasa y qué te llevás.
            <details className={s.fila} key={hora}>
              <summary>
                <span className={s.hora}>{hora}</span>
                <div><span className={s.nivel}>{nivel}</span><h3>{titulo}</h3></div>
                <span className={s.flecha} aria-hidden="true">+</span>
              </summary>
              <div className={s.filaCuerpo}>
                <p>{texto}</p>
                {lleva && <p className={s.tellevas}><b>Te llevás:</b> {lleva}</p>}
              </div>
            </details>
          ))}
        </div>
        <FotoReal foto={FOTOS.clase} que="dando una clase o una capacitación para un cliente" />
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
              <li>Ya vivís de tu marca o de tu profesión y querés potenciarla.</li>
            </ul>
          </div>
          <div>
            <h3>No es para vos si</h3>
            <ul className={`${s.lista} ${s.no}`}>
              <li>Buscás hacerte viral o famoso.</li>
              <li>Esperás resultados de un día para el otro.</li>
              <li>Querés desarrollar tu marca personal solo para ganar más dinero y nada más.</li>
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
        <div className={s.quien}>
        <div className={s.bio}>
          <p>Soy Manu Casaubon. Acompaño a personas cracks en lo que hacen a aprender a comunicarlo al mundo, logrando alcanzar nuevas oportunidades (ventas, charlas, medios, etc.).</p>
          <p>Con más de 89.000 seguidores en Instagram, 200.000 en TikTok y 130.000 en YouTube, soy speaker, conferencista y capacitador en universidades, empresas y eventos.</p>
        </div>
        <FotoReal foto={FOTOS.quien} que="en un escenario o retrato" vertical />
        </div>
      </div></section>

      <section className={`${s.banda} ${s.crema}`}><div>
        <h2>Preguntas</h2>
        <div className={s.faq}>
          <details><summary>¿Dónde es?</summary><p>En Niceto Vega 4601, Palermo Soho, CABA.</p></details>
          <details><summary>¿Cuánto dura?</summary><p>3 horas, de 18 a 21 h. Las puertas abren a las 17:45.</p></details>
          <details><summary>Recién empiezo con mi marca, ¿me sirve?</summary><p>Sí, siempre que tengas experiencia en lo que hacés. Te llevás una estrategia clara para arrancar y saber dónde poner el foco. Lo importante es que no estés empezando en tu profesión.</p></details>
          <details><summary>¿Tengo que tener muchos seguidores?</summary><p>No.</p></details>
          <details><summary>¿Vamos a aprender a vender por redes?</summary><p>No. Vamos a aprender a generar oportunidades: entre ellas, ventas, pero también charlas, capacitaciones y más.</p></details>
          <details><summary>¿Cómo pago?</summary><p>Con Mercado Pago, en pesos ({precio}).</p></details>
          <details><summary>¿Y si ese día no puedo ir porque no estoy en Buenos Aires?</summary><p><LinkInstagram place="faq_no_puedo">Escribime TALLER</LinkInstagram> y te cuento cómo seguir.</p></details>
        </div>
      </div></section>

      <section className={`${s.banda} ${s.final}`} id="reservar"><div>
        <h2>Nos vemos el 18/11</h2>
        <p className={s.bajada}>{agotado ? "Se agotaron los lugares." : `${lugares.replace(/\.$/, "")}, miércoles de 18 a 21 h, en Palermo Soho.`}</p>
        {!agotado && <Paso n={2}>Reservá tu lugar</Paso>}
        {!agotado && <p className={s.aviso}>Niceto Vega 4601, CABA. Pagás {precio} por Mercado Pago.</p>}
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

// [hora, bloque, título, qué pasa, qué se lleva]. "Te llevás" es borrador para que Manu lo revise.
const PROGRAMA: [string, string, string, string, string | null][] = [
  ["18:00", "Bienvenida", "Las reglas cambiaron", "Qué cambió en las redes sociales y en la estrategia de marca para 2027.", "Qué cambió y qué deja de funcionar en 2027, para no poner energía donde ya no rinde."],
  ["18:20", "Comunicación estratégica", "Qué decís", "Trabajás tu mensaje: qué hacés, para quién y por qué te tienen que escuchar a vos.", "Tu mensaje claro, a quién le hablás y en qué etapa está hoy tu comunicación estratégica."],
  ["18:50", "Comunicación creativa", "Cómo lo mostrás", "Definís qué tipo de contenido te conviene hacer y cuál es el formato que te sale natural.", "Los formatos de contenido que mejor te quedan: los que te salen fácil, disfrutás y funcionan."],
  ["19:20", "Pausa", "Break", "15 minutos para descansar y conocer a quienes están en la sala.", null],
  ["19:35", "Comunicación de impacto", "Cómo lo decís", "Practicamos en vivo. Dos o tres personas pasan al frente y las corrijo ahí mismo, para que todos vean qué cambia.", "Las correcciones en vivo y qué practicar para hablar frente a cámara y en un escenario igual que como sos en persona."],
  ["20:05", "Plan 2027", "Tu foco y tus preguntas", "Armamos tu planificación para 2027 y me hacés tus preguntas en vivo.", "Tu planificación 2027 y tus dudas respondidas en persona."],
  ["20:35", "Cierre", "La definición final de tu marca para 2027", "Juntamos todo: qué decís, cómo lo mostrás y cómo lo decís. A las 21 h terminamos.", "Tu marca definida para 2027 y el próximo paso concreto."],
];
