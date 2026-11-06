// Reglas del formulario, compartidas por el componente (validación en línea) y por /api/lead (zod).
// Sin dependencias, para no sumar peso a la landing.

export const CONSENT_TEXT = "Quiero recibir mails sobre la clase.";

export const LIMITES = { email: 254, nombre: 80, telefono: 24, marca: 200, objetivo: 500 } as const;

export const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
export const RE_TELEFONO = /^\+?[\d\s]{6,22}$/;
export const RE_INSTAGRAM = /^@?[A-Za-z0-9._]{1,30}$/;
export const RE_URL = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export type Campo = "email" | "nombre" | "telefono" | "marca" | "objetivo" | "consentimiento";

// Códigos de error (van al tracking como form_error.code y vuelven de /api/lead como code).
export type CodigoError = "required" | "invalid" | "too_long";

export const MENSAJES: Record<Campo, Partial<Record<CodigoError, string>>> = {
  email: { required: "Escribí tu mail.", invalid: "Revisá el mail: falta algo (por ejemplo, nombre@gmail.com).", too_long: "El mail es demasiado largo." },
  nombre: { required: "Escribí tu nombre.", too_long: "El nombre es demasiado largo." },
  telefono: { required: "Escribí tu WhatsApp.", invalid: "Usá solo números, espacios y el + del código de país.", too_long: "El número es demasiado largo." },
  marca: { required: "Escribí tu Instagram o la web de tu marca.", invalid: "Escribí tu usuario de Instagram (@tuusuario) o la dirección de tu web.", too_long: "Es demasiado largo." },
  objetivo: { too_long: "Es un poco largo: resumilo en hasta 500 caracteres." },
  consentimiento: {},
};

export function validar(campo: Campo, valor: string, obligatorio = false): CodigoError | null {
  const v = valor.trim();
  if (!v) return obligatorio ? "required" : null;
  switch (campo) {
    case "email": return v.length > LIMITES.email ? "too_long" : RE_EMAIL.test(v) ? null : "invalid";
    case "nombre": return v.length > LIMITES.nombre ? "too_long" : null;
    case "telefono": return v.length > LIMITES.telefono ? "too_long" : RE_TELEFONO.test(v) ? null : "invalid";
    case "marca": return v.length > LIMITES.marca ? "too_long" : RE_INSTAGRAM.test(v) || RE_URL.test(v) ? null : "invalid";
    case "objetivo": return v.length > LIMITES.objetivo ? "too_long" : null;
    default: return null;
  }
}

// "Instagram o web": un usuario va a instagram (sin @); una dirección, a brand_url.
export function separarMarca(valor: string): { instagram?: string; brandUrl?: string } {
  const v = valor.trim();
  if (!v) return {};
  if (RE_INSTAGRAM.test(v) && !v.includes(".")) return { instagram: v.replace(/^@/, "").toLowerCase() };
  if (RE_INSTAGRAM.test(v) && v.startsWith("@")) return { instagram: v.slice(1).toLowerCase() };
  const m = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i);
  if (m) return { instagram: m[1].toLowerCase() };
  return { brandUrl: /^https?:\/\//i.test(v) ? v : `https://${v}` };
}
