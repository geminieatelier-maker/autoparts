-- ============================================================
--  AUTOPARTS ERP — schéma base de données (modules 1 à 4)
--  Idempotent : CREATE TABLE IF NOT EXISTS uniquement.
-- ============================================================

CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  nom TEXT,
  mdp_hash TEXT NOT NULL,
  role TEXT DEFAULT 'operateur',        -- admin | gestionnaire | operateur
  permissions JSONB DEFAULT '{}'::jsonb,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  id INT PRIMARY KEY DEFAULT 1,
  nom TEXT, adresse TEXT, tel TEXT, email TEXT,
  nif TEXT, stat TEXT, rcs TEXT,
  devise TEXT DEFAULT 'MGA'
);

-- ---------- Tiers ----------
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT, tel TEXT, email TEXT, adresse TEXT,
  remise NUMERIC DEFAULT 0,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fournisseurs (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  pays TEXT,
  devise TEXT DEFAULT 'MGA',
  rating INT DEFAULT 3,
  delai TEXT,
  contact TEXT, tel TEXT, email TEXT, adresse TEXT,
  conditions_paiement TEXT,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Module 1 & 2 : Commande client / Devis ----------
CREATE TABLE IF NOT EXISTS commandes_client (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  client_id INT REFERENCES clients(id),
  date_cmd DATE DEFAULT current_date,
  type TEXT DEFAULT 'Commande',         -- Commande | Devis | Proforma
  priorite TEXT DEFAULT 'Normale',      -- Normale | Urgente
  statut TEXT DEFAULT 'En cours',       -- En cours | Devis | Livré | Impayé | Annulé
  observations TEXT,
  total NUMERIC DEFAULT 0,
  utilisateur_id INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cmdcli_date ON commandes_client(date_cmd);
CREATE INDEX IF NOT EXISTS idx_cmdcli_statut ON commandes_client(statut);

CREATE TABLE IF NOT EXISTS commande_client_lignes (
  id SERIAL PRIMARY KEY,
  commande_id INT REFERENCES commandes_client(id) ON DELETE CASCADE,
  designation TEXT, reference TEXT,
  quantite NUMERIC DEFAULT 1,
  prix_unitaire NUMERIC DEFAULT 0,
  montant NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cmdcli_lignes ON commande_client_lignes(commande_id);

-- ---------- Module 3 : Comparateur (demande de prix + offres) ----------
CREATE TABLE IF NOT EXISTS cotations (
  id SERIAL PRIMARY KEY,
  designation TEXT NOT NULL,
  reference TEXT,
  quantite NUMERIC DEFAULT 1,
  statut TEXT DEFAULT 'En cours',       -- En cours | Choisi | Clôturé
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cotation_offres (
  id SERIAL PRIMARY KEY,
  cotation_id INT REFERENCES cotations(id) ON DELETE CASCADE,
  fournisseur_id INT REFERENCES fournisseurs(id),
  prix NUMERIC,
  devise TEXT,
  disponibilite TEXT,                   -- En stock | Sur commande | Rupture
  delai TEXT,
  moq NUMERIC,
  date_reception DATE,
  remarques TEXT,
  choisi BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_cot_offres ON cotation_offres(cotation_id);

-- ---------- Module 4 : Commande fournisseur ----------
CREATE TABLE IF NOT EXISTS commandes_fournisseur (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  fournisseur_id INT REFERENCES fournisseurs(id),
  date_cmd DATE DEFAULT current_date,
  devise TEXT,
  statut TEXT DEFAULT 'Préparation',    -- Préparation | En transit | Livré
  conditions_paiement TEXT,
  observations TEXT,
  total NUMERIC DEFAULT 0,
  utilisateur_id INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cmdfou_date ON commandes_fournisseur(date_cmd);

CREATE TABLE IF NOT EXISTS commande_fournisseur_lignes (
  id SERIAL PRIMARY KEY,
  commande_id INT REFERENCES commandes_fournisseur(id) ON DELETE CASCADE,
  designation TEXT, reference TEXT,
  quantite NUMERIC DEFAULT 0,
  prix_unitaire NUMERIC DEFAULT 0,
  montant NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cmdfou_lignes ON commande_fournisseur_lignes(commande_id);

-- lien commande fournisseur <-> commandes clients regroupées
CREATE TABLE IF NOT EXISTS cmd_fourn_clients (
  cmd_fournisseur_id INT REFERENCES commandes_fournisseur(id) ON DELETE CASCADE,
  commande_client_id INT REFERENCES commandes_client(id),
  PRIMARY KEY (cmd_fournisseur_id, commande_client_id)
);

-- ---------- Journal des événements ----------
CREATE TABLE IF NOT EXISTS journal (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT,
  utilisateur_nom TEXT,
  action TEXT,
  entite_type TEXT,
  entite_id INT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal(created_at);

-- ---------- Historique des connexions ----------
CREATE TABLE IF NOT EXISTS connexions (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT,
  utilisateur_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_connexions_date ON connexions(created_at);

-- ---------- Corbeille (soft delete) ----------
CREATE TABLE IF NOT EXISTS corbeille (
  id SERIAL PRIMARY KEY,
  entite_type TEXT NOT NULL,
  entite_id INT NOT NULL,
  entite_label TEXT,
  donnees JSONB NOT NULL,
  supprime_par INT,
  supprime_par_nom TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_corbeille_type ON corbeille(entite_type);
CREATE INDEX IF NOT EXISTS idx_corbeille_date ON corbeille(created_at);

-- ============================================================
--  Module 5 : Réceptions  +  Module 6 : Coût de revient
-- ============================================================

-- Frais pour le calcul du coût de revient (sur la commande fournisseur)
ALTER TABLE commandes_fournisseur ADD COLUMN IF NOT EXISTS frais_transport NUMERIC DEFAULT 0;
ALTER TABLE commandes_fournisseur ADD COLUMN IF NOT EXISTS frais_import NUMERIC DEFAULT 0;
ALTER TABLE commandes_fournisseur ADD COLUMN IF NOT EXISTS frais_autres NUMERIC DEFAULT 0;

CREATE TABLE IF NOT EXISTS receptions (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  cmd_fournisseur_id INT REFERENCES commandes_fournisseur(id),
  date_reception DATE DEFAULT current_date,
  statut TEXT DEFAULT 'En attente',   -- Complète | Partielle | En attente
  observations TEXT,
  utilisateur_id INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_receptions_date ON receptions(date_reception);

CREATE TABLE IF NOT EXISTS reception_lignes (
  id SERIAL PRIMARY KEY,
  reception_id INT REFERENCES receptions(id) ON DELETE CASCADE,
  designation TEXT, reference TEXT,
  quantite_commandee NUMERIC DEFAULT 0,
  quantite_recue NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'Reçu'          -- Reçu | Partiel | Manquant
);
CREATE INDEX IF NOT EXISTS idx_reception_lignes ON reception_lignes(reception_id);

-- ---------- Module 7 : Facturation ----------
CREATE TABLE IF NOT EXISTS factures (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  client_id INT REFERENCES clients(id),
  commande_id INT REFERENCES commandes_client(id),
  date_facture DATE DEFAULT current_date,
  total_ht NUMERIC DEFAULT 0,
  marge NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'Impayée',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_commande ON factures(commande_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);

CREATE TABLE IF NOT EXISTS facture_lignes (
  id SERIAL PRIMARY KEY,
  facture_id INT REFERENCES factures(id) ON DELETE CASCADE,
  designation TEXT,
  reference TEXT,
  quantite NUMERIC DEFAULT 0,
  prix_unitaire NUMERIC DEFAULT 0,
  cout_unitaire NUMERIC DEFAULT 0,
  montant NUMERIC DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_facture_lignes ON facture_lignes(facture_id);

-- ---------- Module 8 : Paiements ----------
CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  type TEXT,
  tiers_id INT,
  tiers_nom TEXT,
  reference_doc TEXT,
  montant NUMERIC DEFAULT 0,
  mode TEXT,
  echeance DATE,
  date_paiement DATE DEFAULT current_date,
  statut TEXT DEFAULT 'Payé',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paiements_type ON paiements(type);
CREATE INDEX IF NOT EXISTS idx_paiements_tiers ON paiements(tiers_id);
CREATE INDEX IF NOT EXISTS idx_paiements_reference ON paiements(reference_doc);
CREATE INDEX IF NOT EXISTS idx_paiements_echeance ON paiements(echeance);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);

-- ---------- Module 9 : Expéditions ----------
CREATE TABLE IF NOT EXISTS expeditions (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  client_id INT REFERENCES clients(id),
  transport TEXT DEFAULT 'Taxi-brousse',
  date_exp DATE DEFAULT current_date,
  statut TEXT DEFAULT 'Préparée',
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expeditions_client ON expeditions(client_id);
CREATE INDEX IF NOT EXISTS idx_expeditions_date ON expeditions(date_exp);
CREATE INDEX IF NOT EXISTS idx_expeditions_statut ON expeditions(statut);

CREATE TABLE IF NOT EXISTS expedition_commandes (
  expedition_id INT REFERENCES expeditions(id) ON DELETE CASCADE,
  commande_client_id INT REFERENCES commandes_client(id),
  PRIMARY KEY (expedition_id, commande_client_id)
);
CREATE INDEX IF NOT EXISTS idx_expedition_commandes_cmd ON expedition_commandes(commande_client_id);

-- ---------- Module 12 : Intelligence (Grok) ----------
ALTER TABLE config ADD COLUMN IF NOT EXISTS grok_key TEXT;
ALTER TABLE config ADD COLUMN IF NOT EXISTS grok_model TEXT DEFAULT 'grok-2-latest';

-- Ajout colonne marque sur les lignes de commande client
ALTER TABLE commande_client_lignes ADD COLUMN IF NOT EXISTS marque TEXT;

-- Numéro de colis / suivi sur les expéditions (cahier des charges point 9)
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS no_colis TEXT;

-- 2e personne de contact + 2e téléphone (clients & fournisseurs)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact2 TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tel2 TEXT;
ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS contact2 TEXT;
ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS tel2 TEXT;

-- Permissions JSONB sur utilisateurs (pour surcharges individuelles)
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Enrichissement journal
ALTER TABLE journal ADD COLUMN IF NOT EXISTS entite_type TEXT;
ALTER TABLE journal ADD COLUMN IF NOT EXISTS entite_id INT;
ALTER TABLE journal ADD COLUMN IF NOT EXISTS details TEXT;
