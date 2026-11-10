-- Migration : statistiques anonymes du site et du serveur Minecraft (page admin « Statistiques »), après 004.
--
-- Site : aucun cookie, aucune IP ni identifiant stocké. Un visiteur du jour est une empreinte
-- SHA-256(sel du jour + IP + navigateur) ; le sel est tiré au hasard chaque jour et effacé le lendemain avec les
-- empreintes : on ne peut plus jamais relier une visite à quelqu'un. Seuls restent des compteurs par jour.
-- Serveur : les joueurs sont des empreintes calculées sur la VM avec une clé que le site ne connaît pas.

-- Sel du jour (une ligne par jour, celle de la veille est effacée)
CREATE TABLE IF NOT EXISTS stats_salts (
  day DATE PRIMARY KEY,
  salt CHAR(64) NOT NULL
);

-- Empreintes des visiteurs du jour seulement (effacées le lendemain)
CREATE TABLE IF NOT EXISTS stats_site_visitors (
  day DATE NOT NULL,
  visitor CHAR(64) NOT NULL,
  PRIMARY KEY (day, visitor)
);

-- Compteurs du site par jour : dimension = total, page, provenance, appareil, navigateur, systeme, pays
CREATE TABLE IF NOT EXISTS stats_site_daily (
  day DATE NOT NULL,
  dimension VARCHAR(20) NOT NULL,
  value VARCHAR(200) NOT NULL,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  visitors INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, dimension, value)
);

-- Mesures du serveur Minecraft, une ligne par minute (gardées 180 jours)
CREATE TABLE IF NOT EXISTS stats_server_minutes (
  at DATETIME NOT NULL PRIMARY KEY,
  online SMALLINT UNSIGNED NOT NULL,
  tps DECIMAL(4,2) NOT NULL,
  mspt DECIMAL(6,2) NOT NULL,
  memory_used_mb INT UNSIGNED NOT NULL,
  memory_max_mb INT UNSIGNED NOT NULL,
  cpu_percent DECIMAL(5,2) NULL,
  chunks INT UNSIGNED NOT NULL,
  entities INT UNSIGNED NOT NULL
);

-- Joueurs vus par jour (empreinte) : joueurs uniques, nouveaux joueurs, temps de jeu
CREATE TABLE IF NOT EXISTS stats_server_players (
  day DATE NOT NULL,
  player CHAR(64) NOT NULL,
  first_join TINYINT(1) NOT NULL DEFAULT 0,
  sessions SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  playtime_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, player)
);

-- Compteurs de jeu par jour : morts, kills PvP, monstres tués, blocs cassés et posés, messages, votes…
CREATE TABLE IF NOT EXISTS stats_server_daily (
  day DATE NOT NULL,
  counter VARCHAR(40) NOT NULL,
  value BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (day, counter)
);

-- Photo de l'état du jeu (factions, nations, sièges…), au plus une par heure
CREATE TABLE IF NOT EXISTS stats_server_snapshots (
  at DATETIME NOT NULL PRIMARY KEY,
  data JSON NOT NULL
);
