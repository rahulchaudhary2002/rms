import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
// import { store } from '@/routes/register';

const fieldLabelClass =
    'block px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase';
const fieldInputClass =
    'block h-auto w-full rounded-xl border-none bg-muted px-4 py-4 text-base text-foreground transition-all placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-primary dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800';

export default function Register() {
    return (
        <>
            <Head title="Register" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="space-y-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label
                                    className={fieldLabelClass}
                                    htmlFor="name"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                    className={fieldInputClass}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    className={fieldLabelClass}
                                    htmlFor="email"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    className={fieldInputClass}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    className={fieldLabelClass}
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    className={fieldInputClass}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    className={fieldLabelClass}
                                    htmlFor="password_confirmation"
                                >
                                    Confirm Password
                                </label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    className={fieldInputClass}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <button
                                type="submit"
                                className="signature-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                tabIndex={5}
                                data-test="register-user-button"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Create Account
                                <span className="material-symbols-outlined">
                                    arrow_forward
                                </span>
                            </button>
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?
                                <TextLink
                                    href={login()}
                                    className="ml-1 font-bold text-primary hover:underline"
                                    tabIndex={6}
                                >
                                    Log in
                                </TextLink>
                            </p>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create Account',
    description: 'Set up your kitchen command center in minutes.',
};
