import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { auth } from '@/firebase/config';

interface OrderCheckboxState {
  isChecked: boolean;
  lastUpdated: Date;
  originalId: string;
  userId: string;
}

const encodeOrderId = (orderId: string) => {
  return Buffer.from(orderId).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

const decodeOrderId = (encodedId: string) => {
  return Buffer.from(encodedId.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
};

export const useOrderCheckbox = (orderId: string) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const encodedId = encodeOrderId(orderId);

  useEffect(() => {
    const fetchCheckboxState = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        if (!auth.currentUser) {
          setError('Utilisateur non connecté');
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, 'orderCheckboxes', encodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as OrderCheckboxState;
          setIsChecked(data.isChecked);
        } else {
          // Initialize document if it doesn't exist
          await setDoc(docRef, {
            isChecked: false,
            lastUpdated: new Date(),
            originalId: orderId, // Store the original ID for reference
            userId: auth.currentUser.uid // Stocker l'ID de l'utilisateur qui a créé le document
          });
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching checkbox state:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckboxState();
  }, [orderId, encodedId]);

  const toggleCheckbox = async () => {
    try {
      if (!auth.currentUser) {
        setError('Utilisateur non connecté');
        return;
      }

      const docRef = doc(db, 'orderCheckboxes', encodedId);
      const newState = !isChecked;
      
      await updateDoc(docRef, {
        isChecked: newState,
        lastUpdated: new Date(),
        userId: auth.currentUser.uid // Mettre à jour l'ID de l'utilisateur qui a modifié le document
      });

      setIsChecked(newState);
      setError(null);
    } catch (error) {
      console.error('Error updating checkbox state:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return { isChecked, isLoading, error, toggleCheckbox };
};
