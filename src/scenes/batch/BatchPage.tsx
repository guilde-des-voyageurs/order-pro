'use client';

import { Container, Title, Loader, Stack } from '@mantine/core'
import { BatchPageProps } from './BatchPage.types'
import { useBatchPresenter } from './BatchPage.presenter'

export default function BatchPage({}: BatchPageProps) {
  const { batchOrders, isLoading } = useBatchPresenter()

  if (isLoading) {
    return (
      <Container>
        <Loader />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack>
        <Title order={2}>Commandes de stock</Title>
        {/* TODO: Ajouter le contenu de la page */}
      </Stack>
    </Container>
  )
}
