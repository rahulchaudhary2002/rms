import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';

type ConfirmOptions = {
    title?: string;
    confirmLabel?: string;
    variant?: 'danger' | 'default';
};

type State = {
    open: boolean;
    description: string;
    title: string;
    confirmLabel: string;
    variant: 'danger' | 'default';
    onConfirm: () => void;
};

const CLOSED: State = { open: false, description: '', title: 'Confirm', confirmLabel: 'Confirm', variant: 'default', onConfirm: () => {} };

export function useConfirm() {
    const [state, setState] = useState<State>(CLOSED);

    function confirm(description: string, onConfirm: () => void, options: ConfirmOptions = {}) {
        setState({
            open: true,
            description,
            title: options.title ?? 'Confirm',
            confirmLabel: options.confirmLabel ?? 'Confirm',
            variant: options.variant ?? 'default',
            onConfirm,
        });
    }

    function close() {
        setState((s) => ({ ...s, open: false }));
    }

    const dialog = (
        <ConfirmDialog
            open={state.open}
            title={state.title}
            description={state.description}
            confirmLabel={state.confirmLabel}
            variant={state.variant}
            onConfirm={() => { state.onConfirm(); close(); }}
            onClose={close}
        />
    );

    return { confirm, dialog };
}
