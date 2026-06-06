import Link from "next/link";
import { Building2, MapPinned, ScanSearch, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { CityGridBg } from "@/components/CityGridBg";
import { ZephyrLogo } from "@/components/ZephyrLogo";

const STATS = [
  { icon: MapPinned, label: "4 yön tarama", desc: "Street View" },
  { icon: ScanSearch, label: "Yapay zekâ tespiti", desc: "Çok modlu analiz" },
  { icon: Building2, label: "Belediye entegrasyonu", desc: "Ekip yönlendirme" },
  { icon: ShieldCheck, label: "KVKK uyumlu", desc: "Cansız obje analizi" },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-24">
        <section className="relative mb-12">
          <CityGridBg className="pointer-events-none absolute -right-8 -top-8 h-[360px] w-[360px] opacity-80 [mask-image:radial-gradient(circle,black,transparent_72%)]" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <ZephyrLogo size={44} showWordmark className="mb-6" />

              <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary-soft">
                Belediye Saha Denetim Platformu
              </p>
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                Kentsel Saha Yönetim Sistemi
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted">
                Adres bazlı çevre analizi: dört yönlü görüntü taraması, yüksek
                doğruluklu yapay zekâ tespiti, önceliklendirilmiş müdahale
                önerileri ve kurumsal raporlama.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 lg:gap-2 xl:grid-cols-4">
              {STATS.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="glass flex flex-col gap-1.5 rounded-xl px-4 py-3"
                >
                  <Icon size={18} className="text-primary" strokeWidth={1.8} />
                  <span className="text-xs font-semibold text-foreground">
                    {label}
                  </span>
                  <span className="text-[10px] text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DashboardShell />
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-1.5 border-t border-line py-6 text-center text-xs text-muted">
        <ShieldCheck size={13} className="text-primary/70" />
        <Link
          href="/kvkk"
          className="underline-offset-2 hover:text-primary-soft hover:underline"
        >
          KVKK Aydınlatma Metni
        </Link>
        · Yalnızca kamusal alandaki cansız objeler analiz edilir · Cursor
        Hackathon 2026
      </footer>
    </div>
  );
}
