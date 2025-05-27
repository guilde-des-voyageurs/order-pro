import { TextInput } from '@mantine/core';
import { useBillingNotes } from '@/hooks/useBillingNotes';
import { useDebounce } from '@/hooks/useDebounce';

interface BillingNoteInputProps {
  orderId: string;
}

export function BillingNoteInput({ orderId }: BillingNoteInputProps) {
  const { note, updateNote } = useBillingNotes(orderId);
  const debouncedUpdate = useDebounce(
    (note: string) => updateNote(note),
    500
  );

  return (
    <TextInput
      placeholder="Note, Numéro de facture..."
      value={note}
      onChange={(event) => debouncedUpdate(event.currentTarget.value)}
      w={500}
      size="md"
    />
  );
}
