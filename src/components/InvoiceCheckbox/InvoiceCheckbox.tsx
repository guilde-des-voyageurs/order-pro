'use client';

import { Checkbox, Group, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';
import { formatAmount } from '@/utils/format-helpers';

interface InvoiceCheckboxProps {
  orderId: string;
  totalAmount?: number;
  currency?: string;
  readOnly?: boolean;
}

export function useInvoiceStatus(orderId: string) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) {
      setLoading(false);
      return;
    }

    const loadInvoiceStatus = async () => {
      const { data } = await supabase
        .from('order_invoices')
        .select('invoiced')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      if (data) {
        setChecked(data.invoiced || false);
      } else {
        setChecked(false);
      }
      setLoading(false);
    };

    loadInvoiceStatus();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`invoice-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_invoices', 
          filter: `order_id=eq.${orderId}` 
        },
        (payload) => {
          if (payload.new && 'invoiced' in payload.new) {
            setChecked(payload.new.invoiced as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  return { isInvoiced: checked, loading };
}

export function InvoiceCheckbox({ orderId, totalAmount, currency, readOnly = false }: InvoiceCheckboxProps) {
  const { isInvoiced: checked, loading } = useInvoiceStatus(orderId);
  const { currentShop } = useShop();

  const handleChange = async (newChecked: boolean) => {
    if (!currentShop) return;

    await supabase
      .from('order_invoices')
      .upsert({
        shop_id: currentShop.id,
        order_id: orderId,
        invoiced: newChecked,
        updated_at: new Date().toISOString()
      }, { onConflict: 'shop_id,order_id' });
  };

  if (loading) {
    return <Checkbox checked={false} disabled />;
  }

  return (
    <Group gap="xs" align="center">
      <Checkbox
        checked={checked}
        onChange={readOnly ? undefined : (event) => handleChange(event.currentTarget.checked)}
        label={totalAmount === undefined ? "Facturé" : undefined}
        disabled={readOnly}
      />
      {totalAmount !== undefined && (
        <Text size="sm" fw={500}>{formatAmount(totalAmount)} {currency}</Text>
      )}
    </Group>
  );
}
