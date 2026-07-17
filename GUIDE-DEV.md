# AUTOPARTS ERP — Guide de développement des modules

Ce guide décrit **comment coder un module** pour qu'il s'intègre sans friction dans
l'architecture existante (modules 1-4 déjà faits). Respecte ces conventions et ton
code se branchera directement.

---

## 1. Architecture & flux de données

```
Electron (electron/main.cjs)
   ├─ démarre PostgreSQL portable (local, port 54330)
   ├─ applique schema.sql + crée admin/config (electron/db.cjs)
   └─ charge l'app React (dev: vite localhost:5173 ; prod: dist/index.html)

preload.cjs  ──expose──►  window.API   (les 29 fonctions de electron/api.cjs)

React (src/pages/*.jsx)  ──appelle──►  window.API.xxx()  via  src/lib/api.js
```

**Fichiers clés :**
| Fichier | Rôle |
|---|---|
| `schema.sql` | tables PostgreSQL (idempotent) |
| `electron/api.cjs` | fonctions backend (objet `API = {...}`) |
| `electron/db.cjs` | `db.query(sql, params)` |
| `src/lib/api.js` | helper front : `API`, `fmtAr`, `fmtDate`, `currentUser` |
| `src/pages/Xxx.jsx` | une page = un module |

⚠️ **Node côté Electron = CommonJS** (`.cjs`, `require`). **React = ESM** (`import`).
Ne mélange pas : le backend s'écrit dans `electron/*.cjs`, le front dans `src/*.jsx`.

---

## 2. Règles à respecter (contrat d'intégration)

### A. Base de données (`schema.sql`)
- **`CREATE TABLE IF NOT EXISTS` uniquement.** Jamais de `DROP`, jamais de `ALTER` destructif.
- Clés étrangères vers les tables existantes : `clients`, `fournisseurs`,
  `commandes_client`, `commandes_fournisseur`, `utilisateurs`.
- Un `CREATE INDEX IF NOT EXISTS` sur les colonnes de date / recherche / FK.
- Montants = `NUMERIC`, dates = `DATE`, horodatage = `TIMESTAMPTZ DEFAULT now()`.

### B. Backend (`electron/api.cjs`)
- Ajoute tes fonctions **dans l'objet `const API = { ... }`** (avant le `}` final).
- Requêtes paramétrées : `db.query('SELECT ... WHERE id=$1', [id])` — **jamais** de
  concaténation de valeurs dans le SQL (injection).
- **Multi-étapes = transaction :**
  ```js
  await db.query('BEGIN');
  try { /* inserts... */ await db.query('COMMIT'); }
  catch (e) { await db.query('ROLLBACK'); throw e; }
  ```
- **Numérotation** (ex. facture FA-001) : insérer avec `RETURNING id`, puis
  `UPDATE t SET numero='FA-'+String(id).padStart(3,'0') WHERE id=$1`.
- **Journalise** les créations/modifs importantes :
  `await logEvent(user?user.id:null, user?user.nom:null, 'Création facture FA-001');`
  (la fonction `logEvent` existe déjà en haut de `api.cjs`).

### C. Frontend (`src/pages/Xxx.jsx`)
- Import obligatoire : `import { API, fmtAr, fmtDate, currentUser } from '../lib/api'`
- **Charger les données** avec `useEffect` + `useCallback` :
  ```jsx
  const load = useCallback(async () => { if (!API) return; setList(await API.getXxx({})); }, [])
  useEffect(() => { load() }, [load])
  ```
- Toujours passer `currentUser` en 2e argument des fonctions qui écrivent
  (`API.saveXxx(data, currentUser)`).
- **Réutilise les classes CSS existantes** (voir §4) — ne réinvente pas le style.
- Pattern d'une page = **3 vues dans un seul composant** via `useState` :
  `liste` (par défaut) → `form` (création/édition) → `detail`.
  Regarde `src/pages/Commandes.jsx` ou `CmdFournisseurs.jsx` comme modèle exact.

---

## 3. Template minimal (copier-coller & adapter)

### schema.sql (ajouter à la fin)
```sql
CREATE TABLE IF NOT EXISTS ma_table (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE,
  ref_id INT REFERENCES commandes_client(id),
  date_x DATE DEFAULT current_date,
  statut TEXT DEFAULT 'En cours',
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matable_date ON ma_table(date_x);
```

### electron/api.cjs (dans l'objet API)
```js
  getMaListe: (f={}) => db.query('SELECT * FROM ma_table ORDER BY date_x DESC LIMIT 300'),
  getMaDetail: async (id) => (await db.query('SELECT * FROM ma_table WHERE id=$1',[id]))[0] || null,
  saveMaChose: async ({ header, lignes }, user) => {
    await db.query('BEGIN');
    try {
      const r = await db.query('INSERT INTO ma_table (ref_id,date_x,statut,total) VALUES ($1,$2,$3,$4) RETURNING id',
        [header.ref_id||null, header.date_x||null, header.statut||'En cours', header.total||0]);
      const id = r[0].id;
      await db.query("UPDATE ma_table SET numero=$1 WHERE id=$2", ['XX-'+String(id).padStart(3,'0'), id]);
      await db.query('COMMIT');
      await logEvent(user?user.id:null, user?user.nom:null, 'Création XX-'+String(id).padStart(3,'0'));
      return { id };
    } catch(e){ await db.query('ROLLBACK'); throw e; }
  },
```

### src/pages/MaPage.jsx (squelette)
```jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

export default function MaPage() {
  const [list, setList] = useState([])
  const [detail, setDetail] = useState(null)
  const load = useCallback(async () => { if (!API) return; setList(await API.getMaListe({})) }, [])
  useEffect(() => { load() }, [load])

  if (detail) return (<div>{/* vue détail */}</div>)

  return <>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
      <h3 style={{color:'#f8fafc',margin:0}}>Mon module</h3>
      <button className="btn btn-p"><Plus size={16}/> Nouveau</button>
    </div>
    <div className="card"><div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Date</th><th>Montant</th><th></th></tr></thead>
        <tbody>{list.map(x=>(
          <tr key={x.id}><td style={{color:'#f0b429'}}>{x.numero}</td><td>{fmtDate(x.date_x)}</td>
            <td>{fmtAr(x.total)}</td><td><button className="btn btn-o btn-sm" onClick={()=>setDetail(x)}><Eye size={14}/></button></td></tr>
        ))}</tbody>
      </table>
    </div></div>
  </>
}
```
La page est **déjà routée** dans `src/App.jsx` (routes `/receptions`, `/facturation`, etc.) —
tu n'as qu'à remplacer le contenu du fichier `src/pages/*.jsx` correspondant.

---

## 4. Classes CSS disponibles (dans src/App.css) — à réutiliser

| Classe | Usage |
|---|---|
| `card`, `card-title` | carte / titre de carte |
| `btn btn-p` | bouton principal (jaune) |
| `btn btn-o` | bouton contour |
| `btn btn-d` | bouton danger (rouge) |
| `btn btn-s` | bouton succès (vert) |
| `btn btn-sm` | petit bouton |
| `tbl`, `tbl-wrap` | tableau (wrap = scroll horizontal) |
| `fg` | champ de formulaire (label + input) |
| `grid2` | grille 2 colonnes |
| `badge b-g / b-y / b-r / b-b` | pastille vert / jaune / rouge / bleu |
| `tabs`, `tab`, `tab active` | onglets |
| `search-bar` | barre de recherche |
| `stats`, `stat` (`.label`, `.value`) | cartes statistiques |
| `cmp-row`, `cmp-best` | ligne de comparaison |
| `pay-row` | ligne paiement/liste |
| `ai-box` | encadré recommandation IA |

Input inline standard :
```js
const inp = { background:'#0f172a', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f8fafc', fontSize:14, width:'100%' }
```

---

## 5. Répartition proposée des modules restants

Les tables déjà existantes : `clients, fournisseurs, commandes_client(+lignes),
cotations(+offres), commandes_fournisseur(+lignes), cmd_fourn_clients, journal, config, utilisateurs`.

### 🧑‍💻 TOI — modules "CRUD + affichage" (même pattern que 1-4)

**Module 7 — Facturation** (`src/pages/Facturation.jsx`)
- Tables : `factures` (numero FA-xxx, client_id, commande_id?, date, total_ht, marge, statut), `facture_lignes`.
- API : `getFactures`, `getFactureDetail`, `saveFacture({header,lignes}, user)`, `updateFactureStatut`.
- Page : liste + créer une facture depuis une commande client (marge auto = PV − coût).

**Module 8 — Paiements** (`src/pages/Paiements.jsx`)
- Tables : `paiements` (type 'client'|'fournisseur', tiers_id, reference_doc, montant, mode, echeance, date, statut).
- Modes : Espèces, Mvola, Virement, Chèque, Crédit. Délais : Comptant/30/45/60/90/120j.
- API : `getPaiements({type})`, `savePaiement(p,user)`, suivi : restes à payer / échéances.

**Module 9 — Expéditions** (`src/pages/Expeditions.jsx`)
- Table : `expeditions` (numero EXP-xxx, client_id, transport 'Taxi-brousse'|'Transporteur'|'Retrait', date, statut) + `expedition_commandes` (lien commandes clients).
- API : `getExpeditions`, `saveExpedition({header, commande_ids}, user)`, regroupement auto par client.

**Module 11 — Journal** (`src/pages/Journal.jsx`) — le plus simple
- Table déjà existante (`journal`). API déjà existante : `API.getJournal()`.
- Page : juste afficher la liste (date/heure, utilisateur, action) + filtre. **Aucune table/API à créer.**

### 🤖 MOI — modules couplés au cœur / calculs / IA

- **Module 5 — Réceptions** (lié aux cmd fournisseur, statuts Reçu/Partiel/Manquant)
- **Module 6 — Coût de revient** (achat + transport + import + autres)
- **Module 10 — Tableau de bord live** (agrégation temps réel)
- **Module 12 — Intelligence (IA)** (comparaison auto, conseils, Q&R)
- **Login multi-utilisateurs** + **import/export Excel & PDF**

---

## 5bis. Import / Export (déjà disponible — réutilise-le)

Helper prêt à l'emploi : `import { exportExcel, importExcelFile, printDocument } from '../lib/files'`

- **Export Excel** d'une liste : `exportExcel(rows, 'fichier.xlsx', 'NomFeuille')` où `rows` = tableau d'objets `{Colonne: valeur}`.
- **Import Excel** : `<input type="file" accept=".xlsx,.xls" onChange={async e => { const rows = await importExcelFile(e.target.files[0], true); ... }}/>` (2e argument `true` = reconnaît désignation/référence/quantité/prix pour pré-remplir des lignes).
- **Impression / PDF** d'un document : `printDocument('Titre', '<h1>...</h1><table>...</table>')` → ouvre la fenêtre d'impression (l'utilisateur choisit imprimante ou « Enregistrer en PDF »). Voir `imprimer()` dans `src/pages/Commandes.jsx` comme modèle.

Backend correspondant (déjà dans `api.cjs`) : `excelDepuisLignes`, `lireExcel`, `lireArticlesExcel`. Ne les réécris pas.

## 6. Quand tu me renvoies ton code

Donne-moi, pour chaque module :
1. les **tables** ajoutées (le SQL) → je les intègre dans `schema.sql`,
2. les **fonctions API** (le code des fonctions) → je les mets dans `electron/api.cjs`,
3. la **page** `src/pages/Xxx.jsx`.

Je vérifie l'intégration (transactions, sécurité, cohérence des noms), je teste le
tout dans l'app empaquetée, et je corrige/complète. **Ne touche pas** à `main.cjs`,
`pg-server.cjs`, `db.cjs`, `config.cjs`, `preload.cjs` (le socle est fiabilisé).
