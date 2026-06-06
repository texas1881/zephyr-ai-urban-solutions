import { mockDetections } from "@/features/detections/mockData";
import { DetectionCard } from "@/features/detections/DetectionCard";
import { SummaryBar } from "@/features/detections/SummaryBar";
import { AnalyzePanel } from "@/features/analyze/AnalyzePanel";

export default function Home() {
  const detections = [...mockDetections].sort(
    (a, b) => b.densityScore - a.densityScore,
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-primary">
              Zephyr
            </span>
            <span className="hidden text-xs text-muted sm:inline">
              Kentsel Temizlik Analizi
            </span>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            KVKK uyumlu
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">
            Belediyeler için yapay zekâ destekli analiz
          </p>
          <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            Şehrin temizliğini <br className="hidden sm:block" /> haritalandırın
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted">
            Bir adres girin; Zephyr o bölgenin Google Street View görüntüsünü
            alır, yapay zekâ ile yerdeki çöp ve kirliliği tespit eder ve temizlik
            önceliğini hesaplar.
          </p>
        </section>

        <section className="mb-14">
          <AnalyzePanel />
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl text-foreground">
                Temizlik Öncelik Panosu
              </h2>
              <p className="text-sm text-muted">
                Çöp yoğunluğuna göre sıralanmış bölgeler.
              </p>
            </div>
          </div>

          <SummaryBar detections={detections} />

          <ul className="mt-6 flex flex-col gap-3">
            {detections.map((detection, index) => (
              <DetectionCard
                key={detection.id}
                detection={detection}
                rank={index + 1}
              />
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        KVKK uyumlu · Yalnızca kamusal alandaki cansız objeler analiz edilir ·
        Cursor Hackathon 2026
      </footer>
    </div>
  );
}
