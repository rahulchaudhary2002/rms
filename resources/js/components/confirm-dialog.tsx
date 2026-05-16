import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    title?: string;
    description: string;
    confirmLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmDialog({
    open,
    title = 'Confirm',
    description,
    confirmLabel = 'Confirm',
    variant = 'default',
    onConfirm,
    onClose,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => { onConfirm(); onClose(); }}
                        className={cn(
                            'rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow transition-all hover:opacity-90',
                            variant === 'danger' ? 'bg-destructive' : 'bg-primary',
                        )}
                    >
                        {confirmLabel}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
