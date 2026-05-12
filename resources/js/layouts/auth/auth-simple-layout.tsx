import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const appBrandName =
    import.meta.env.VITE_APP_LOGO_NAME ||
    import.meta.env.VITE_APP_NAME ||
    'RMS';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main className="flex min-h-svh flex-col overflow-hidden bg-background font-sans text-foreground md:flex-row">
            <section className="relative hidden overflow-hidden bg-zinc-950 md:flex md:w-1/2 lg:w-3/5">
                <img
                    src="/assets/images/high-end-restaurant-kitchen-interior.png"
                    alt="High-end restaurant kitchen interior"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end p-12 lg:p-16">
                    <div className="mb-8">
                        <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold tracking-widest text-white uppercase">
                            Precision in service
                        </span>
                        <h1 className="font-headline text-5xl leading-tight font-extrabold tracking-tight text-white lg:text-7xl">
                            The Orchestrated{' '}
                            <span className="text-chart-4">Kitchen.</span>
                        </h1>
                    </div>

                    <p className="max-w-md text-lg leading-relaxed text-zinc-300">
                        Manage your restaurant&apos;s performance from one
                        focused command center.
                    </p>

                    <div className="mt-12 flex gap-8 border-t border-white/15 pt-8">
                        <div>
                            <p className="font-headline text-2xl font-bold text-white">
                                400+
                            </p>
                            <p className="text-xs tracking-tighter text-zinc-400 uppercase">
                                Kitchens Optimized
                            </p>
                        </div>
                        <div>
                            <p className="font-headline text-2xl font-bold text-white">
                                99.9%
                            </p>
                            <p className="text-xs tracking-tighter text-zinc-400 uppercase">
                                Service Uptime
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative flex flex-1 flex-col items-center justify-center bg-background p-8 pb-24 md:p-12 md:pb-24 lg:p-24 lg:pb-28">
                <div className="w-full max-w-md md:max-w-lg">
                    <Link
                        href={home()}
                        className="mb-10 flex w-full items-center gap-3"
                    >
                        <div className="signature-gradient flex h-8 w-8 items-center justify-center rounded-xl">
                            <span className="material-symbols-outlined text-lg text-white">
                                restaurant_menu
                            </span>
                        </div>
                        <span className="font-headline text-xl font-extrabold tracking-tight text-foreground">
                            {appBrandName}
                        </span>
                    </Link>

                    <header className="mb-10">
                        <h1 className="mb-2 font-headline text-3xl font-bold text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </header>

                    {children}
                </div>

                <footer className="absolute bottom-8 left-0 flex w-full items-center justify-between px-8 opacity-40">
                    <span className="text-[10px] font-medium tracking-widest uppercase">
                        © 2024 {appBrandName}
                    </span>
                    <div className="flex gap-4">
                        <span className="material-symbols-outlined text-sm">
                            help_outline
                        </span>
                        <span className="material-symbols-outlined text-sm">
                            language
                        </span>
                    </div>
                </footer>
            </section>
        </main>
    );
}
