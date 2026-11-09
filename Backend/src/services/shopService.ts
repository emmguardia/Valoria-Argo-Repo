import { randomInt } from 'node:crypto';
import type { PoolConnection } from 'mysql2/promise';
import { getDbPool } from '../db/mysql.js';
import { enqueueCommand, isMcName, isMcUuid } from './serverQueueService.js';

// Boutique : achat d'un produit en Écus, depuis le site ou en jeu (même code, même règles).
// Dans une seule transaction : solde vérifié et débité, ligne au registre des Écus, achat enregistré,
// commande mise en file pour le serveur Minecraft. Chaque étape laisse une trace en base et dans les logs.

export class ShopError extends Error {
  constructor(public code: string, message: string, public status = 409) { super(message); }
}

type Origin = 'site' | 'jeu';

function log(entry: Record<string, unknown>) {
  console.log(JSON.stringify({ evt: 'boutique', ...entry, ts: new Date().toISOString() }));
}

/** Écrit un mouvement d'Écus au registre (dans la transaction de l'opération). */
export async function writeLedger(conn: PoolConnection, entry: {
  userId: number; delta: number; balanceAfter: number; reason: string; origin: string;
  refType?: string; refId?: string; detail?: string;
}) {
  await conn.execute(
    `INSERT INTO ecus_ledger (user_id, delta, balance_after, reason, origin, ref_type, ref_id, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.userId, entry.delta, entry.balanceAfter, entry.reason, entry.origin,
      entry.refType ?? null, entry.refId ?? null, entry.detail ? entry.detail.slice(0, 500) : null]
  );
}

function fillCommand(template: string, uuid: string) {
  // {joueur} reste tel quel : le plugin met le pseudo actuel au moment de l'exécution
  return template.replace(/\{uuid\}/g, uuid);
}

/** Prix à payer pour ce joueur : un produit « montée en gamme » ne coûte que la différence s'il a déjà le précédent. */
async function priceFor(conn: PoolConnection, userId: number, product: any): Promise<{ price: number; owned: boolean; upgrade: boolean }> {
  const owns = async (slug: string) => {
    const [rows] = await conn.execute('SELECT 1 FROM product_purchases WHERE user_id = ? AND product_slug = ? LIMIT 1', [userId, slug]);
    return Array.isArray(rows) && rows.length > 0;
  };
  // Déjà possédé : le produit lui-même, ou mieux (avoir le VIP+ compte comme avoir le VIP)
  let owned = Boolean(product.one_time) && await owns(String(product.slug));
  if (Boolean(product.one_time) && !owned) {
    const [better] = await conn.execute(
      `SELECT 1 FROM product_purchases pp JOIN products p ON p.slug = pp.product_slug
       WHERE pp.user_id = ? AND p.upgrade_from = ? LIMIT 1`, [userId, product.slug]);
    owned = Array.isArray(better) && better.length > 0;
  }
  if (product.upgrade_from && await owns(String(product.upgrade_from))) {
    const [rows] = await conn.execute('SELECT price_ecus FROM products WHERE slug = ? LIMIT 1', [product.upgrade_from]);
    const base = Array.isArray(rows) && rows.length > 0 ? Number((rows[0] as any).price_ecus) : 0;
    return { price: Math.max(0, Number(product.price_ecus) - base), owned, upgrade: true };
  }
  return { price: Number(product.price_ecus), owned, upgrade: false };
}

export type PurchaseResult = { purchaseId: number; commandId: number; price: number; balance: number; duplicated: boolean };

export async function purchaseProduct(input: {
  userId: number;
  productSlug: string;
  requestId: string;
  origin: Origin;
}): Promise<PurchaseResult> {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(input.requestId)) throw new ShopError('requete_invalide', 'Identifiant de requête invalide', 400);
  const db = await getDbPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Même requête rejouée (double clic, réseau coupé puis renvoi) : on renvoie le premier résultat sans repayer
    const [dup] = await conn.execute(
      'SELECT id, server_command_id, price_ecus FROM product_purchases WHERE request_id = ? LIMIT 1', [input.requestId]);
    if (Array.isArray(dup) && dup.length > 0) {
      const d = dup[0] as any;
      const [u] = await conn.execute('SELECT ecus FROM users WHERE id = ?', [input.userId]);
      await conn.rollback();
      log({ etape: 'achat-rejoue', requestId: input.requestId, purchaseId: Number(d.id) });
      return { purchaseId: Number(d.id), commandId: Number(d.server_command_id), price: Number(d.price_ecus),
        balance: Number((u as any[])[0]?.ecus ?? 0), duplicated: true };
    }
    const [users] = await conn.execute(
      'SELECT id, pseudo, ecus, mc_uuid FROM users WHERE id = ? FOR UPDATE', [input.userId]);
    const user = Array.isArray(users) ? (users[0] as any) : null;
    if (!user) throw new ShopError('compte_introuvable', 'Compte introuvable', 404);
    if (!user.mc_uuid || !isMcUuid(user.mc_uuid) || !isMcName(user.pseudo)) {
      throw new ShopError('compte_non_lie', 'Lie d\'abord ton compte au jeu : code sur ton profil, puis /lier <code> en jeu');
    }
    const [products] = await conn.execute(
      'SELECT id, slug, name, price_ecus, command_template, active, one_time, upgrade_from FROM products WHERE slug = ? LIMIT 1',
      [input.productSlug]);
    const product = Array.isArray(products) ? (products[0] as any) : null;
    if (!product || !product.active) throw new ShopError('produit_indisponible', 'Ce produit n\'est pas en vente', 404);
    const { price, owned, upgrade } = await priceFor(conn, Number(user.id), product);
    if (owned) throw new ShopError('deja_possede', `Tu as déjà ${product.name}`);
    const balance = Number(user.ecus ?? 0);
    if (balance < price) throw new ShopError('ecus_insuffisants', `Il te manque ${price - balance} Écus`);

    const next = balance - price;
    await conn.execute('UPDATE users SET ecus = ? WHERE id = ?', [next, user.id]);
    const [ins] = await conn.execute(
      `INSERT INTO product_purchases (request_id, user_id, mc_uuid, mc_username, product_id, product_slug, product_name, price_ecus, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.requestId, user.id, user.mc_uuid, user.pseudo, product.id, product.slug, product.name, price, input.origin]);
    const purchaseId = Number((ins as any).insertId);
    await writeLedger(conn, {
      userId: Number(user.id), delta: -price, balanceAfter: next, reason: 'achat_produit', origin: input.origin,
      refType: 'product_purchase', refId: String(purchaseId),
      detail: `${product.name}${upgrade ? ' (montée en gamme)' : ''}`,
    });
    const commandId = await enqueueCommand(conn, {
      command: fillCommand(String(product.command_template), String(user.mc_uuid)),
      uuid: String(user.mc_uuid), name: String(user.pseudo), requireOnline: true,
      source: 'achat_produit', sourceId: String(purchaseId),
    });
    await conn.execute('UPDATE product_purchases SET server_command_id = ? WHERE id = ?', [commandId, purchaseId]);
    await conn.commit();
    log({ etape: 'achat', origin: input.origin, userId: Number(user.id), joueur: user.pseudo, produit: product.slug,
      prix: price, solde: next, purchaseId, commandId, requestId: input.requestId });
    return { purchaseId, commandId, price, balance: next, duplicated: false };
  } catch (error) {
    await conn.rollback();
    if (error instanceof ShopError) {
      log({ etape: 'achat-refuse', origin: input.origin, userId: input.userId, produit: input.productSlug, raison: error.code });
    }
    throw error;
  } finally {
    conn.release();
  }
}

/** Code à usage unique, valable 15 minutes, à taper en jeu : /lier <code>. */
export async function createLinkCode(userId: number): Promise<{ code: string; expiresAt: Date }> {
  const db = await getDbPool();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
    try {
      await db.execute(
        `UPDATE users SET link_code = ?, link_code_expires_at = NOW() + INTERVAL 15 MINUTE WHERE id = ?`, [code, userId]);
      log({ etape: 'code-liaison', userId });
      const [rows] = await db.execute('SELECT link_code_expires_at FROM users WHERE id = ?', [userId]);
      return { code, expiresAt: new Date((rows as any[])[0].link_code_expires_at) };
    } catch (error: any) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error;
    }
  }
  throw new Error('Impossible de créer un code de liaison');
}

/**
 * /lier en jeu : le pseudo du compte doit être celui du joueur, et l'uuid ne peut être lié qu'à un seul compte.
 * Le pseudo du compte suit ensuite le joueur (mis à jour s'il change de pseudo Minecraft).
 */
export async function linkAccount(input: { code: string; uuid: string; name: string }): Promise<{ pseudo: string }> {
  if (!isMcUuid(input.uuid) || !isMcName(input.name)) throw new ShopError('joueur_invalide', 'Joueur invalide', 400);
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) throw new ShopError('code_invalide', 'Code invalide');
  const db = await getDbPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      'SELECT id, pseudo, mc_uuid FROM users WHERE link_code = ? AND link_code_expires_at > NOW() FOR UPDATE', [code]);
    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) throw new ShopError('code_invalide', 'Code inconnu ou expiré : demande-en un nouveau sur ton profil');
    if (String(user.pseudo).toLowerCase() !== input.name.toLowerCase()) {
      throw new ShopError('pseudo_different', `Ce code appartient au compte ${user.pseudo}, pas à ${input.name}`);
    }
    const [other] = await conn.execute('SELECT id FROM users WHERE mc_uuid = ? AND id <> ?', [input.uuid, user.id]);
    if (Array.isArray(other) && other.length > 0) throw new ShopError('deja_lie', 'Ce joueur est déjà lié à un autre compte');
    await conn.execute(
      `UPDATE users SET mc_uuid = ?, pseudo = ?, mc_linked_at = NOW(), link_code = NULL, link_code_expires_at = NULL WHERE id = ?`,
      [input.uuid, input.name, user.id]);
    await conn.commit();
    log({ etape: 'compte-lie', userId: Number(user.id), joueur: input.name, uuid: input.uuid });
    return { pseudo: input.name };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** Soldes des joueurs connectés (affichés en jeu). Un pseudo changé est suivi par l'uuid. */
export async function balancesFor(uuids: string[]): Promise<Record<string, number>> {
  const valid = uuids.filter(isMcUuid);
  if (valid.length === 0) return {};
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT mc_uuid, ecus FROM users WHERE mc_uuid IN (${valid.map(() => '?').join(',')})`, valid);
  const out: Record<string, number> = {};
  for (const r of rows as any[]) out[String(r.mc_uuid)] = Number(r.ecus ?? 0);
  return out;
}

export async function userIdForUuid(uuid: string): Promise<number | null> {
  if (!isMcUuid(uuid)) return null;
  const db = await getDbPool();
  const [rows] = await db.execute('SELECT id FROM users WHERE mc_uuid = ? LIMIT 1', [uuid]);
  return Array.isArray(rows) && rows.length > 0 ? Number((rows[0] as any).id) : null;
}

/** Produits en vente avec le prix pour ce joueur (montée en gamme, déjà possédé). */
export async function catalogFor(userId: number | null) {
  const db = await getDbPool();
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT id, slug, name, description, category, price_ecus, one_time, upgrade_from, image_url, is_new
       FROM products WHERE active = 1 ORDER BY sort_order ASC, id ASC`);
    const out = [];
    for (const p of rows as any[]) {
      const pricing = userId ? await priceFor(conn, userId, p) : { price: Number(p.price_ecus), owned: false, upgrade: false };
      out.push({
        slug: String(p.slug), name: String(p.name), description: p.description ?? null, category: String(p.category),
        price: pricing.price, basePrice: Number(p.price_ecus), owned: pricing.owned, upgrade: pricing.upgrade,
      });
    }
    return out;
  } finally {
    conn.release();
  }
}
