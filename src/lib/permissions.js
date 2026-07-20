import { currentUser } from './api'

const PERMISSIONS_DEFAUT = {
  admin: {
    dashboard:true, commandes:true, clients:true, comparateur:true, fournisseurs:true,
    cmd_fournisseurs:true, receptions:true, facturation:true, paiements:true, expeditions:true,
    intelligence:true, journal:true, parametres:true,
    voir_marges:true, voir_prix_achat:true, voir_benefices:true, voir_stats_financieres:true,
    voir_creances:true, gestion_utilisateurs:true, sauvegarde:true, restauration:true,
  },
  gestionnaire: {
    dashboard:true, commandes:true, clients:true, comparateur:true, fournisseurs:true,
    cmd_fournisseurs:true, receptions:true, facturation:true, paiements:true, expeditions:true,
    intelligence:true, journal:true, parametres:true,
    voir_marges:false, voir_prix_achat:false, voir_benefices:false, voir_stats_financieres:false,
    voir_creances:true, gestion_utilisateurs:false, sauvegarde:false, restauration:false,
  },
  operateur: {
    dashboard:true, commandes:true, clients:true, comparateur:false, fournisseurs:false,
    cmd_fournisseurs:false, receptions:false, facturation:true, paiements:true, expeditions:false,
    intelligence:false, journal:false, parametres:true,
    voir_marges:false, voir_prix_achat:false, voir_benefices:false, voir_stats_financieres:false,
    voir_creances:false, gestion_utilisateurs:false, sauvegarde:false, restauration:false,
  },
}

export function getPermissions(user) {
  if (!user) return PERMISSIONS_DEFAUT.operateur
  if (user.permissions && Object.keys(user.permissions).length > 0) return user.permissions
  const role = user.role || 'operateur'
  return PERMISSIONS_DEFAUT[role] || PERMISSIONS_DEFAUT.operateur
}

export function hasPermission(perm) {
  const perms = getPermissions(currentUser)
  return !!perms[perm]
}

export function getDefaultPermissions(role) {
  return { ...(PERMISSIONS_DEFAUT[role] || PERMISSIONS_DEFAUT.operateur) }
}

export const PERM_LABELS = {
  dashboard: 'Tableau de bord',
  commandes: 'Commandes clients',
  clients: 'Clients',
  comparateur: 'Comparateur prix',
  fournisseurs: 'Fournisseurs',
  cmd_fournisseurs: 'Commandes fournisseurs',
  receptions: 'Réceptions',
  facturation: 'Facturation',
  paiements: 'Paiements',
  expeditions: 'Expéditions',
  intelligence: 'Intelligence',
  journal: 'Journal',
  parametres: 'Paramètres',
  voir_marges: 'Voir les marges',
  voir_prix_achat: 'Voir les prix d\'achat',
  voir_benefices: 'Voir les bénéfices',
  voir_stats_financieres: 'Voir les statistiques financières',
  voir_creances: 'Voir les créances',
  gestion_utilisateurs: 'Gestion des utilisateurs',
  sauvegarde: 'Sauvegarde',
  restauration: 'Restauration',
}

export const PERM_GROUPS = [
  { label: 'Modules', perms: ['dashboard','commandes','clients','comparateur','fournisseurs','cmd_fournisseurs','receptions','facturation','paiements','expeditions','intelligence','journal','parametres'] },
  { label: 'Données sensibles', perms: ['voir_marges','voir_prix_achat','voir_benefices','voir_stats_financieres','voir_creances'] },
  { label: 'Administration', perms: ['gestion_utilisateurs','sauvegarde','restauration'] },
]

export { PERMISSIONS_DEFAUT }
