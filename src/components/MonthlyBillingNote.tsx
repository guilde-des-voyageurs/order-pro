import { TextInput, Group, Button, Text } from '@mantine/core';
import { useMonthlyBillingNotes } from '@/hooks/useMonthlyBillingNotes';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonthlyBillingNoteProps {
  monthStart: Date;
}

export const MonthlyBillingNote = ({ monthStart }: MonthlyBillingNoteProps) => {
  const { note, setNote, saving, saveNote } = useMonthlyBillingNotes(monthStart);

  return (
    <Group align="flex-end" gap="sm">
      <Text c="dimmed" size="sm">
        Commandes du mois de {format(monthStart, 'MMMM yyyy', { locale: fr })}
      </Text>
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
