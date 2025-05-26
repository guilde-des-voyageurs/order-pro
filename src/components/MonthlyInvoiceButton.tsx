import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { doc, writeBatch, setDoc, getDoc, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { db } from '@/firebase/db';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useBillingNotes } from '@/hooks/useBillingNotes';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';

interface MonthlyInvoiceButtonProps {
  orders: Array<{
    id: string;
    tags?: string[];
  }>;
  monthId: string;
}

export function MonthlyInvoiceButton({ orders, monthId }: MonthlyInvoiceButtonProps) {
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [isUninvoicing, setIsUninvoicing] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const calculateMonthTotal = async (ordersToInvoice: typeof orders) => {
    console.log('Orders to invoice:', ordersToInvoice);
    const orderIds = ordersToInvoice.map(order => encodeFirestoreId(order.id));
    console.log('Order IDs:', orderIds);

    // Récupérer les coûts des commandes
    const orderCostsQuery = query(
      collection(db, 'orders-cost'),
      where('__name__', 'in', orderIds)
    );

    const orderCostsSnapshot = await getDocs(orderCostsQuery);
    let total = 0;

    orderCostsSnapshot.forEach((doc) => {
      const data = doc.data();
      total += data.total || 0;
    });

    console.log('Orders total:', total);
    return total;
  };

  const updateInvoiceStatus = async (setInvoiced: boolean) => {
    const setLoading = setInvoiced ? setIsInvoicing : setIsUninvoicing;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      
      const ordersToInvoice = orders.filter(order => 
        !order.tags?.some(tag => tag.toLowerCase().includes('batch'))
      );

      // Récupérer la note mensuelle
      const monthlyNoteRef = doc(db, 'MonthlyBillingNotes', monthId);
      const monthlyNoteSnap = await getDoc(monthlyNoteRef);
      const monthlyNoteData = monthlyNoteSnap.exists() ? monthlyNoteSnap.data() : {};
      const deliveryCost = monthlyNoteData.deliveryCost || 0;
      const balance = monthlyNoteData.balance || 0;

      // Mettre à jour le statut de facturation pour chaque commande
      ordersToInvoice.forEach(order => {
        // Extraire uniquement le numéro de commande de l'ID Shopify
        const orderId = order.id.split('/').pop() || '';
        const docRef = doc(db, 'InvoiceStatus', orderId);
        batch.set(docRef, {
          invoiced: setInvoiced,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();

      // Si on facture (pas si on défacture), on calcule et sauvegarde le total
      if (setInvoiced) {
        const ordersTotal = await calculateMonthTotal(ordersToInvoice);
        const monthlyNoteRef = doc(db, 'MonthlyBillingNotes', monthId);
        const monthlyNoteSnap = await getDoc(monthlyNoteRef);
        const monthlyNoteData = monthlyNoteSnap.exists() ? monthlyNoteSnap.data() : {};
        const monthlyBalance = monthlyNoteData.balance || 0;

        const finalTotal = ordersTotal + Number(monthlyBalance);
        setTotal(finalTotal);

        await setDoc(monthlyNoteRef, {
          total: finalTotal,
          invoicedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceMonth = () => updateInvoiceStatus(true);
  const handleUninvoiceMonth = () => updateInvoiceStatus(false);

  return (
    <Group gap="sm">
      <Button
        onClick={handleInvoiceMonth}
        loading={isInvoicing}
        variant="light"
        color="blue"
      >
        Facturer tout le mois
      </Button>
      <Button
        onClick={handleUninvoiceMonth}
        loading={isUninvoicing}
        variant="light"
        color="red"
      >
        Défacturer le mois
      </Button>
    </Group>
  );
}
