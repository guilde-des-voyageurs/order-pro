# 🧪 Test des variantes à 3+ niveaux

## Comment ça marche maintenant

### Exemple avec 3 niveaux : "Terra Cotta / XS / Coton"

1. **Parsing du variantTitle**
   ```typescript
   getSelectedOptions(item)
   // Retourne:
   [
     {name: 'Couleur', value: 'Terra Cotta'},
     {name: 'Taille', value: 'XS'},
     {name: 'Option3', value: 'Coton'}
   ]
   ```

2. **Génération de l'ID**
   ```typescript
   generateVariantId(orderId, sku, color, size, index, qty, selectedOptions)
   // Les options sont triées alphabétiquement par nom:
   // Couleur, Option3, Taille
   // ID généré: orderId--sku--Terra Cotta--Coton--XS--index--qty
   ```

3. **Résultat**
   - ✅ Chaque combinaison unique a un ID unique
   - ✅ "Terra Cotta / XS / Coton" ≠ "Terra Cotta / XS / Polyester"
   - ✅ Les checkboxes se synchronisent correctement

## Test à faire

1. **Synchronise les commandes**
   - Clique sur "Synchroniser"
   - Regarde la console

2. **Cherche ce log**
   ```
   🔍 Variante avec 3 niveaux détectée:
   {
     variantTitle: "Terra Cotta / XS / Coton",
     options: [
       {name: 'Couleur', value: 'Terra Cotta'},
       {name: 'Taille', value: 'XS'},
       {name: 'Option3', value: 'Coton'}
     ]
   }
   ```

3. **Vérifie les checkboxes**
   - Va dans "Commandes détaillées"
   - Trouve un produit avec 3+ niveaux
   - Coche une checkbox
   - Vérifie qu'elle reste cochée après refresh
   - Vérifie que les autres variantes ne sont pas affectées

## Exemples de variantes supportées

### 2 niveaux (classique)
- "Terra Cotta / XS"
- ID: `orderId--sku--Terra Cotta--XS--index--qty`

### 3 niveaux
- "Terra Cotta / XS / Coton"
- ID: `orderId--sku--Coton--Terra Cotta--XS--index--qty`
  (trié alphabétiquement: Couleur, Option3, Taille)

### 4 niveaux
- "Terra Cotta / XS / Coton / Bio"
- ID: `orderId--sku--Coton--Bio--Terra Cotta--XS--index--qty`
  (trié alphabétiquement: Couleur, Option3, Option4, Taille)

## Points importants

1. **Ordre dans Shopify**
   - L'ordre n'a plus d'importance
   - Les options sont triées automatiquement

2. **Format du variantTitle**
   - DOIT utiliser " / " comme séparateur
   - Exemple correct: "Couleur / Taille / Matière"
   - Exemple incorrect: "Couleur-Taille-Matière"

3. **Affichage**
   - Toutes les options s'affichent dans l'UI
   - La couleur est transformée (majuscule)
   - Les autres options restent telles quelles

## Logs à surveiller

Si tu vois ce log, c'est que ça marche :
```
🔍 Variante avec 3 niveaux détectée: ...
```

Si tu ne le vois pas, c'est que :
- Tes produits n'ont que 2 niveaux
- Le format du variantTitle est incorrect
