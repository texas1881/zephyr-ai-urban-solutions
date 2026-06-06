import { DashboardShell } from "@/features/dashboard/DashboardShell";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-24">
        <section className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black">
              Z
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Zephyr
            </span>
          </div>

          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Google Vision görüntü analizi
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Temizlik Operasyon
            <br className="hidden sm:block" /> Panosu
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-muted">
            Bir adres girin; Zephyr sokağın dört yönünü görüntü analizi yapay
            zekâsı ile inceleyip çöp, kirlilik ve şehir düzeni durumunu
            raporlasın.
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
