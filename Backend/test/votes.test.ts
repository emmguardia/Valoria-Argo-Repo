import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.VOTE_SP_TOKEN = 'sp-token';
process.env.VOTE_TS_TOKEN = 'ts-token';
process.env.VOTE_SMO_SERVER_ID = '7830';
process.env.VOTE_LSM_SERVER_ID = '209105';
const { checkVote, isIpCheckedSite, isKnownSite } = await import('../src/services/voteSiteAdapters.js');

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

/** Remplace fetch : chaque appel répond avec ce statut et ce texte, et l'URL appelée est notée. */
function answer(status: number, body: string) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    calls.push(String(url));
    return new Response(body, { status });
  }) as typeof fetch;
  return calls;
}

const input = { mcUsername: 'Nanozo', ip: '1.2.3.4' };

test('isKnownSite refuse les clés héritées d\'Object', () => {
  assert.equal(isKnownSite('top-serveurs'), true);
  assert.equal(isKnownSite('constructor'), false);
  assert.equal(isKnownSite('toString'), false);
});

test('seuls ServeursMinecraft et Liste-Serveurs-Minecraft sont vérifiés par IP', () => {
  assert.equal(isIpCheckedSite('serveursminecraft'), true);
  assert.equal(isIpCheckedSite('liste-serveurs-minecraft'), true);
  assert.equal(isIpCheckedSite('serveur-prive'), false);
});

test('Serveur-Privé : vote trouvé, avec son heure', async () => {
  const calls = answer(200, JSON.stringify({ success: true, data: { voted_at: 1700000000 } }));
  const result = await checkVote('serveur-prive', input);
  assert.equal(result.ok, true);
  assert.equal(result.votedAt?.getTime(), 1700000000 * 1000);
  assert.match(calls[0], /servers\/sp-token\/votes\/Nanozo\?type=username/);
});

test('Serveur-Privé : 404 = pas de vote', async () => {
  answer(404, JSON.stringify({ success: false, message: 'User not voted.' }));
  assert.deepEqual(await checkVote('serveur-prive', input), { ok: false, reason: 'not_voted' });
});

test('Top-Serveurs : claimed 1 compte, 2 est déjà réclamé, 0 introuvable', async () => {
  answer(200, '{"code":200,"success":true,"claimed":1}');
  assert.equal((await checkVote('top-serveurs', input)).ok, true);
  answer(200, '{"code":200,"success":true,"claimed":2}');
  assert.deepEqual(await checkVote('top-serveurs', input), { ok: false, reason: 'already_claimed' });
  answer(200, '{"code":200,"success":true,"claimed":0}');
  assert.deepEqual(await checkVote('top-serveurs', input), { ok: false, reason: 'not_voted' });
});

test('ServeursMinecraft : « true » = peut encore voter, une page d\'erreur ne passe pas pour un vote', async () => {
  answer(200, 'true');
  assert.equal((await checkVote('serveursminecraft', input)).ok, false);
  answer(200, 'false');
  assert.equal((await checkVote('serveursminecraft', input)).ok, true);
  answer(500, '<html>erreur</html>');
  assert.equal((await checkVote('serveursminecraft', input)).ok, false);
});

test('Liste-Serveurs-Minecraft : « 1 » dans les 180 dernières minutes', async () => {
  const calls = answer(200, '1');
  assert.equal((await checkVote('liste-serveurs-minecraft', input)).ok, true);
  assert.match(calls[0], /server_id=209105&ip=1\.2\.3\.4&duration=180/);
  answer(200, '0');
  assert.equal((await checkVote('liste-serveurs-minecraft', input)).ok, false);
});

test('API injoignable : refus propre, pas d\'exception', async () => {
  globalThis.fetch = (async () => { throw new Error('réseau coupé'); }) as typeof fetch;
  const result = await checkVote('top-serveurs', input);
  assert.equal(result.ok, false);
  assert.match(result.reason ?? '', /^api_error/);
});
