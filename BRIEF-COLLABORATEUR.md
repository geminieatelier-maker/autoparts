# Brief — Développement de 4 modules (AUTOPARTS ERP)

Bonjour, tu vas développer **4 modules** d'un ERP de pièces automobiles déjà démarré.
Le socle (Electron + PostgreSQL local) et 4 modules sont **déjà faits et fonctionnels**.
Tu dois coder **exactement dans le même style** pour que ça s'intègre. Lis d'abord `GUIDE-DEV.md`.

## 1. Installer et lancer
```
npm install
npm run electron:dev
```
La base de données démarre automatiquement. Login : la page s'ouvre directement (pas de login pour l'instant).
> Si `electron:dev` bloque : 2 terminaux → `npm run dev` puis `npm run electron`.

## 2. Ton modèle de référence
Copie la structure de **`src/pages/CmdFournisseurs.jsx`** (liste + formulaire + détail, câblé à la base).
Le fichier **`GUIDE-DEV.md`** contient le template complet et les règles.

## 3. Règles NON négociables (sinon ça ne s'intègre pas)
- **Front** = `src/pages/*.jsx` (React, `import`). **Backend** = `electron/api.cjs` (CommonJS, `require`). Ne pas mélanger.
- Dans une page : `import { API, currentUser, fmtAr, fmtDate } from '../lib/api'`. Charger avec `useEffect`→`API.getX()`. Toujours `if(!API) return`.
- Backend : ajoute tes fonctions dans l'objet `const API = {...}` de `electron/api.cjs`. Requêtes paramétrées `$1,$2` (jamais de concaténation). Insertions multi-lignes → transaction `BEGIN/COMMIT/ROLLBACK`.
- Base : `schema.sql`, `CREATE TABLE IF NOT EXISTS` uniquement (jamais de DROP). Clés étrangères vers `clients`, `fournisseurs`, `commandes_client`, `commandes_fournisseur`.
- **Réutilise les classes CSS existantes** : `card`, `card-title`, `btn btn-p/btn-o/btn-d/btn-s`, `btn-sm`, `tbl`/`tbl-wrap`, `fg`, `grid2`, `badge b-g/b-y/b-r/b-b`, `tabs`/`tab`, `search-bar`, `stats`/`stat`, `pay-row`. Ne réinvente pas le style.
- **NE TOUCHE PAS** : `electron/main.cjs`, `pg-server.cjs`, `db.cjs`, `config.cjs`, `preload.cjs`, `pg-portable/`. Le socle est fiabilisé.
- Numérotation : après `INSERT ... RETURNING id`, faire `UPDATE t SET numero='XX-'+String(id).padStart(3,'0')`.
- Journalise les créations : `await logEvent(user?user.id:null, user?user.nom:null, 'texte')` (fonction déjà présente dans api.cjs).

## 4. Tes 4 modules (commence par le 11, le plus simple)

### Module 11 — Journal  (`src/pages/Journal.jsx`) — AUCUN backend à écrire
- La table `journal` et la fonction `API.getJournal()` existent déjà.
- Page : afficher la liste (colonnes : date/heure `created_at`, `utilisateur_nom`, `action`), avec une barre de recherche qui filtre côté front. C'est tout.

### Module 7 — Facturation  (`src/pages/Facturation.jsx`)
- Tables à créer :
  - `factures` : id, numero (FA-xxx), client_id (FK clients), commande_id (FK commandes_client, nullable), date_facture DATE, total_ht NUMERIC, marge NUMERIC, statut TEXT ('Impayée'|'Partielle'|'Payée'), created_at.
  - `facture_lignes` : id, facture_id (FK ON DELETE CASCADE), designation, reference, quantite, prix_unitaire (prix de vente), cout_unitaire (coût de revient), montant.
- API : `getFactures({statut,recherche})`, `getFactureDetail(id)`, `saveFacture({header,lignes},user)`, `updateFactureStatut(id,statut)`.
- Page : liste (n°, client, date, montant, marge, statut) + créer une facture depuis une commande client (choisir la commande → pré-remplir les lignes → saisir le prix de vente → **marge = (PV − coût) auto**) + détail.

### Module 8 — Paiements  (`src/pages/Paiements.jsx`)
- Table `paiements` : id, type TEXT ('client'|'fournisseur'), tiers_id INT, tiers_nom TEXT, reference_doc TEXT (n° facture/commande), montant NUMERIC, mode TEXT ('Espèces'|'Mvola'|'Virement'|'Chèque'|'Crédit'), echeance DATE, date_paiement DATE, statut TEXT ('Payé'|'En attente'), created_at.
- API : `getPaiements({type})`, `savePaiement(p,user)`, `updatePaiement(id, champs)`.
- Page : 2 onglets (Clients / Fournisseurs), liste des paiements + échéances, bouton « Enregistrer un paiement », suivi des **restes à payer** (somme dus − payés). Délais possibles : Comptant, 30, 45, 60, 90, 120 jours.

### Module 9 — Expéditions  (`src/pages/Expeditions.jsx`)
- Tables à créer :
  - `expeditions` : id, numero (EXP-xxx), client_id (FK), transport TEXT ('Taxi-brousse'|'Transporteur'|'Retrait sur place'), date_exp DATE, statut TEXT ('Préparée'|'Expédiée'|'Livrée'), observations TEXT, created_at.
  - `expedition_commandes` : expedition_id (FK ON DELETE CASCADE), commande_client_id (FK), PRIMARY KEY(les deux).
- API : `getExpeditions({statut,recherche})`, `getExpeditionDetail(id)`, `saveExpedition({header, commande_ids},user)`, `updateExpeditionStatut(id,statut)`.
- Page : liste + créer (choisir un client → cocher ses commandes clients à regrouper → choisir le transport) + détail. Modèle exact du regroupement : voir `CmdFournisseurs.jsx` (il regroupe déjà des commandes clients).

## 5. Comment livrer ton travail
Pour chaque module, renvoie **3 choses** :
1. le SQL des tables ajoutées à `schema.sql`,
2. le code des fonctions ajoutées à `electron/api.cjs`,
3. le fichier `src/pages/Xxx.jsx` complet.

Teste que ça marche chez toi (créer / lister / voir un enregistrement) avant d'envoyer.
L'intégration finale, les tests dans l'app empaquetée et le débogage sont gérés par l'équipe.
