import { useState, useEffect } from 'react';
import { Textarea, Button, Group } from '@mantine/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';

interface MonthlyBillingNoteProps {
  monthKey: string;  // Format: YYYY-MM
}

export function MonthlyBillingNote({ monthKey }: MonthlyBillingNoteProps) {
  const [note, setNote] = useState('');

  // Charger la note existante
  useEffect(() => {
    const loadNote = async () => {
      const noteDoc = await getDoc(doc(db, 'MonthlyBillingNotes', monthKey));
      if (noteDoc.exists()) {
        setNote(noteDoc.data().content || '');
      }
    };
    loadNote();
  }, [monthKey]);

  const [isSaving, setIsSaving] = useState(false);

  const saveNote = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, 'MonthlyBillingNotes', monthKey), {
        content: note,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Group align="flex-end">
      <Textarea
        placeholder="Notes pour ce mois..."
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
        minRows={2}
        maxRows={4}
        w={600}
        autosize
      />
      <Button
        onClick={saveNote}
        loading={isSaving}
      >
        Sauvegarder
      </Button>
    </Group>
  );
}
