import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceFor } from '../src/services/shopService.js';
import type { Ownership } from '../src/services/shopService.js';

const own = (owned: string[] = [], surpassed: string[] = []): Ownership => ({ owned: new Set(owned), surpassed: new Set(surpassed) });
const prices = new Map([['vip', 500], ['vip-plus', 1200]]);
const vip = { slug: 'vip', price_ecus: 500, one_time: 1, upgrade_from: null };
const vipPlus = { slug: 'vip-plus', price_ecus: 1200, one_time: 1, upgrade_from: 'vip' };
const key = { slug: 'cle-dragon', price_ecus: 250, one_time: 0, upgrade_from: null };

test('prix plein sans rien posséder', () => {
  assert.deepEqual(priceFor(vipPlus, own(), prices), { price: 1200, owned: false, upgrade: false });
});

test('montée en gamme : seule la différence est due', () => {
  assert.deepEqual(priceFor(vipPlus, own(['vip']), prices), { price: 700, owned: false, upgrade: true });
});

test('un produit unique déjà acheté est possédé', () => {
  assert.equal(priceFor(vip, own(['vip']), prices).owned, true);
});

test('avoir le VIP+ compte comme avoir le VIP', () => {
  assert.equal(priceFor(vip, own(['vip-plus'], ['vip']), prices).owned, true);
});

test('un produit rachetable ne devient jamais « possédé »', () => {
  assert.equal(priceFor(key, own(['cle-dragon']), prices).owned, false);
});
