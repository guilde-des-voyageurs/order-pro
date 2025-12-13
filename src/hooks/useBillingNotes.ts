import { useCallback } from 'react';
import { collection, doc, getFirestore, setDoc, onSnapshot } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingNote } from '@/types/BillingNote';

const COLLECTION_NAME = 'BillingNotesBatch';

export function useBillingNotes(orderId: string) {
  const db = getFirestore();
  const queryClient = useQueryClient();

  // Récupérer la note
  const { data: billingNote } = useQuery<BillingNote | null>({
    queryKey: ['billingNotes', orderId],
    queryFn: () => {
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          doc(db, COLLECTION_NAME, orderId),
          (doc) => {
            if (doc.exists()) {
              resolve(doc.data() as BillingNote);
            } else {
              resolve(null);
            }
          },
          () => resolve(null)
        );

        // Cleanup subscription on unmount
        return () => unsubscribe();
      });
    },
  });

  // Mettre à jour ou créer une note
  const { mutate: updateNote } = useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const noteData: BillingNote = {
        orderId,
        note,
        createdAt: billingNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, COLLECTION_NAME, orderId), noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingNotes', orderId] });
    },
  });

  return {
    note: billingNote?.note || '',
    updateNote: useCallback((note: string) => updateNote({ note }), [updateNote]),
  };
}
