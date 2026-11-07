import Image from "next/image";
import LinkInstagram from "../LinkInstagram";
import Reserva from "../Reserva";
import { Paso } from "../Detalles";
import { FOTOS } from "../contenido";
import s from "../landing.module.css";
import c from "./cierre.module.css";

// S9 · "Nos vemos el 18/11", variante C: sobre la foto de la clase, una entrada crema troquelada con el título y los datos,
// y al lado (abajo en el celular) el formulario real, que lleva a Mercado Pago. Agotado: aviso y "Mandame TALLER".
// id="reservar": lo usan los botones de la página y la barra fija.
type Props = { agotado: boolean; lugares: string; precio: string };

export default function Cierre({ agotado, lugares, precio }: Props) {
  const foto = FOTOS.clase;
  return (
    <section className={`${s.banda} ${c.seccion}`} id="reservar">
      {foto && <Image className={c.fondo} src={foto.src} alt="" fill sizes="100vw" />}
      <div className={c.grid}>
        <div className={c.entrada}>
          <h2>Nos vemos el <span className={s.rojo}>18/11</span></h2>
          <p className={c.bajada}>{agotado ? "Se agotaron los lugares." : `${lugares.replace(/\.$/, "")}, miércoles de 18 a 21 h, en Palermo Soho.`}</p>
          {!agotado && (
            <>
              <div className={c.corte} aria-hidden="true" />
              <Paso n={2} className={c.paso}>Reservá tu lugar</Paso>
              <p className={c.aviso}>Niceto Vega 4601, CABA. Pagás {precio} por Mercado Pago.</p>
            </>
          )}
        </div>
        {agotado ? (
          <div className={c.agotado}>
            <div className={c.cerrado} role="status">
              <strong>Agotado</strong>
              <p>No quedan lugares para el 18/11.</p>
            </div>
            <p className={c.secundario}>¿Querés que te avise si se libera un lugar? <LinkInstagram place="agotado">Mandame TALLER</LinkInstagram></p>
          </div>
        ) : (
          <div className={c.formulario}><Reserva /></div>
        )}
      </div>
    </section>
  );
}
