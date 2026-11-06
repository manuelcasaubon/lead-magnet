"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { track } from "@/lib/track/cliente";
import { metaLead } from "@/components/track/MetaPixel";
import { CONSENT_TEXT, LIMITES, MENSAJES, validar, type Campo, type CodigoError } from "./reglas";
import s from "./FormularioReserva.module.css";

export type Variante = "un-paso" | "dos-pasos";

type Props = {
  variante: Variante;
  /** Link de "Mandame TALLER" (EVENTO.instagramDm). */
  instagramUrl: string;
  /** Lo encadena S3 con el pago. Si no está, se muestra "¡Listo! Te escribimos con el link de pago". */
  onLead?: (lead: { email: string }) => void | Promise<void>;
  /** Para distinguir dónde está el formulario en el tracking (p. ej. "hero", "final"). */
  lugar?: string;
  /** Se muestra debajo del error si /api/lead falla (S1: link directo al pago para no perder la venta). */
  alFallar?: ReactNode;
};

type Valores = Record<Exclude<Campo, "consentimiento">, string> & { consentimiento: boolean; website: string };
type Errores = Partial<Record<Campo, CodigoError>>;
type Estado = "editando" | "enviando" | "listo" | "error_servidor";

const VACIO: Valores = { email: "", nombre: "", telefono: "", marca: "", objetivo: "", consentimiento: false, website: "" };

// Campos de cada pantalla, en orden. Los obligatorios llevan true.
const PANTALLAS: Record<Variante, [Campo, boolean][][]> = {
  "un-paso": [[["nombre", true], ["email", true], ["telefono", false], ["marca", false]]],
  "dos-pasos": [[["email", true]], [["nombre", true], ["marca", false], ["objetivo", false]]],
};

const SERVIDOR: Record<string, string> = {
  rate_limited: "Hubo varios intentos seguidos. Esperá un minuto y probá de nuevo.",
  server_error: "No pudimos guardar tus datos. Probá de nuevo en un rato.",
  red: "No hay conexión. Revisá internet y probá de nuevo.",
};

export default function FormularioReserva({ variante, instagramUrl, onLead, lugar = "pagina", alFallar }: Props) {
  const uid = useId();
  const id = (c: string) => `${uid}-${c}`;
  const ref = useRef<HTMLFormElement>(null);
  const empezo = useRef(false);
  const [v, setV] = useState<Valores>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [paso, setPaso] = useState(0);
  const [estado, setEstado] = useState<Estado>("editando");
  const [errorServidor, setErrorServidor] = useState("");

  const pantallas = PANTALLAS[variante];
  const ultimo = paso === pantallas.length - 1;
  const base = { form: "reserva", variant: variante, place: lugar };

  // form_view: una vez, cuando al menos la mitad del formulario está en pantalla.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { track("form_view", base); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variante, lugar]);

  const obligatorio = (c: Campo) => pantallas[paso].some(([k, o]) => k === c && o);

  function onFocus(e: FocusEvent<HTMLElement>) {
    const campo = e.currentTarget.dataset.campo as Campo | undefined;
    if (!campo) return;
    if (!empezo.current) { empezo.current = true; track("form_start", base); }
    track("form_field_focus", { ...base, field: campo, step: paso + 1 });
  }

  function onBlur(campo: Campo) {
    const valor = campo === "consentimiento" ? "" : v[campo];
    const err = campo === "consentimiento" ? null : validar(campo, valor, obligatorio(campo));
    // Solo si está completo y si es válido. Nunca el valor.
    track("form_field_blur", {
      ...base, field: campo, step: paso + 1,
      filled: campo === "consentimiento" ? v.consentimiento : valor.trim().length > 0,
      valid: err === null,
    });
    if (valor.trim() || err === "required") {
      setErrores((x) => ({ ...x, [campo]: err ?? undefined }));
      if (err && valor.trim()) track("form_error", { ...base, field: campo, code: err, step: paso + 1 });
    }
  }

  function cambiar(campo: keyof Valores, valor: string | boolean) {
    setV((x) => ({ ...x, [campo]: valor }));
    // Si ya había error, se revalida mientras escribe para que desaparezca apenas se corrige.
    if (campo !== "website" && campo !== "consentimiento" && errores[campo as Campo]) {
      const err = validar(campo as Campo, String(valor), obligatorio(campo as Campo));
      setErrores((x) => ({ ...x, [campo]: err ?? undefined }));
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;
    setErrorServidor("");

    const nuevos: Errores = {};
    for (const [c, oblig] of pantallas[paso]) {
      const err = validar(c, v[c as Exclude<Campo, "consentimiento">], oblig);
      if (err) nuevos[c] = err;
    }
    setErrores(nuevos);
    const conError = Object.keys(nuevos) as Campo[];
    if (conError.length) {
      for (const c of conError) track("form_error", { ...base, field: c, code: nuevos[c]!, step: paso + 1, on_submit: true });
      document.getElementById(id(conError[0]))?.focus();
      return;
    }

    const pasoApi = ultimo ? "final" : "mail";
    track("form_submit", { ...base, step: paso + 1, final: ultimo, consent: v.consentimiento });
    setEstado("enviando");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paso: pasoApi, variante, email: v.email, nombre: v.nombre, telefono: v.telefono,
          marca: v.marca, objetivo: v.objetivo, consentimiento: v.consentimiento, website: v.website,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; field?: Campo; metaEventId?: string };
      if (!json.ok) {
        if (json.field && json.code) {
          setErrores({ [json.field]: json.code as CodigoError });
          track("form_error", { ...base, field: json.field, code: json.code, step: paso + 1, server: true });
          setEstado("editando");
          // Si el error es de un campo del paso 1 (el mail), se vuelve ahí.
          const enPaso = pantallas.findIndex((p) => p.some(([k]) => k === json.field));
          if (enPaso >= 0) setPaso(enPaso);
          setTimeout(() => document.getElementById(id(json.field!))?.focus(), 0);
          return;
        }
        throw new Error(json.code || "server_error");
      }
      if (!ultimo) {
        setPaso(paso + 1);
        setEstado("editando");
        setTimeout(() => document.getElementById(id(pantallas[paso + 1][0][0]))?.focus(), 0);
        return;
      }
      // Lead al pixel con el mismo eventID que el servidor mandó por la Conversions API (Meta lo cuenta una vez).
      if (json.metaEventId) metaLead(json.metaEventId);
      if (onLead) await onLead({ email: v.email.trim().toLowerCase() });
      setEstado("listo");
    } catch (err) {
      const code = err instanceof TypeError ? "red" : (err as Error).message;
      track("form_error", { ...base, field: "servidor", code, step: paso + 1 });
      setErrorServidor(SERVIDOR[code] ?? SERVIDOR.server_error);
      setEstado("error_servidor");
    }
  }

  if (estado === "listo" && !onLead) {
    return (
      <div className={s.listo} role="status">
        <p className={s.listoTitulo}>¡Listo!</p>
        <p>Te escribimos con el link de pago.</p>
      </div>
    );
  }

  const campo = (c: Campo, oblig: boolean) => {
    const err = errores[c];
    const errId = id(`${c}-error`);
    const ayudaId = id(`${c}-ayuda`);
    const comunes = {
      id: id(c),
      "data-campo": c,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": [AYUDAS[c] ? ayudaId : "", err ? errId : ""].filter(Boolean).join(" ") || undefined,
      onFocus,
      onBlur: () => onBlur(c),
      className: s.input,
    };
    const valor = v[c as Exclude<Campo, "consentimiento">];
    return (
      <div className={s.campo} key={c}>
        <label htmlFor={id(c)} className={s.label}>
          {ETIQUETAS[c]} {!oblig && <span className={s.opcional}>(opcional)</span>}
        </label>
        {AYUDAS[c] && <p id={ayudaId} className={s.ayuda}>{AYUDAS[c]}</p>}
        {c === "objetivo" ? (
          <textarea {...comunes} rows={3} maxLength={LIMITES.objetivo + 50} value={valor}
            onChange={(e) => cambiar(c, e.target.value)} />
        ) : (
          <input {...comunes} {...ATRIBUTOS[c]} required={oblig} aria-required={oblig || undefined} value={valor}
            onChange={(e) => cambiar(c, e.target.value)} />
        )}
        <p id={errId} className={s.error} aria-live="polite">
          {err ? MENSAJES[c][err] : ""}
        </p>
      </div>
    );
  };

  const enviando = estado === "enviando";
  return (
    <form ref={ref} className={s.form} onSubmit={enviar} noValidate aria-busy={enviando}
      data-variante={variante} aria-labelledby={id("titulo")}>
      <h2 id={id("titulo")} className={s.srOnly}>Reservá tu lugar</h2>
      {pantallas.length > 1 && (
        <div className={s.pasos}>
          <p aria-live="polite">Paso {paso + 1} de {pantallas.length}</p>
          <div className={s.barra} aria-hidden="true"><span style={{ width: `${((paso + 1) / pantallas.length) * 100}%` }} /></div>
        </div>
      )}

      {paso > 0 && (
        <p className={s.resumen}>
          Mail: <strong>{v.email}</strong>{" "}
          <button type="button" className={s.cambiar} onClick={() => { setPaso(0); setEstado("editando"); }}>Cambiar</button>
        </p>
      )}

      {pantallas[paso].map(([c, oblig]) => campo(c, oblig))}

      {/* Trampa para bots: oculta para personas y lectores de pantalla. */}
      <div className={s.trampa} aria-hidden="true">
        <label htmlFor={id("website")}>No completar</label>
        <input id={id("website")} name="website" tabIndex={-1} autoComplete="off" value={v.website}
          onChange={(e) => cambiar("website", e.target.value)} />
      </div>

      {ultimo && (
        <div className={s.check}>
          <input type="checkbox" id={id("consentimiento")} data-campo="consentimiento" checked={v.consentimiento}
            onChange={(e) => cambiar("consentimiento", e.target.checked)} onFocus={onFocus} onBlur={() => onBlur("consentimiento")} />
          <label htmlFor={id("consentimiento")}>{CONSENT_TEXT}</label>
        </div>
      )}

      <button type="submit" className={s.boton} disabled={enviando}>
        {enviando ? "Guardando…" : ultimo ? (variante === "dos-pasos" ? "Ir a pagar" : "Reservar mi lugar") : "Seguir"}
      </button>

      <p className={s.errorServidor} role="alert">{errorServidor}</p>
      {estado === "error_servidor" && alFallar}

      <p className={s.ig}>
        ¿Preferís por Instagram?{" "}
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => track("instagram_click", { place: `formulario_${lugar}`, variant: variante })}>
          Mandame TALLER
        </a>
      </p>
    </form>
  );
}

const ETIQUETAS: Record<Campo, string> = {
  email: "Mail",
  nombre: "Nombre",
  telefono: "WhatsApp",
  marca: "Instagram o web de tu marca",
  objetivo: "¿Qué te gustaría resolver en la clase?",
  consentimiento: "",
};

const AYUDAS: Partial<Record<Campo, string>> = {
  marca: "Para tu auditoría.",
  telefono: "Por si hay un cambio de último momento.",
};

const ATRIBUTOS: Partial<Record<Campo, Record<string, string | number>>> = {
  email: { type: "email", name: "email", autoComplete: "email", inputMode: "email", maxLength: LIMITES.email, autoCapitalize: "none", spellCheck: "false" },
  nombre: { type: "text", name: "name", autoComplete: "name", maxLength: LIMITES.nombre },
  telefono: { type: "tel", name: "tel", autoComplete: "tel", inputMode: "tel", maxLength: LIMITES.telefono, placeholder: "+54 9 11 1234 5678" },
  marca: { type: "text", name: "marca", autoComplete: "url", inputMode: "url", maxLength: LIMITES.marca, autoCapitalize: "none", spellCheck: "false", placeholder: "@tuusuario o tuweb.com" },
};
