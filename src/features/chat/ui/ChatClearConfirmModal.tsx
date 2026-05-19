import { CenterModal } from '@/shared/ui/CenterModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Лаконичное подтверждение очистки истории чата. */
export function ChatClearConfirmModal({ open, onClose, onConfirm }: Props) {
  return (
    <CenterModal
      open={open}
      title="Очистить историю?"
      description="Только у вас. У собеседника сообщения останутся."
      onClose={onClose}
      confirm={{
        danger: true,
        label: 'Очистить',
        onConfirm,
      }}
    />
  );
}
