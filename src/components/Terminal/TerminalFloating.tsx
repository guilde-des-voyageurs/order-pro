'use client';

import { useEffect, useRef } from 'react';
import { Paper, Text, Group, ActionIcon, Button, Badge, Loader, Stack } from '@mantine/core';
import { IconTerminal2, IconX, IconMinus, IconMaximize } from '@tabler/icons-react';
import { useTerminal } from '@/contexts/TerminalContext';
import styles from './TerminalFloating.module.scss';

export function TerminalFloating() {
  const { 
    logs, 
    isOpen, 
    isMinimized, 
    isSyncing, 
    title, 
    actions,
    toggle, 
    close, 
    minimize, 
    maximize 
  } = useTerminal();
  
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux logs arrivent
  useEffect(() => {
    if (terminalRef.current && !isMinimized) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  // Ne pas afficher si pas ouvert
  if (!isOpen) return null;

  // Mode minimisé - juste une icône flottante
  if (isMinimized) {
    return (
      <div className={styles.minimizedContainer}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color={isSyncing ? 'blue' : 'dark'}
          onClick={toggle}
          className={styles.minimizedButton}
        >
          {isSyncing ? (
            <Loader size={20} color="white" />
          ) : (
            <IconTerminal2 size={24} />
          )}
        </ActionIcon>
        {logs.length > 0 && (
          <Badge 
            size="xs" 
            color={logs.some(l => l.type === 'error') ? 'red' : 'blue'}
            className={styles.badge}
          >
            {logs.length}
          </Badge>
        )}
      </div>
    );
  }

  // Mode étendu - terminal complet
  return (
    <Paper 
      className={styles.container}
      shadow="xl"
      radius="md"
      withBorder
    >
      {/* Header */}
      <div className={styles.header}>
        <Group gap="xs">
          <IconTerminal2 size={18} />
          <Text size="sm" fw={600}>{title}</Text>
          {isSyncing && <Loader size={14} />}
        </Group>
        <Group gap={4}>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={minimize}>
            <IconMinus size={14} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={close}>
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </div>

      {/* Logs */}
      <div ref={terminalRef} className={styles.logs}>
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`${styles.logLine} ${styles[log.type]}`}
          >
            {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            En attente de logs...
          </Text>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && !isSyncing && (
        <div className={styles.actions}>
          <Group gap="xs" justify="flex-end">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="xs"
                color={action.color || 'blue'}
                leftSection={action.icon}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Group>
        </div>
      )}
    </Paper>
  );
}
