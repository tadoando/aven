/**
 * Baby Shower de Evangeline — API de invitados sobre Google Sheets.
 *
 * Se publica como "Aplicación web" (Ejecutar como: yo · Acceso: cualquier usuario).
 * La clave de anfitrión NO va en este archivo: se guarda en
 * Configuración del proyecto → Propiedades del script → ADMIN_KEY.
 *
 * Todas las peticiones son POST con cuerpo JSON enviado como text/plain
 * (así el navegador no hace preflight CORS).
 *   { action: "rsvp", name, count, website }            → público (formulario de la invitación)
 *   { action: "list",   key }                           → anfitrión
 *   { action: "put",    key, guest: {id,name,count,status,note} }
 *   { action: "remove", key, id }
 */

const SHEET_NAME = "Invitados";
const HEADERS = ["id", "nombre", "personas", "estado", "nota", "origen", "creado", "actualizado"];
const STATUSES = ["confirmado", "pendiente", "no asiste"];
const MAX_COUNT_RSVP = 5;
const MAX_COUNT_ADMIN = 20;

function doPost(e) {
  let req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (err) { return json({ ok: false, error: "bad_json" }); }

  try {
    switch (req.action) {
      case "rsvp":   return json(rsvp(req));
      case "list":   requireKey(req); return json({ ok: true, guests: readAll() });
      case "put":    requireKey(req); return json(put(req.guest));
      case "remove": requireKey(req); return json(remove(req.id));
      default:       return json({ ok: false, error: "unknown_action" });
    }
  } catch (err) {
    const code = err && err.code ? err.code : "server_error";
    if (code === "server_error") console.error(err);
    return json({ ok: false, error: code });
  }
}

function doGet() {
  return json({ ok: true, service: "invitados-evangeline" });
}

/* ---------------- Acciones ---------------- */

function rsvp(req) {
  if (req.website) return { ok: true };               // honeypot: bots llenan el campo oculto
  const name = cleanName(req.name);
  if (!name) throw fail("name_required");
  const count = clampInt(req.count, 1, MAX_COUNT_RSVP);

  return withLock(() => {
    const sh = sheet();
    const rows = readAll();
    const now = new Date().toISOString();
    const hit = rows.find(g => norm(g.name) === norm(name));
    if (hit) {
      writeRow(sh, hit._row, { ...hit, count, status: "confirmado", updatedAt: now });
    } else {
      sh.appendRow(toRow({
        id: newId(), name, count, status: "confirmado", note: "",
        source: "invitación", createdAt: now, updatedAt: now
      }));
    }
    return { ok: true };
  });
}

function put(g) {
  if (!g) throw fail("guest_required");
  const name = cleanName(g.name);
  if (!name) throw fail("name_required");
  const status = STATUSES.indexOf(g.status) >= 0 ? g.status : "pendiente";
  const count = clampInt(g.count, 1, MAX_COUNT_ADMIN);
  const note = String(g.note || "").trim().slice(0, 140);

  return withLock(() => {
    const sh = sheet();
    const now = new Date().toISOString();
    const rows = readAll();
    const hit = g.id ? rows.find(r => r.id === String(g.id)) : null;
    if (hit) {
      const next = { ...hit, name, count, status, note, updatedAt: now };
      writeRow(sh, hit._row, next);
      return { ok: true, guest: strip(next) };
    }
    const created = {
      id: /^[A-Za-z0-9_-]{4,40}$/.test(String(g.id || "")) ? String(g.id) : newId(),
      name, count, status, note, source: "anfitrión", createdAt: now, updatedAt: now
    };
    sh.appendRow(toRow(created));
    return { ok: true, guest: created };
  });
}

function remove(id) {
  if (!id) throw fail("id_required");
  return withLock(() => {
    const hit = readAll().find(r => r.id === String(id));
    if (hit) sheet().deleteRow(hit._row);
    return { ok: true };
  });
}

/* ---------------- Hoja ---------------- */

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function readAll() {
  const sh = sheet();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values
    .map((v, i) => ({
      _row: i + 2,
      id: String(v[0]),
      name: unsafe(v[1]),
      count: clampInt(v[2], 1, MAX_COUNT_ADMIN),
      status: STATUSES.indexOf(v[3]) >= 0 ? v[3] : "pendiente",
      note: unsafe(v[4]),
      source: String(v[5] || ""),
      createdAt: String(v[6] || ""),
      updatedAt: String(v[7] || "")
    }))
    .filter(g => g.id && g.name);
}

function toRow(g) {
  return [g.id, safe(g.name), g.count, g.status, safe(g.note || ""), g.source || "", g.createdAt, g.updatedAt];
}

function writeRow(sh, row, g) {
  sh.getRange(row, 1, 1, HEADERS.length).setValues([toRow(g)]);
}

/* ---------------- Utilidades ---------------- */

function requireKey(req) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expected || expected.length < 12) throw fail("admin_key_not_configured");
  const given = String(req.key || "");
  // comparación de tiempo constante
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  if (diff !== 0) throw fail("unauthorized");
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw fail("busy");
  try { return fn(); } finally { lock.releaseLock(); }
}

function cleanName(s) { return String(s || "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 60); }
function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }
function clampInt(v, min, max) { const n = parseInt(v, 10); return Math.min(max, Math.max(min, isNaN(n) ? min : n)); }
function newId() { return "g" + Utilities.getUuid().replace(/-/g, "").slice(0, 12); }
// Evita inyección de fórmulas en la hoja (=, +, -, @ al inicio).
function safe(s) { s = String(s); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
function unsafe(s) { s = String(s == null ? "" : s); return s.charAt(0) === "'" ? s.slice(1) : s; }
function strip(g) { const c = { ...g }; delete c._row; return c; }
function fail(code) { const e = new Error(code); e.code = code; return e; }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
