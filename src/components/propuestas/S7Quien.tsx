/* eslint-disable @next/next/no-img-element */
import c from "./comun.module.css";
import s from "./s7.module.css";

const FOTO = { src: "/fotos/manu-escenario.jpg", alt: "Manu Casaubon dando una charla en un escenario, con micrófono y presentador en la mano" };
const P1_RESTO = "Acompaño a personas cracks en lo que hacen a aprender a comunicarlo al mundo, logrando alcanzar nuevas oportunidades (ventas, charlas, medios, etc.).";

/** Segundo párrafo con las cifras resaltadas (mismo texto). */
function Cifras({ clase }: { clase: string }) {
  return <p>Con más de <b className={clase}>89.000</b> seguidores en Instagram, <b className={clase}>200.000</b> en TikTok y <b className={clase}>130.000</b> en YouTube, soy speaker, conferencista y capacitador en universidades, empresas y eventos.</p>;
}

// A · Retrato a sangre: la foto arriba de borde a borde con el título encima, la bio abajo y las cifras en mostaza.
export function QuienA() {
  return (
    <section id="s7-a" className={`${c.banda} ${c.oscuro} ${s.a}`}>
      <figure className={s.aFoto}><img src={FOTO.src} alt={FOTO.alt} /></figure>
      <div className={`${c.ancho} ${s.aTexto}`}>
        <h2>Quién la da</h2>
        <div className={s.aBio}>
          <p>Soy Manu Casaubon. {P1_RESTO}</p>
          <Cifras clase={s.aCifra} />
        </div>
      </div>
    </section>
  );
}

// B · Arco en crema: la foto recortada en arco con un garabato a mano y la bio en EB Garamond, con las cifras en rojo.
export function QuienB() {
  return (
    <section id="s7-b" className={`${c.banda} ${c.lucesC} ${s.b}`}><div className={`${c.ancho} ${s.bGrid}`}>
      <div className={s.bTexto}>
        <h2>Quién la <span className={c.rojo}>da</span></h2>
        <div className={s.bBio}>
          <p className={s.bLead}>Soy Manu Casaubon. {P1_RESTO}</p>
          <Cifras clase={s.bCifra} />
        </div>
      </div>
      <figure className={s.bFoto}>
        <img src={FOTO.src} alt={FOTO.alt} />
        <svg className={s.bGarabato} viewBox="0 0 80 80" aria-hidden="true"><path d="M40 6v14M40 60v14M6 40h14M60 40h14M16 16l10 10M54 54l10 10M64 16 54 26M26 54 16 64" stroke="var(--rojo)" strokeWidth="4" strokeLinecap="round" /></svg>
      </figure>
    </div></section>
  );
}

// C · Presentación: "Soy Manu Casaubon" como titular grande, foto con marco crema y bloque mostaza, cifras en pastillas.
export function QuienC() {
  return (
    <section id="s7-c" className={`${c.banda} ${c.lucesO} ${s.c}`}><div className={c.ancho}>
      <h2 className={s.cTitulo}>Quién la da</h2>
      <div className={s.cGrid}>
        <figure className={s.cFoto}><img src={FOTO.src} alt={FOTO.alt} /></figure>
        <div className={s.cBio}>
          <p><span className={s.cNombre}>Soy Manu Casaubon.</span> {P1_RESTO}</p>
          <Cifras clase={s.cCifra} />
        </div>
      </div>
    </div></section>
  );
}
