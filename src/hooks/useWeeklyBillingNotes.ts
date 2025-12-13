import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export const useWeeklyBillingNotes = (weekStart: Date) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // On utilise la date de début de semaine comme ID
  const weekId = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    const docRef = doc(db, 'WeeklyBillingNotes', weekId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setNote(doc.data().note || '');
      } else {
        setNote('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [weekId]);

  const saveNote = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'WeeklyBillingNotes', weekId);
      await setDoc(docRef, {
        weekStart: weekStart.toISOString(),
        note: note,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
    } finally {
      setSaving(false);
    }
  };

  return { 
    note, 
    setNote,
    loading,
    saving,
    saveNote
  };
};
