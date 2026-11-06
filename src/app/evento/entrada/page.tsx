import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RUTAS } from "@/lib/rutas";
import { procesarPago } from "@/lib/pagos/procesar";
import { registrarEvento } from "@/lib/pagos/eventos";
import Comprobante from "@/components/comprobante/Comprobante";
import PerfilAuditoria from "@/components/comprobante/PerfilAuditoria";
import Reintentar from "@/components/comprobante/Reintentar";
import s from "@/components/comprobante/comprobante.module.css";
import { leerOrden } from "./datos";

// Retorno de Mercado Pago: /evento/entrada?o=<order_id>&payment_id=…&status=…  (docs/SPEC.md §2.8 y §5.3.8)
// Nunca se confía en status ni en external_reference de la URL: si viene payment_id y la orden todavía
// no está aprobada, se consulta ese pago a la API y se aplica solo si pertenece a esta orden.
//
// Link fijo de MP (mpago.la): vuelve SIN ?o= y con payment_id. La Edge Function "pagos" verifica y adopta el
// pago, y devuelve el id de orden solo si el pago se aprobó hace menos de 60 min (así nadie ve entradas ajenas
// probando números de pago viejos). Fuera de esa ventana, la persona tiene su link en el mail de confirmación.

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu entrada · Manu Casaubon",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Entrada({ searchParams }: Props) {
  const q = await searchParams;
  const o = uno(q.o);
  const paymentId = uno(q.payment_id) ?? uno(q.collection_id);

  if (!o && paymentId && /^\d{1,20}$/.test(paymentId)) {
    let destino: string | null = null;
    try {
      const r = await procesarPago(paymentId);
      if (r.ok && r.orderId) destino = `${RUTAS.entrada}?o=${r.orderId}`;
      else if (r.ok && r.confirmado) destino = `${RUTAS.entrada}?listo=1`;
      else if (r.ok && r.pendiente) destino = `${RUTAS.entrada}?en_proceso=1`;
    } catch (e) {
      console.error("/evento/entrada pago por link", e);
    }
    if (destino) redirect(destino);
  }
  if (!o && uno(q.listo)) {
    return (
      <main className={s.pagina}>
        <p className={s.marca}>Manu Casaubon</p>
        <Mensaje titulo="Tu pago está confirmado" bajada="Te mandé tu entrada por mail. Buscá el mensaje con el asunto «Tu lugar para el 18/11 está reservado»." />
      </main>
    );
  }
  if (!o && uno(q.en_proceso)) {
    return (
      <main className={s.pagina}>
        <p className={s.marca}>Manu Casaubon</p>
        <Mensaje titulo="Tu pago está en proceso" bajada="Cuando Mercado Pago lo apruebe, te mando la entrada por mail. No hace falta que pagues de nuevo." />
      </main>
    );
  }

  let vista = await leerOrden(o);
  if (vista.tipo !== "no_existe" && vista.tipo !== "aprobada" && vista.tipo !== "cancelada" && paymentId && /^\d{1,20}$/.test(paymentId)) {
    try {
      const r = await procesarPago(paymentId, { ordenEsperada: o });
      if (r.ok) vista = await leerOrden(o);
    } catch (e) {
      console.error("/evento/entrada procesarPago", e);
    }
  }

  if (vista.tipo === "aprobada") {
    const vid = (await headers()).get("x-vid");
    await registrarEvento({ name: "ticket_view", visitorId: vid ?? vista.visitorId, personId: vista.personId, path: "/evento/entrada" });
  }

  return (
    <main className={s.pagina}>
      <p className={s.marca}>Manu Casaubon</p>
      {vista.tipo === "aprobada" && (
        <>
          <Comprobante datos={vista.datos} />
          <PerfilAuditoria o={vista.datos.orderId} sugerido={vista.perfilSugerido} guardado={vista.perfilGuardado} />
        </>
      )}
      {vista.tipo === "pendiente" && (
        <Mensaje titulo="Tu pago está en proceso" bajada="Cuando Mercado Pago lo apruebe, te confirmo el lugar por mail.">
          <p className={s.aviso}>Puede tardar unos minutos (o hasta 2 días hábiles si pagaste en efectivo). No hace falta que pagues de nuevo.</p>
          <a className={`${s.boton} ${s.sec}`} href={`/evento/entrada?o=${o}`}>Actualizar</a>
        </Mensaje>
      )}
      {vista.tipo === "sin_pago" && (
        <Mensaje titulo="Todavía no vemos tu pago" bajada="Si recién pagaste, esperá un momento y actualizá.">
          <a className={`${s.boton} ${s.sec}`} href={`/evento/entrada?o=${o}`}>Actualizar</a>
          <Reintentar texto="Ir a pagar con Mercado Pago" />
        </Mensaje>
      )}
      {vista.tipo === "rechazada" && (
        <Mensaje titulo="No se pudo cobrar" bajada="Mercado Pago no aprobó el pago. No se te cobró nada.">
          <p className={s.aviso}>Podés probar con otra tarjeta o con dinero en cuenta.</p>
          <Reintentar texto="Reintentar el pago" />
        </Mensaje>
      )}
      {vista.tipo === "cancelada" && (
        <Mensaje titulo="Esta entrada está cancelada" bajada="El pago se devolvió. Si creés que es un error, respondé el mail de confirmación." />
      )}
      {vista.tipo === "no_existe" && (
        <Mensaje titulo="No encontramos esta entrada" bajada="Revisá que el link esté completo. Si pagaste, te llega la confirmación por mail.">
          <Link className={`${s.boton} ${s.sec}`} href="/evento">Ir a la página de la clase</Link>
        </Mensaje>
      )}
    </main>
  );
}

function Mensaje({ titulo, bajada, children }: { titulo: string; bajada: string; children?: React.ReactNode }) {
  return (
    <>
      <div>
        <h1 className={s.titulo}>{titulo}</h1>
        <p className={s.bajada}>{bajada}</p>
      </div>
      {children && <div className={s.accionesFijas}>{children}</div>}
    </>
  );
}
