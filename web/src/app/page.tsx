import Link from "next/link";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { HeroScanner } from "@/components/HeroScanner";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-20">
        <section className="relative mb-10 text-center">
          <HeroScanner className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]" />

          <div className="relative">
            <div className="mb-5 flex items-center justify-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-bold text-black">
                Z
              </span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Zephyr
              </span>
            </div>

            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Yapay zekâ destekli saha analizi
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Kentsel Saha
              <br className="hidden sm:block" /> Yönetim Panosu
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-muted">
              Bir adres girin; Zephyr sokağın dört yönünü yapay zekâ ile inceleyip
              çöp, kirlilik ve altyapı sorunlarını tespit etsin, ilgili ekibi
              önersin ve kapsamlı bir saha raporu üretsin.
            </p>
          </div>
        </section>

        <DashboardShell />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        <Link href="/kvkk" className="underline-offset-2 hover:text-foreground hover:underline">
          KVKK Aydınlatma Metni
        </Link>{" "}
        · Yalnızca kamusal alandaki cansız objeler analiz edilir · Cursor
        Hackathon 2026
      </footer>
    </div>
  );
}
