export default function AdminLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <div className="h-8 w-16 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]" />
        <div className="flex flex-col gap-1">
          <div className="h-3 w-24 rounded bg-[var(--soft)]" />
          <div className="h-5 w-40 rounded bg-[var(--soft)]" />
        </div>
        <div className="ml-auto h-8 w-44 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
          >
            <div className="h-5 w-32 rounded bg-[var(--soft)]" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]"
                />
              ))}
            </div>
            <div className="mt-2 h-10 rounded-[var(--radius)] bg-[var(--soft)]" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="h-5 w-20 rounded bg-[var(--soft)]" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]"
          />
        ))}
      </div>
    </main>
  );
}
