import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: string;
    children: ReactNode;
};

export function FormSection({ title, description, children }: Props) {
    const panelClass = 'rounded-xl border border-border bg-card p-6';

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <h3 className="text-lg font-bold text-primary dark:text-primary">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground dark:text-stone-400">{description}</p>
            </div>

            <div className={`${panelClass} space-y-5 lg:col-span-2`}>{children}</div>
        </div>
    );
}
