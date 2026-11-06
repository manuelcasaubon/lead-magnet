import type { Metadata } from "next";
import Link from "next/link";
import { RUTAS } from "@/lib/rutas";
import Tracker from "@/components/track/Tracker";
import Transformacion from "@/components/inicio/Transformacion";
import Agenda from "@/components/inicio/Agenda";
import s from "@/components/inicio/inicio.module.css";

// Inicio del sitio central: landing de la oferta principal (docs/SPEC.md §5.8). Versión B "Escenario primero" del
// boceto S8, elegida por Manu el 6/11, con la animación de la transformación al hacer scroll y la agenda de Cal.com.
// Reglas (DECISIONES.md D17 y S8): hasta el 25/11 no se presenta ni se vende el programa de 4 meses (el bloque no está),
// los casos de alumnos no salen sin permiso escrito (D11) y el inicio no se indexa.
// Hasta que termina la clase del 18/11, la franja y el CTA principal llevan a /evento; después, a la agenda.

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: "Manu Casaubon · Comunica Tu Marca" },
  description: "Te ayudo a comunicar lo que sabés y a tener una marca personal que hable por vos, en las redes y arriba del escenario.",
  robots: { index: false, follow: true },
};

const FIN_CLASE = Date.parse("2026-11-18T21:00:00-03:00");
const IG = "https://ig.me/m/casaubon.ar";
const YT = "https://www.youtube.com/@manuelcasaubon";

export default function Inicio() {
  const antesDeLaClase = Date.now() < FIN_CLASE;

  return (
    <div className={s.pagina}>
      <Tracker />
      {antesDeLaClase && (
        <Link className={s.franja} href={RUTAS.evento} data-track="franja_evento">
          Próxima clase en vivo: <b>miércoles 18/11 en Palermo</b>. Ver la clase →
        </Link>
      )}
      <header className={s.oscuro}>
        <div className={s.cabeza}>
          <span className={s.nombre}>Manu Casaubon</span>
          <nav aria-label="Secciones">
            <a href="#metodo">Método</a>
            {antesDeLaClase && <a href="#clase">Clase en vivo</a>}
            <a href="#agenda">Agendar</a>
            <a href="#contacto">Contacto</a>
          </nav>
        </div>
      </header>

      <main>
        <section className={`${s.banda} ${s.oscuro}`}>
          <div className={`${s.in} ${s.escena}`}>
            <p className={s.pre}>Estás en un evento, escuchás al speaker y pensás:</p>
            <h1 className={s.cita}>«Sabe, pero no sabe tanto como yo».</h1>
            <p className={s.resp}>¿Por qué lo llaman a él? <b>Porque comunica.</b> Te ayudo a que te llamen a vos.</p>
            <div className={s.botones}>
              {antesDeLaClase ? (
                <>
                  <Link className={s.boton} href={RUTAS.evento} data-track="hero_evento">Ver la clase del 18/11</Link>
                  <a className={s.link2} href="#agenda" data-track="hero_agenda">Agendá una sesión estratégica</a>
                </>
              ) : (
                <>
                  <a className={s.boton} href="#agenda" data-track="hero_agenda">Agendá una sesión estratégica</a>
                  <a className={s.link2} href={IG} data-track="hero_instagram">Escribime por Instagram</a>
                </>
              )}
            </div>
          </div>
        </section>

        <Transformacion />

        <section className={`${s.banda} ${s.oscuro}`}>
          <div className={`${s.in} ${s.pila} ${s.amplia}`}>
            <h2 className={s.grande}>Online y offline</h2>
            <div className={s.lados}>
              <div className={s.lado}>
                <span className={s.rotulo}>En las redes</span>
                <h3>Contenido</h3>
                <ul className={s.lista}>
                  <li>Una bio clara: qué hacés y a quién ayudás.</li>
                  <li>Tus formatos ganadores, los que te salen natural.</li>
                  <li>Videos que te dan orgullo.</li>
                </ul>
              </div>
              <div className={s.lado}>
                <span className={s.rotulo}>Fuera de las redes</span>
                <h3>Escenario</h3>
                <ul className={s.lista}>
                  <li>Charlas, eventos y capacitaciones.</li>
                  <li>Ser el speaker al que llaman.</li>
                  <li>Hablar igual que como sos en persona.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="metodo" className={`${s.banda} ${s.crema}`}>
          <div className={`${s.in} ${s.pila} ${s.amplia}`}>
            <div className={s.pila}>
              <h2 className={s.grande}>El método, en 3 niveles</h2>
              <p className={s.texto}>Hay que nivelar los tres. Con los tres alineados, rompés el patrón.</p>
            </div>
            <div className={s.lineas}>
              <div className={s.linea}><b>Estratégica</b><span><em>Qué decís.</em> A quién y cómo, para que tu sector piense en vos.</span></div>
              <div className={s.linea}><b>Creativa</b><span><em>Cómo lo mostrás.</em> Tus formatos ganadores de contenido.</span></div>
              <div className={s.linea}><b>De impacto</b><span><em>Cómo lo decís.</em> Frente a cámara, en un escenario y en el día a día.</span></div>
            </div>
          </div>
        </section>

        {antesDeLaClase && (
          <section id="clase" className={`${s.banda} ${s.crema}`} style={{ paddingBlockStart: 0 }}>
            <div className={`${s.in} ${s.pila} ${s.amplia}`}>
              <div className={s.pila}>
                <h2 className={s.grande}>Vení a la próxima clase</h2>
                <p className={s.bajada}>Cómo destacar con tu marca personal en 2027. De que nadie te conozca a que te llamen a vos.</p>
              </div>
              <div className={s.entrada}>
                <div className={s.dato}><span>Cuándo</span><strong>Miércoles 18/11</strong></div>
                <div className={s.dato}><span>Horario</span><strong>18 a 21 h</strong></div>
                <div className={s.dato}><span>Dónde</span><strong>Palermo Soho</strong></div>
                <div className={s.dato}><span>Entrada</span><strong>USD 27</strong></div>
                <div className={s.talon}><Link className={s.boton} href={RUTAS.evento} data-track="clase_evento">Ver la clase</Link></div>
              </div>
              <p className={s.chico}>Clase presencial de 3 horas. Solo 30 lugares.</p>
            </div>
          </section>
        )}

        <section id="agenda" className={`${s.banda} ${s.crema}`} style={antesDeLaClase ? { paddingBlockStart: 0 } : undefined}>
          <div className={`${s.in} ${s.pila} ${s.amplia}`}>
            <div className={s.pila}>
              <h2 className={s.grande}>Agendá una sesión estratégica</h2>
              <p className={s.bajada}>45 minutos por videollamada para ver qué deberías hacer para que tu sector te conozca, en las redes y arriba del escenario.</p>
              <p className={s.texto}>Te hago 6 preguntas cortas y después elegís el día y el horario.</p>
            </div>
            <Agenda />
          </div>
        </section>

        <section id="contacto" className={`${s.banda} ${s.oscuro}`}>
          <div className={`${s.in} ${s.contacto}`}>
            <h2 className={s.grande}>¿Lo hablamos?</h2>
            <p className={s.bajada}>Soy Manu Casaubon. Si tenés algo importante para decir, escribime por Instagram y lo vemos.</p>
            <div className={s.botones}>
              <a className={s.boton} href={IG} data-track="contacto_instagram">Escribime por Instagram</a>
              <a className={s.link2} href={YT} data-track="contacto_youtube">Mi canal de YouTube</a>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${s.pie} ${s.oscuro}`}>
        <span>Manu Casaubon · Comunica Tu Marca</span>
        <a href={YT}>YouTube</a>
      </footer>
    </div>
  );
}
