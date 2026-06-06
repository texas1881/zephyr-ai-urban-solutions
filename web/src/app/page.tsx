import { DashboardShell } from "@/features/dashboard/DashboardShell";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-serif text-sm font-semibold text-white">
              Z
            </span>
            <div className="leading-tight">
              <p className="font-serif text-base font-semibold text-primary">
                Zephyr
              </p>
              <p className="text-[11px] text-muted">Kentsel Temizlik Analizi</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <span className="hidden sm:inline">Belediye Paneli</span>
            <span className="rounded-full border border-line px-3 py-1 text-xs">
              KVKK uyumlu
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <section className="mb-8 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">
            Yapay zekâ destekli kentsel analiz
          </p>
          <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
            Temizlik Operasyon Panosu
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
            Bir adres girerek bölgenin sokak görüntüsünü yapay zekâ ile analiz
            edin, sonuçları biriktirin ve temizlik önceliklerini takip edin.
          </p>
        </section>

        <DashboardShell />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        KVKK uyumlu · Yalnızca kamusal alandaki cansız objeler analiz edilir ·
        Cursor Hackathon 2026
      </footer>
    </div>
  );
}
