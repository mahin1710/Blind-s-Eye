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
      <body className="min-h-dvh flex flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-200 selection:text-zinc-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400">
      <div className="size-6 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
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
    <main className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
      <div className="w-full rounded-2xl bg-white p-6 sm:p-8 shadow-xs border border-zinc-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">
          {message}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed text-balance">
          {details}
        </p>
        {stack && (
          <pre className="mt-4 w-full p-3 sm:p-4 rounded-lg bg-zinc-100 text-xs text-left text-zinc-700 overflow-x-auto">
            <code>{stack}</code>
          </pre>
        )}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </main>
  );
}
