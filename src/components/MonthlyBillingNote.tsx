import { useState, useEffect } from 'react';
import { Textarea, Button, Group, Text } from '@mantine/core';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';

interface MonthlyBillingNoteProps {
  monthKey: string;  // Format: YYYY-MM
}

export function MonthlyBillingNote({ monthKey }: MonthlyBillingNoteProps) {
  const [note, setNote] = useState('');
  const [total, setTotal] = useState<number | null>(null);

  // Écouter les changements de la note
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'MonthlyBillingNotes', monthKey), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('MonthlyBillingNotes update:', data); // Debug
        setNote(data.content || '');
        setTotal(data.total || null);

      }
    });

    return () => unsubscribe();
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
    <div>
      {total !== null && (
        <Text size="lg" fw={500} mb="xs" c="blue">
          Total du mois : {total.toFixed(2)} € HT
        </Text>
      )}
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
    </div>
  );
}
