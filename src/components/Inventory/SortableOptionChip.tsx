'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import styles from './SortableOptionChip.module.scss';

interface SortableOptionChipProps {
  id: string;
  label: string;
}

export function SortableOptionChip({ id, label }: SortableOptionChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.chip} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <IconGripVertical size={14} className={styles.gripIcon} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
