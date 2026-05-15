import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
// import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const fieldLabelClass =
    'block px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase';
const fieldInputClass =
    'block w-full rounded-xl border-none bg-muted py-4 pr-4 text-foreground transition-all placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800';

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label
                                    className={fieldLabelClass}
                                    htmlFor="email"
                                >
                                    Email Address
                                </label>
                                <div className="group relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                        <span className="material-symbols-outlined text-xl text-muted-foreground transition-colors group-focus-within:text-primary">
                                            mail
                                        </span>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="Email Address"
                                        className={`${fieldInputClass} pl-11`}
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <label
                                        className={fieldLabelClass}
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                                            tabIndex={5}
                                        >
                                            Forgot Password?
                                        </TextLink>
                                    )}
                                </div>
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
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className={`${fieldInputClass} pl-11`}
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    value="on"
                                    tabIndex={3}
                                />
                                <label
                                    htmlFor="remember"
                                    className="ml-3 block text-sm font-medium text-muted-foreground"
                                >
                                    Keep me logged in for 30 days
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Sign In
                                <span className="material-symbols-outlined">
                                    arrow_forward
                                </span>
                            </button>
                        </div>

                        {/* {canRegister && (
                            <div className="mt-12 text-center">
                                <p className="text-sm text-muted-foreground">
                                    New to RMS?
                                    <TextLink
                                        href={register()}
                                        className="ml-1 font-bold text-primary hover:underline"
                                        tabIndex={5}
                                    >
                                        Create an account
                                    </TextLink>
                                </p>
                            </div>
                        )} */}
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Welcome Back',
    description: 'Sign in to orchestrate your daily operations.',
};
