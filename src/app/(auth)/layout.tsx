export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="bg-primary/15 pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
