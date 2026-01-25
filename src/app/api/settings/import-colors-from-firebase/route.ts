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

    // Récupérer les mappings de couleurs depuis Firebase
    const colorMappingsRef = collection(db, 'color-mappings');
    const colorMappingsSnapshot = await getDocs(colorMappingsRef);
    
    const firebaseColors = colorMappingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; frenchName: string; englishName: string }>;

    console.log(`Found ${firebaseColors.length} color mappings in Firebase`);

    // Convertir et insérer dans Supabase
    // On stocke le nom français comme color_name et le nom anglais comme hex_value
    // (ou on peut adapter la structure selon les besoins)
    const colorRulesToInsert = firebaseColors.map((color) => ({
      shop_id: shopId,
      color_name: color.frenchName.toLowerCase().trim(),
      hex_value: color.englishName.toLowerCase().trim(), // Stocke le nom anglais ici
    }));

    if (colorRulesToInsert.length > 0) {
      // Supprimer les anciennes règles pour ce shop
      await supabase
        .from('color_rules')
        .delete()
        .eq('shop_id', shopId);

      // Insérer les nouvelles règles
      const { error } = await supabase
        .from('color_rules')
        .insert(colorRulesToInsert);

      if (error) {
        console.error('Error inserting color rules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: colorRulesToInsert.length,
    });
  } catch (error) {
    console.error('Error importing colors from Firebase:', error);
    return NextResponse.json({ error: 'Failed to import from Firebase' }, { status: 500 });
  }
}
