import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#fafafa" />
        <meta name="color-scheme" content="light" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-200 selection:text-zinc-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-zinc-400">
      <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
    </div>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="shadow-xs w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {message}
        </h1>
        <p className="mt-3 text-balance text-sm leading-relaxed text-zinc-600 sm:text-base">
          {details}
        </p>
        {stack && (
          <pre className="mt-4 w-full overflow-x-auto rounded-lg bg-zinc-100 p-3 text-left text-xs text-zinc-700 sm:p-4">
            <code>{stack}</code>
          </pre>
        )}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Reload Page
          </button>
        </div>
      </div>
    </main>
  );
}
