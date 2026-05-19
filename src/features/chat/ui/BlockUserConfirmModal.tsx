import { CenterModal } from '@/shared/ui/CenterModal';

type Props = {
  open: boolean;
  displayName: string;
  onClose: () => void;
  onConfirm: () => void;
};

/** Подтверждение блокировки пользователя. */
export function BlockUserConfirmModal({ open, displayName, onClose, onConfirm }: Props) {
  return (
    <CenterModal
      open={open}
      title="Заблокировать пользователя?"
      description={`${displayName} не сможет писать вам. Диалог скроется из списка чатов.`}
      onClose={onClose}
      confirm={{
        danger: true,
        label: 'Заблокировать',
        onConfirm,
      }}
    />
  );
}
