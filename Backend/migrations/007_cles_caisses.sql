-- Migration : une clé par caisse du spawn (CrazyCrates), à la place de l'ancienne « Clé de caisse » unique (elle visait
-- l'ancien plugin de caisses). Prix calés sur l'économie du serveur : guerre 100, dragon 250, royale 500 écus.
UPDATE products SET active = 0 WHERE slug = 'cle-caisse';

INSERT IGNORE INTO products (slug, name, description, category, price_ecus, command_template, active, sort_order, one_time, upgrade_from) VALUES
  ('cle-guerre', 'Clé de guerre', 'Ouvre la Caisse de guerre au spawn : argent, équipement de combat, bâton de vente.', 'kits', 100, 'crazycrates give physical guerre 1 {joueur}', 1, 50, 0, NULL),
  ('cle-dragon', 'Clé du dragon', 'Ouvre la Caisse du dragon au spawn : argent, diamants, netherite, spawners rares.', 'kits', 250, 'crazycrates give physical dragon 1 {joueur}', 1, 51, 0, NULL),
  ('cle-royale', 'Clé royale', 'Ouvre la Caisse royale au spawn : gros lots, bâton de vente x1,5, spawners rares.', 'kits', 500, 'crazycrates give physical royale 1 {joueur}', 1, 52, 0, NULL);
