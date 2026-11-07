import { ES_PARA, IcCheck, IcCheckCirculo, NO_ES_PARA } from "./Comun";
import c from "./comun.module.css";
import s from "./s6.module.css";

// A · Dos tarjetas: "Es para vos" en una tarjeta blanca con checks rojos en círculo; "No es para vos" en una tarjeta oscura con puntos rojos.
export function ParaQuienA() {
  return (
    <section id="s6-a" className={`${c.banda} ${c.lucesC} ${s.a}`}><div className={c.ancho}>
      <h2>Para quién es</h2>
      <div className={s.aDos}>
        <div className={s.aSi}>
          <h3>Es para vos si</h3>
          <ul>{ES_PARA.map((t) => <li key={t}><span className={s.aCheck} aria-hidden="true"><IcCheck t={16} /></span>{t}</li>)}</ul>
        </div>
        <div className={s.aNo}>
          <h3>No es para vos si</h3>
          <ul>{NO_ES_PARA.map((t) => <li key={t}><span className={s.punto} aria-hidden="true" />{t}</li>)}</ul>
        </div>
      </div>
    </div></section>
  );
}

// B · A mano en oscuro: los subtítulos escritos a mano, checks de trazo rojo grandes y un divisor dibujado.
export function ParaQuienB() {
  return (
    <section id="s6-b" className={`${c.banda} ${c.lucesO} ${s.b}`}><div className={c.ancho}>
      <h2>Para quién <span className={c.rojo}>es</span></h2>
      <div className={s.bDos}>
        <div>
          <h3 className={s.bMano}>Es para vos si</h3>
          <ul className={s.bSi}>{ES_PARA.map((t) => <li key={t}><span aria-hidden="true"><IcCheckCirculo /></span>{t}</li>)}</ul>
        </div>
        <svg className={s.bDivisor} viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true"><path d="M2 12c40-8 80 6 130-2s90-6 130 0 90 4 136-4" stroke="var(--mostaza)" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
        <div>
          <h3 className={`${s.bMano} ${s.bManoNo}`}>No es para vos si</h3>
          <ul className={s.bNo}>{NO_ES_PARA.map((t) => <li key={t}><span className={s.punto} aria-hidden="true" />{t}</li>)}</ul>
        </div>
      </div>
    </div></section>
  );
}

// C · Filas con etiqueta: dos etiquetas tipo pastilla (roja llena / con borde) y cada ítem como una fila con su marca grande.
export function ParaQuienC() {
  return (
    <section id="s6-c" className={`${c.banda} ${c.crema} ${s.c}`}><div className={c.ancho}>
      <h2>Para quién es</h2>
      <div className={s.cDos}>
        <div>
          <h3 className={s.cPildoraSi}>Es para vos si</h3>
          <ul className={s.cLista}>{ES_PARA.map((t) => <li key={t}><span className={s.cCheck} aria-hidden="true"><IcCheck t={18} /></span>{t}</li>)}</ul>
        </div>
        <div>
          <h3 className={s.cPildoraNo}>No es para vos si</h3>
          <ul className={`${s.cLista} ${s.cListaNo}`}>{NO_ES_PARA.map((t) => <li key={t}><span className={s.cPuntoG} aria-hidden="true"><span className={s.punto} /></span>{t}</li>)}</ul>
        </div>
      </div>
    </div></section>
  );
}
