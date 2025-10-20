# 🧹 Nettoyer les anciennes variantes d'une commande

## Problème
Après la mise à jour du système de variantes, les anciennes checkboxes cochées dans Firebase utilisent l'ancien format d'ID et ne correspondent plus aux nouvelles variantes.

Résultat : Le compteur affiche un nombre incorrect (ex: 230/189 au lieu de 0/189).

## Solution manuelle (Firebase Console)

### Étape 1 : Identifier l'ID encodé de la commande
```
Commande #1577
ID Shopify: gid://shopify/Order/6178076459275
ID encodé: 6178076459275
```

### Étape 2 : Supprimer les anciennes variantes
1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionne ton projet
3. Va dans **Firestore Database**
4. Cherche la collection `variants-ordered-v2`
5. Filtre par `orderId == "6178076459275"`
6. Sélectionne tous les documents
7. Clique sur "Delete"

### Étape 3 : Réinitialiser le compteur
1. Va dans la collection `textile-progress-v2`
2. Trouve le document avec l'ID `6178076459275`
3. Modifie le champ `checkedCount` à `0`
4. Sauvegarde

### Étape 4 : Refresh l'app
1. Recharge la page
2. Le compteur devrait afficher `0/189`
3. Les checkboxes devraient toutes être décochées

## Solution automatique (Script)

Si tu as plusieurs commandes à nettoyer, on peut créer un script qui :
1. Liste toutes les variantes d'une commande
2. Supprime celles qui utilisent l'ancien format d'ID
3. Réinitialise le compteur

Dis-moi si tu veux que je crée ce script !
