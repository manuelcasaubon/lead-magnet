/* eslint-disable @next/next/no-img-element */
import { Circulado, DATOS, ICONOS_DATOS, Logos, MARCAS_TEXTO, Paso, Subrayado, VslMaqueta } from "./Comun";
import c from "./comun.module.css";
import s from "./s1.module.css";

const Resumen = ({ className }: { className?: string }) => (
  <p className={`${s.resumen} ${className ?? ""}`}>3 horas para entender cómo <strong>cambiaron las reglas</strong> de las redes y de la estrategia de marca, y salir con tu plan de acción para 2027: tu plan de marca y tu plan de contenido.</p>
);

// A · Cartel centrado con luces: todo al centro, logos en dos filas que se deslizan, entrada como ticket troquelado.
export function HeroA() {
  return (
    <section id="s1-a" className={`${c.banda} ${c.lucesO} ${s.a}`}><div className={c.ancho}>
      <h1 className={s.aTitulo}>Cómo <span className={c.rojo}>destacar</span> con tu marca personal en 2027</h1>
      <Resumen className={s.aResumen} />
      <div className={s.aVideo}>
        <Paso n={1}>Mirá el video</Paso>
        <div className={s.aMarco}>
          <div className={`${s.aFila} ${s.aArriba}`}><Logos doble className={s.aTira} /></div>
          <VslMaqueta className={s.aVsl} />
          <div className={`${s.aFila} ${s.aAbajo}`}><Logos doble className={`${s.aTira} ${s.aReversa}`} /></div>
        </div>
        <p className={s.marcasTexto}>{MARCAS_TEXTO}</p>
      </div>
      <div className={s.aTicket}>
        <div className={s.aDatos}>
          {DATOS.map(([k, v], i) => {
            const Ic = ICONOS_DATOS[i];
            return <div key={k} className={s.aDato}><span className={s.aIc}><Ic /></span><span className={s.etq}>{k}</span><strong>{v}</strong></div>;
          })}
        </div>
        <div className={s.aTalon}><a className={c.boton} href="#">Reservar mi lugar</a></div>
      </div>
      <p className={s.aLugares}><span className={s.punto} aria-hidden="true" />Quedan solo 30 lugares.</p>
    </div></section>
  );
}

// B · Editorial con foto: Manu en el escenario de fondo, título a la izquierda, video enmarcado y datos en fichas.
export function HeroB() {
  return (
    <section id="s1-b" className={`${c.banda} ${c.oscuro} ${s.b}`}>
      <img className={s.bFoto} src="/fotos/manu-escenario.jpg" alt="" />
      <div className={c.ancho}>
        <h1 className={s.bTitulo}>Cómo destacar con tu marca personal en <Subrayado><span className={c.mostaza}>2027</span></Subrayado></h1>
        <Resumen className={s.bResumen} />
        <div className={s.bVideo}>
          <Paso n={1} className={s.bPaso}>Mirá el video</Paso>
          <div className={s.bMarco}><VslMaqueta /></div>
          <div className={s.bMarcas}>
            <p className={s.marcasTexto}>{MARCAS_TEXTO}</p>
            <Logos className={s.bLogos} />
          </div>
        </div>
        <div className={s.bDatos}>
          {DATOS.map(([k, v], i) => {
            const Ic = ICONOS_DATOS[i];
            return <div key={k} className={s.bDato}><span className={s.bIc}><Ic t={22} /></span><div><span className={s.etq}>{k}</span><strong>{v}</strong></div></div>;
          })}
          <a className={`${c.boton} ${s.bBoton}`} href="#">Reservar mi lugar</a>
        </div>
        <p className={s.bLugares}>Quedan solo 30 lugares.</p>
      </div>
    </section>
  );
}

// C · Póster crema: el hero en claro, "2027" circulado a mano, el video sobre un bloque mostaza y los datos como talón con guiones.
export function HeroC() {
  return (
    <section id="s1-c" className={`${c.banda} ${c.lucesC} ${s.c}`}><div className={c.ancho}>
      <h1 className={s.cTitulo}>Cómo destacar con tu marca personal en <Circulado><span className={c.rojo}>2027</span></Circulado></h1>
      <Resumen className={s.cResumen} />
      <div className={s.cVideo}>
        <Paso n={1}>Mirá el video</Paso>
        <div className={s.cMarco}><VslMaqueta /></div>
      </div>
      <div className={s.cBanda}><Logos doble className={s.cTira} /></div>
      <p className={`${s.marcasTexto} ${s.cMarcasTexto}`}>{MARCAS_TEXTO}</p>
      <div className={s.cTalon}>
        <dl>
          {DATOS.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <a className={c.boton} href="#">Reservar mi lugar</a>
      </div>
      <p className={s.cLugares}>Quedan solo <Circulado color="var(--oscuro)">30</Circulado> lugares.</p>
    </div></section>
  );
}
