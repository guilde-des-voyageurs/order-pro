'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Text } from '@mantine/core';
import { SortableOptionChip } from './SortableOptionChip';
import styles from './SortOptionsBar.module.scss';

interface SortOptionsBarProps {
  options: string[];
  onReorder: (newOrder: string[]) => void;
}

export function SortOptionsBar({ options, onReorder }: SortOptionsBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.indexOf(active.id as string);
      const newIndex = options.indexOf(over.id as string);
      const newOrder = arrayMove(options, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Text size="xs" c="dimmed" className={styles.label}>
        Trier par :
      </Text>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={options} strategy={horizontalListSortingStrategy}>
          <div className={styles.chipsContainer}>
            {options.map((option, index) => (
              <div key={option} className={styles.chipWrapper}>
                <SortableOptionChip id={option} label={option} />
                {index === 0 && (
                  <span className={styles.priorityBadge}>1er</span>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
