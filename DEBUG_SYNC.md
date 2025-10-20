# 🐛 Debug de la synchronisation

## Problème
La synchronisation ne fonctionne plus après l'ajout de `selectedOptions`.

## Causes possibles

### 1. **selectedOptions non supporté dans l'API 2024-10**
- Peu probable, ce champ existe depuis longtemps
- Mais possible si Shopify a changé le nom du champ

### 2. **Erreur de syntaxe GraphQL**
- La requête pourrait être mal formée
- Vérifier dans la console du navigateur

### 3. **Problème de permissions**
- Le token API n'a peut-être pas les permissions pour lire `selectedOptions`

## Solutions à tester

### Solution 1: Vérifier les logs
1. Ouvre la console du navigateur (F12)
2. Clique sur "Synchroniser"
3. Regarde les logs:
   - `❌ Erreur lors de la synchronisation:` → Erreur détaillée
   - `📌 Détails de la commande` → Vérifie si `selectedOptions` est "NON DISPONIBLE"

### Solution 2: Tester sans selectedOptions
Si les logs montrent que `selectedOptions` n'est pas disponible, on peut:
1. Garder le fallback sur `variantTitle.split(' / ')`
2. Le système fonctionnera quand même (rétrocompatible)

### Solution 3: Vérifier la version de l'API
Shopify a peut-être renommé le champ. Alternatives possibles:
- `selectedOptions` (actuel)
- `options` 
- `variantOptions`

## Test rapide

Pour tester si c'est bien `selectedOptions` le problème:

1. **Désactiver temporairement selectedOptions dans la requête**
   - Commenter les lignes 50-53 dans `src/graphql/queries.ts`
   - Relancer la sync
   - Si ça marche → c'est bien selectedOptions le problème

2. **Si ça ne marche toujours pas**
   - Le problème est ailleurs (credentials, réseau, etc.)
   - Regarder les logs détaillés dans la console

## Prochaines étapes

Dis-moi ce que tu vois dans la console du navigateur quand tu essaies de synchroniser, et je pourrai t'aider plus précisément !
