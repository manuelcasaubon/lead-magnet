"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track/cliente";
import { metaSchedule } from "@/components/track/MetaPixel";
import s from "./inicio.module.css";

// Agenda de la "Sesión estratégica de marca personal" (Cal.com, evento 7804794, docs/SPEC.md "Agenda con Cal.com").
// Primero, una pregunta por pantalla (los mismos campos de la reserva en Cal.com). Después se abre el calendario
// embebido con esas respuestas prellenadas y metadata[vid] + metadata[utm_*], que cal-webhook usa para unir la
// reserva con la visita. El lead se crea recién con la reserva (cal-webhook, fuente "cal"): acá no se guarda nada.
// Tracking sin datos personales: agenda_view, agenda_step {step, field}, agenda_booked.

const CAL_LINK = "manuel-casaubon-dct8hc/sesion-estrategica";
const CAL_NS = "sesion";

type Campo = "name" | "email" | "whatsapp" | "instagram" | "a-que-te-dedicas" | "que-queres-lograr";
type Pregunta = { campo: Campo; pregunta: string; ayuda?: string; tipo: "text" | "email" | "tel" | "area"; placeholder?: string; auto?: string };

const PREGUNTAS: Pregunta[] = [
  { campo: "name", pregunta: "¿Cómo te llamás?", ayuda: "Nombre y apellido.", tipo: "text", placeholder: "Ana Pérez", auto: "name" },
  { campo: "email", pregunta: "¿A qué mail te mando la confirmación?", tipo: "email", placeholder: "ana@mail.com", auto: "email" },
  { campo: "whatsapp", pregunta: "¿Cuál es tu WhatsApp?", ayuda: "Con código de área. Si no es de Argentina, con + y el código del país.", tipo: "tel", placeholder: "11 2345 6789", auto: "tel" },
  { campo: "instagram", pregunta: "¿Cuál es el Instagram o la web de tu marca?", tipo: "text", placeholder: "@tuusuario o tuweb.com" },
  { campo: "a-que-te-dedicas", pregunta: "¿A qué te dedicás?", tipo: "text", placeholder: "Soy nutricionista, abogada, coach…" },
  { campo: "que-queres-lograr", pregunta: "¿Qué querés lograr con tu marca personal en los próximos 6 meses?", tipo: "area" },
];

// WhatsApp en formato internacional (+549…): en Cal.com el campo es de teléfono y llega bloqueado al prellenarse.
export function normalizarWhatsapp(entrada: string): string | null {
  const t = entrada.trim();
  let d = t.replace(/\D/g, "");
  if (t.startsWith("+")) return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  if (d.startsWith("00")) { d = d.slice(2); return d.length >= 8 && d.length <= 15 ? `+${d}` : null; }
  if (d.startsWith("54")) { d = d.slice(2); if (d.startsWith("9")) d = d.slice(1); }
  if (d.startsWith("0")) d = d.slice(1);
  // "11 15 2345 6789": el 15 después del código de área (2 a 4 dígitos) sobra.
  if (d.length === 12) {
    for (const area of [2, 3, 4]) if (d.slice(area, area + 2) === "15") { d = d.slice(0, area) + d.slice(area + 2); break; }
  }
  return d.length === 10 ? `+549${d}` : null;
}

function validar(p: Pregunta, v: string): string | null {
  const x = v.trim();
  if (!x) return "Completalo para seguir.";
  if (p.campo === "name" && x.length < 3) return "Escribí tu nombre y apellido.";
  if (p.campo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x)) return "Revisá el mail: parece que le falta algo.";
  if (p.campo === "whatsapp" && !normalizarWhatsapp(x)) return "Escribilo con código de área (por ejemplo, 11 2345 6789), o con + y el código del país.";
  if (x.length > 500) return "Es muy largo: resumilo en menos de 500 caracteres.";
  return null;
}

function leerCookie(nombre: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

type CalApi = ((...args: unknown[]) => void) & { ns: Record<string, (...args: unknown[]) => void>; loaded?: boolean; q?: unknown[] };

// Loader oficial del embed de Cal.com (app.cal.com/embed/embed.js), escrito en TypeScript.
function cargarCal(): CalApi {
  const w = window as unknown as { Cal?: CalApi };
  if (!w.Cal) {
    const empujar = (a: { q: unknown[] }, args: unknown) => { a.q.push(args); };
    const cal = function (this: unknown, ...args: unknown[]) {
      const c = w.Cal!;
      if (!c.loaded) {
        c.ns = {}; c.q = c.q || [];
        const sc = document.createElement("script");
        sc.src = "https://app.cal.com/embed/embed.js"; sc.async = true;
        document.head.appendChild(sc);
        c.loaded = true;
      }
      if (args[0] === "init") {
        const api = function (...a: unknown[]) { empujar(api as unknown as { q: unknown[] }, a); } as unknown as { q: unknown[] };
        api.q = api.q || [];
        const ns = args[1];
        if (typeof ns === "string") {
          c.ns[ns] = c.ns[ns] || (api as unknown as (...x: unknown[]) => void);
          empujar(c.ns[ns] as unknown as { q: unknown[] }, args);
          empujar(c as unknown as { q: unknown[] }, ["initNamespace", ns]);
        } else empujar(c as unknown as { q: unknown[] }, args);
        return;
      }
      empujar(c as unknown as { q: unknown[] }, args);
    } as unknown as CalApi;
    w.Cal = cal;
  }
  return w.Cal;
}

export default function Agenda() {
  const raiz = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [paso, setPaso] = useState(0);
  const [resp, setResp] = useState<Record<Campo, string>>({ name: "", email: "", whatsapp: "", instagram: "", "a-que-te-dedicas": "", "que-queres-lograr": "" });
  const [error, setError] = useState<string | null>(null);
  const [reservado, setReservado] = useState(false);
  const escuchandoCal = useRef(false);
  const enCalendario = paso >= PREGUNTAS.length;

  // agenda_view una vez, cuando la agenda entra en pantalla.
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => {
      if (e.some((x) => x.isIntersecting)) { track("agenda_view"); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Foco en el campo al cambiar de pregunta (sin robar el foco al cargar la página).
  const tocado = useRef(false);
  useEffect(() => { if (tocado.current) campoRef.current?.focus(); }, [paso]);

  // Calendario de Cal.com con las respuestas prellenadas.
  useEffect(() => {
    if (!enCalendario) return;
    const Cal = cargarCal();
    Cal("init", CAL_NS, { origin: "https://app.cal.com" });
    const api = Cal.ns[CAL_NS];
    const config: Record<string, string> = {
      layout: "month_view",
      name: resp.name.trim(),
      email: resp.email.trim(),
      whatsapp: normalizarWhatsapp(resp.whatsapp) ?? "",
      instagram: resp.instagram.trim(),
      "a-que-te-dedicas": resp["a-que-te-dedicas"].trim(),
      "que-queres-lograr": resp["que-queres-lograr"].trim(),
    };
    const vid = leerCookie("vid");
    if (vid) config["metadata[vid]"] = vid;
    try {
      // El middleware guarda el JSON codificado y la cookie vuelve a codificarse: se decodifica hasta que sea JSON.
      let crudo = leerCookie("utm") ?? "{}";
      if (!crudo.startsWith("{")) crudo = decodeURIComponent(crudo);
      const utm = JSON.parse(crudo) as Record<string, string>;
      for (const [k, v] of Object.entries(utm)) if (k.startsWith("utm_") && v) config[`metadata[${k}]`] = v.slice(0, 120);
    } catch { /* sin UTM */ }
    api("inline", { elementOrSelector: "#agenda-cal", calLink: CAL_LINK, config });
    api("ui", { theme: "light", layout: "month_view", hideEventTypeDetails: false, cssVarsPerTheme: { light: { "cal-brand": "#d0443f" } } });
    if (escuchandoCal.current) return;
    escuchandoCal.current = true;
    api("on", {
      action: "bookingSuccessfulV2",
      callback: (e: { detail?: { data?: { uid?: string } } }) => {
        setReservado(true);
        track("agenda_booked");
        const uid = e?.detail?.data?.uid;
        if (uid) metaSchedule(uid);
      },
    });
  }, [enCalendario]); // eslint-disable-line react-hooks/exhaustive-deps

  const seguir = () => {
    const p = PREGUNTAS[paso];
    const err = validar(p, resp[p.campo]);
    setError(err);
    if (err) return;
    tocado.current = true;
    track("agenda_step", { step: paso + 1, field: p.campo });
    setPaso(paso + 1);
  };
  const volver = () => { tocado.current = true; setError(null); setPaso(Math.max(0, paso - 1)); };

  return (
    <div ref={raiz} className={s.agenda}>
      {!enCalendario ? (
        <form className={s.tarjeta} onSubmit={(e) => { e.preventDefault(); seguir(); }} noValidate>
          <div className={s.progreso}>
            <span>Pregunta {paso + 1} de {PREGUNTAS.length}</span>
            <span>Después elegís día y horario</span>
          </div>
          <div className={s.barra} aria-hidden="true"><i style={{ width: `${(paso / PREGUNTAS.length) * 100}%` }} /></div>
          <label htmlFor="agenda-campo" className={s.pregunta}>{PREGUNTAS[paso].pregunta}</label>
          {PREGUNTAS[paso].ayuda && <p className={s.ayuda} id="agenda-ayuda">{PREGUNTAS[paso].ayuda}</p>}
          {PREGUNTAS[paso].tipo === "area" ? (
            <textarea
              id="agenda-campo" ref={campoRef} className={s.campo} maxLength={500}
              value={resp[PREGUNTAS[paso].campo]} placeholder={PREGUNTAS[paso].placeholder}
              aria-invalid={!!error} aria-describedby={error ? "agenda-error" : undefined}
              onChange={(e) => setResp({ ...resp, [PREGUNTAS[paso].campo]: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); seguir(); } }}
            />
          ) : (
            <input
              id="agenda-campo" ref={campoRef} className={s.campo} maxLength={200}
              type={PREGUNTAS[paso].tipo} inputMode={PREGUNTAS[paso].tipo === "tel" ? "tel" : PREGUNTAS[paso].tipo === "email" ? "email" : undefined}
              autoComplete={PREGUNTAS[paso].auto ?? "off"} value={resp[PREGUNTAS[paso].campo]} placeholder={PREGUNTAS[paso].placeholder}
              aria-invalid={!!error} aria-describedby={[PREGUNTAS[paso].ayuda ? "agenda-ayuda" : "", error ? "agenda-error" : ""].join(" ").trim() || undefined}
              onChange={(e) => setResp({ ...resp, [PREGUNTAS[paso].campo]: e.target.value })}
            />
          )}
          {error && <p className={s.error} id="agenda-error" role="alert">{error}</p>}
          <div className={s.acciones}>
            <button type="submit" className={s.boton}>{paso === PREGUNTAS.length - 1 ? "Elegir día y horario" : "Seguir"}</button>
            {paso > 0 && <button type="button" className={s.volver} onClick={volver}>Volver</button>}
            <span className={s.tecla}>{PREGUNTAS[paso].tipo === "area" ? "o Ctrl + Enter" : "o Enter"}</span>
          </div>
        </form>
      ) : (
        <div className={s.listo}>
          {reservado ? (
            <p className={s.pregunta}>¡Listo! Te llega la confirmación por mail con el link de Google Meet.</p>
          ) : (
            <>
              <p className={s.pregunta}>Elegí el día y el horario</p>
              <p className={s.resumen}>
                Ya cargamos tus respuestas. <button type="button" className={s.volver} onClick={() => setPaso(PREGUNTAS.length - 1)}>Cambiar algo</button>
              </p>
            </>
          )}
          <div id="agenda-cal" className={s.cal} />
        </div>
      )}
    </div>
  );
}
