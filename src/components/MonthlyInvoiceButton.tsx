import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { doc, writeBatch, setDoc, getDoc, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface MonthlyInvoiceButtonProps {
  orders: Array<{
    id: string;
    tags?: string[];
  }>;
  monthKey: string;
}

export function MonthlyInvoiceButton({ orders, monthKey }: MonthlyInvoiceButtonProps) {
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [isUninvoicing, setIsUninvoicing] = useState(false);

  const calculateMonthTotal = async (ordersToInvoice: typeof orders) => {
    console.log('Orders to invoice:', ordersToInvoice);
    const orderIds = ordersToInvoice.map(order => order.id.split('/').pop() || '');
    console.log('Order IDs:', orderIds);
    // On récupère directement les documents par leurs IDs car ce sont les numéros de commande
    const costDocs = await Promise.all(
      orderIds.map(orderId => 
        getDoc(doc(db, 'orders-cost', orderId))
      )
    );

    console.log('Found costs documents:', costDocs.length);
    let total = 0;

    costDocs.forEach((doc: DocumentSnapshot<DocumentData>) => {
      if (!doc.exists()) return;
      console.log('Cost document:', doc.id, doc.data());
      const data = doc.data();
      if (data.totalCost) {
        total += data.totalCost;
      }
    });

    console.log('Final total:', total);
    return total;
  };

  const updateInvoiceStatus = async (setInvoiced: boolean) => {
    const setLoading = setInvoiced ? setIsInvoicing : setIsUninvoicing;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Filtrer les commandes qui ont un tag "batch"
      const ordersToInvoice = orders.filter(order => 
        !order.tags?.some(tag => tag.toLowerCase().includes('batch'))
      );

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
        const total = await calculateMonthTotal(ordersToInvoice);
        const monthlyNoteRef = doc(db, 'MonthlyBillingNotes', monthKey);
        await setDoc(monthlyNoteRef, {
          total,
          updatedAt: new Date().toISOString()
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
