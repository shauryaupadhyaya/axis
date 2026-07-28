"use client";

import { ReactNode, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";

export interface DndColumn<T> {
  id: string;
  title: string;
  items: T[];
}

interface DndBoardProps<T extends { id: string }> {
  columns: DndColumn<T>[];
  renderCard: (item: T) => ReactNode;
  onDrop: (itemId: string, toColumnId: string) => void;
}

export function DndBoard<T extends { id: string }>({ columns, renderCard, onDrop }: DndBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeItem = columns.flatMap((c) => c.items).find((i) => i.id === activeId);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const toColumnId = String(over.id);
    onDrop(String(active.id), toColumnId);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <BoardColumn key={column.id} column={column} renderCard={renderCard} />
        ))}
      </div>
      <DragOverlay>{activeItem ? <div className="opacity-90">{renderCard(activeItem)}</div> : null}</DragOverlay>
    </DndContext>
  );
}

function BoardColumn<T extends { id: string }>({
  column,
  renderCard,
}: {
  column: DndColumn<T>;
  renderCard: (item: T) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-alabaster p-3 min-h-[200px] transition-fast",
        isOver ? "bg-tuscan/10" : "bg-transparent"
      )}
    >
      <h3 className="text-h3 mb-3 px-1">{column.title}</h3>
      <div className="flex flex-col gap-2">
        {column.items.map((item) => (
          <DraggableCard key={item.id} id={item.id}>
            {renderCard(item)}
          </DraggableCard>
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}
