import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-neutral-200">404</p>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          The page you&#39;re looking for doesn&#39;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
      >
        Go home
      </Link>
    </div>
  );
}
