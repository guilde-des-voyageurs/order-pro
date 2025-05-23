import { TextInput, Stack, NumberInput } from '@mantine/core';
import { useBillingNotes } from '@/hooks/useBillingNotes';
import { useDebounce } from '@/hooks/useDebounce';

interface BillingNoteInputProps {
  orderId: string;
}

export function BillingNoteInput({ orderId }: BillingNoteInputProps) {
  const { note, deliveryCost, updateNote } = useBillingNotes(orderId);
  const debouncedUpdate = useDebounce(
    (note: string, deliveryCost: string) => updateNote(note, deliveryCost),
    500
  );

  return (
    <Stack gap="xs">
      <TextInput
        placeholder="Numéro de facture..."
        value={note}
        onChange={(event) => debouncedUpdate(event.currentTarget.value, deliveryCost)}
      />
      <NumberInput
        placeholder="Frais de port..."
        value={deliveryCost}
        onChange={(value) => debouncedUpdate(note, value || 0)}
      />
    </Stack>
  );
}
