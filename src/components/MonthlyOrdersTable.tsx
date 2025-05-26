import { Table, Text, Stack } from '@mantine/core';
import { CostRow } from '@/components/CostRow';
import { HandlingFeeCell } from '@/components/HandlingFeeCell';
import { OrderTotalCell } from '@/components/OrderTotalCell';
import { CalculateCostButton } from '@/components/CalculateCostButton';
import { InvoiceStatusCheckbox } from '@/components/InvoiceStatusCheckbox';
import { encodeFirestoreId } from '@/utils/firestore-id';
import type { PriceRule } from '@/hooks/usePriceRules';
import type { Order } from '@/types/orders';

interface MonthlyOrdersTableProps {
  orders: Order[];
  rules: PriceRule[];
  monthTitle: string;
}

export function MonthlyOrdersTable({ orders, rules, monthTitle }: MonthlyOrdersTableProps) {
  return (
    <Stack mb="xl">
      <Text size="lg" fw={500}>{monthTitle}</Text>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Commande</Table.Th>
            <Table.Th>Contenu</Table.Th>
            <Table.Th>Coût</Table.Th>
            <Table.Th>Manutention</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Actions</Table.Th>
            <Table.Th>Facturé</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orders.map((order) => (
            <Table.Tr key={order.id}>
              <Table.Td>
                <Text size="sm">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>
                  #{order.orderNumber}
                </Text>
              </Table.Td>
              <Table.Td>
                <Stack gap={5}>
                  {order.lineItems.map((item, index) => (
                    <CostRow
                      key={index}
                      orderId={encodeFirestoreId(order.id)}
                      item={{
                        ...item,
                        sku: item.sku || ''
                      }}
                      rules={rules}
                      index={index}
                    />
                  ))}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Stack gap={5}>
                  {order.lineItems.map((item, index) => (
                    <CostRow
                      key={index}
                      orderId={encodeFirestoreId(order.id)}
                      item={{
                        ...item,
                        sku: item.sku || ''
                      }}
                      rules={rules}
                      index={index}
                    />
                  ))}
                </Stack>
              </Table.Td>
              <Table.Td>
                <HandlingFeeCell
                  orderId={encodeFirestoreId(order.id)}
                  lineItems={order.lineItems}
                />
              </Table.Td>
              <Table.Td>
                <OrderTotalCell orderId={encodeFirestoreId(order.id)} />
              </Table.Td>
              <Table.Td>
                <CalculateCostButton
                  orderId={encodeFirestoreId(order.id)}
                  lineItems={order.lineItems}
                  rules={rules}
                />
              </Table.Td>
              <Table.Td>
                <InvoiceStatusCheckbox orderId={encodeFirestoreId(order.id)} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
