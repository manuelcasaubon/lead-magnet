"use client";

import { useActionState } from "react";
import { guardarPerfil, type EstadoPerfil } from "@/app/entrada/acciones";
import s from "./comprobante.module.css";

// Pedido del perfil para la auditoría personalizada (DECISIONES.md D5): se pide al pagar y se entrega impresa en la sala.
// Si ya lo mandó (o lo acaba de mandar: la acción vuelve a renderizar la página), muestra la confirmación.
export default function PerfilAuditoria({ o, sugerido, guardado }: { o: string; sugerido: string; guardado: string | null }) {
  const [estado, accion, enviando] = useActionState<EstadoPerfil, FormData>(guardarPerfil, { ok: false });

  const perfil = estado.ok ? estado.perfil : guardado;
  if (perfil) {
    return (
      <section className={s.perfil} aria-live="polite">
        <h2>¡Gracias!</h2>
        <p>Anoté <strong>{perfil}</strong> para tu auditoría. La llevo impresa el 18/11.</p>
      </section>
    );
  }

  return (
    <form className={s.perfil} action={accion}>
      <h2>Pasame tu Instagram (o web) para tu auditoría</h2>
      <p className={s.aviso}>La miro antes de la clase y te la doy impresa ese día.</p>
      <input type="hidden" name="o" value={o} />
      <label htmlFor="perfil">Tu Instagram o tu web</label>
      <input
        id="perfil" name="perfil" className={s.campo} defaultValue={sugerido} placeholder="@tuusuario o tuweb.com"
        autoComplete="url" inputMode="url" autoCapitalize="none" spellCheck={false} required minLength={2} maxLength={200}
        aria-invalid={!!estado.error} aria-describedby="perfil-error"
      />
      <p id="perfil-error" className={s.error} aria-live="polite">{estado.error ?? ""}</p>
      <button className={s.boton} type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Mandar mi perfil"}</button>
    </form>
  );
}
