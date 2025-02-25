import { TextInput, Group, Button } from '@mantine/core';
import { useWeeklyBillingNotes } from '@/hooks/useWeeklyBillingNotes';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface WeeklyBillingNoteProps {
  weekStart: Date;
}

export const WeeklyBillingNote = ({ weekStart }: WeeklyBillingNoteProps) => {
  const { note, setNote, saving, saveNote } = useWeeklyBillingNotes(weekStart);

  return (
    <Group align="flex-end" gap="sm">
      <TextInput
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
        placeholder="Référence de la facture envoyée"
        style={{ flex: 1 }}
      />
      <Button 
        onClick={saveNote}
        loading={saving}
        leftSection={<IconDeviceFloppy size={16} />}
      >
        Enregistrer
      </Button>
    </Group>
  );
};
