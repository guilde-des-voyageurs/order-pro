import { TextInput, Button, Group } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useBillingNotes } from '@/hooks/useBillingNotes';
import { useState, useEffect } from 'react';

interface BillingNoteInputProps {
  orderId: string;
}

export function BillingNoteInput({ orderId }: BillingNoteInputProps) {
  const { note: savedNote, updateNote } = useBillingNotes(orderId);
  const [note, setNote] = useState<string>(savedNote);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Mettre à jour la note locale quand la note sauvegardée change
  useEffect(() => {
    setNote(savedNote);
  }, [savedNote]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateNote(note);
    setIsSaving(false);
  };

  return (
    <Group gap="xs">
      <TextInput
        placeholder="Note, Numéro de facture..."
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
        w={400}
        size="md"
      />
      <Button
        variant="light"
        leftSection={<IconDeviceFloppy size={16} />}
        onClick={handleSave}
        loading={isSaving}
      >
        Enregistrer
      </Button>
    </Group>
  );
}
