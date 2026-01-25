import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    // Récupérer les règles de prix depuis Firebase
    const priceRulesRef = collection(db, 'price-rules');
    const priceRulesSnapshot = await getDocs(priceRulesRef);
    
    const firebaseRules = priceRulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; searchString: string; price: number; createdAt?: number }>;

    console.log(`Found ${firebaseRules.length} price rules in Firebase`);

    // Convertir et insérer dans Supabase
    const pricingRulesToInsert = firebaseRules.map((rule, index) => ({
      shop_id: shopId,
      rule_name: rule.searchString,
      rule_type: 'sku_markup' as const,
      condition_field: 'sku',
      condition_value: rule.searchString,
      price_value: rule.price,
      is_percentage: false,
      priority: index,
      is_active: true,
    }));

    if (pricingRulesToInsert.length > 0) {
      // Supprimer les anciennes règles pour ce shop
      await supabase
        .from('pricing_rules')
        .delete()
        .eq('shop_id', shopId);

      // Insérer les nouvelles règles
      const { error } = await supabase
        .from('pricing_rules')
        .insert(pricingRulesToInsert);

      if (error) {
        console.error('Error inserting pricing rules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: {
        pricingRules: pricingRulesToInsert.length,
      }
    });
  } catch (error) {
    console.error('Error importing from Firebase:', error);
    return NextResponse.json({ error: 'Failed to import from Firebase' }, { status: 500 });
  }
}
