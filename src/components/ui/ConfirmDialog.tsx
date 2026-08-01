"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Shared destructive-action confirmation, per the app's "always confirm before deletion" rule. */
export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="!bg-danger !text-white hover:!opacity-90"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-small text-graphite">{message}</p>
    </Modal>
  );
}
