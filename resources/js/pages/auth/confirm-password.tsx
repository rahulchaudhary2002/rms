import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

const fieldLabelClass =
    'block px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase';
const fieldInputClass =
    'block w-full rounded-xl border-none bg-muted py-4 pr-4 text-foreground transition-all placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label
                                className={fieldLabelClass}
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <div className="group relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="material-symbols-outlined text-xl text-muted-foreground transition-colors group-focus-within:text-primary">
                                        lock
                                    </span>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    tabIndex={1}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className={`${fieldInputClass} pl-11`}
                                    autoFocus
                                />
                            </div>

                            <InputError message={errors.password} />
                        </div>

                        <button
                            type="submit"
                            className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            tabIndex={2}
                            disabled={processing}
                            data-test="confirm-password-button"
                        >
                            {processing && <Spinner />}
                            Confirm Password
                            <span className="material-symbols-outlined">
                                arrow_forward
                            </span>
                        </button>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm your password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
