import { mockDetections } from "@/features/detections/mockData";
import { DetectionCard } from "@/features/detections/DetectionCard";
import { SummaryBar } from "@/features/detections/SummaryBar";

export default function Home() {
  const detections = [...mockDetections].sort(
    (a, b) => b.densityScore - a.densityScore,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            Zephyr
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Kentsel Temizlik Analizi
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Temizlik Öncelik Panosu
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sokak görüntülerinden tespit edilen çöp yoğunluğuna göre sıralanmış
          temizlik öncelikleri.
        </p>
      </header>

      <SummaryBar detections={detections} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Öncelik sıralaması
        </h2>
        <ul className="flex flex-col gap-3">
          {detections.map((detection, index) => (
            <DetectionCard
              key={detection.id}
              detection={detection}
              rank={index + 1}
            />
          ))}
        </ul>
      </section>

      <footer className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
        KVKK uyumlu · Yalnızca kamusal alandaki cansız objeler analiz edilir.
      </footer>
    </main>
  );
}
