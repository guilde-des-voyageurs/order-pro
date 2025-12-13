import { Checkbox } from '@mantine/core';
import { useWeeklyBillingCheckboxes } from '@/hooks/useWeeklyBillingCheckboxes';

interface WeeklyBillingCheckboxProps {
  orderIds: string[];
}

export const WeeklyBillingCheckbox = ({ orderIds }: WeeklyBillingCheckboxProps) => {
  const { checked, indeterminate, loading, handleChange } = useWeeklyBillingCheckboxes(orderIds);

  return (
    <Checkbox 
      checked={checked}
      indeterminate={indeterminate}
      onChange={handleChange}
      disabled={loading}
      label="Tout facturer"
      size="sm"
    />
  );
};
