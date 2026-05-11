export default function RequestLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]" />
        <div className="ml-auto h-8 w-40 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="hidden flex-col gap-2 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]"
            />
          ))}
        </aside>
        <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="h-7 w-2/3 rounded bg-[var(--soft)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--soft)]" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-[var(--radius)] bg-[var(--soft)]"
              />
            ))}
          </div>
          <div className="mt-2 h-24 rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)]" />
        </section>
        <aside className="hidden flex-col gap-3 xl:flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]"
            />
          ))}
        </aside>
      </div>
    </main>
  );
}
