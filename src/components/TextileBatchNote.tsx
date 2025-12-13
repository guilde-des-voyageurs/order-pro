'use client';

import { useState, useEffect } from 'react';
import { Textarea, Button, Group } from '@mantine/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export function TextileBatchNote() {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const noteRef = doc(db, 'textile-notes', 'batch');
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
          setNote(noteSnap.data().content);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la note:', error);
      }
    };

    loadNote();
  }, []);

  const saveNote = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, 'textile-notes', 'batch'), {
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
    <Group align="flex-end" mb="xl">
      <Textarea
        placeholder="Notes pour la production textile..."
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
        variant="light"
      >
        Enregistrer
      </Button>
    </Group>
  );
}
