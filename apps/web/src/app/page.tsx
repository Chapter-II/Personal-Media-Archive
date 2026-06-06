/**
 * M1.2 占位首页。
 *
 * UI 真正在 M6（收藏夹 + 时间线 + 详情页）落实。
 * 这里只确认 Tailwind 与 SSR 都跑得起来。
 */
export default function Home(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-6 p-10">
      <h1 className="text-3xl font-semibold text-slate-100">Personal Media Archive</h1>
      <p className="text-slate-400">
        Backend skeleton is up. The full Web UI lands in M6 (collections + timeline + snapshots).
      </p>
      <section className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-sm font-medium text-slate-300">Health checks</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>
            <code className="rounded bg-slate-900 px-2 py-1 font-mono text-slate-300">
              GET /healthz
            </code>
            <span className="ml-3">Application liveness</span>
          </li>
          <li>
            <code className="rounded bg-slate-900 px-2 py-1 font-mono text-slate-300">
              GET /healthz/db
            </code>
            <span className="ml-3">Database connectivity</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
