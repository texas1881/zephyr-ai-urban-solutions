import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Zephyr",
  description:
    "Zephyr Kentsel Saha Yönetim Sistemi kişisel verilerin korunması ve gizlilik aydınlatma metni.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Veri Sorumlusu",
    body: [
      "Zephyr Kentsel Saha Yönetim Sistemi (\"Zephyr\"), Cursor Hackathon 2026 kapsamında geliştirilen bir saha analiz uygulamasıdır. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca hazırlanmıştır.",
    ],
  },
  {
    title: "2. İşlenen Veriler ve Amaç",
    body: [
      "Zephyr, kullanıcı tarafından girilen adres/konum bilgisini yalnızca o konuma ait kamusal Street View görüntülerini almak ve çevresel temizlik/altyapı analizini yapmak için işler.",
      "Analiz, yalnızca kamusal alandaki cansız nesnelere (çöp, atık, yol hasarı, moloz vb.) odaklanır. Sistem; kişileri, yüzleri, plakaları veya diğer kişisel verileri tanımlamayı, takip etmeyi veya kaydetmeyi AMAÇLAMAZ.",
    ],
  },
  {
    title: "3. Kişisel Veri Minimizasyonu",
    body: [
      "Görüntülerdeki insanlar ve araçlar yalnızca \"ortam göstergesi\" olarak değerlendirilir; kirlilik puanına dahil edilmez ve kimlik tespiti yapılmaz.",
      "Google Street View görüntülerinde yüzler ve plakalar Google tarafından kaynağında otomatik olarak bulanıklaştırılır.",
    ],
  },
  {
    title: "4. Saklama ve Aktarım",
    body: [
      "Analiz sonuçları (adres, skor, tespit edilen durumlar) kayıt amacıyla saklanabilir; ham görüntüler kalıcı olarak depolanmaz.",
      "Görüntü analizi için Google Maps Platform ve yapay zekâ servis sağlayıcıları (Hugging Face / Google) kullanılır. Bu sağlayıcılara yalnızca analiz için gerekli teknik veriler iletilir.",
    ],
  },
  {
    title: "5. Haklarınız",
    body: [
      "KVKK m.11 kapsamında; işlenen verileriniz hakkında bilgi talep etme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz. Kayıtlar ekranından oluşturduğunuz analiz kayıtlarını dilediğiniz zaman silebilirsiniz.",
    ],
  },
  {
    title: "6. Güvenlik",
    body: [
      "Erişim, oturum (JWT) tabanlı kimlik doğrulama ile korunur. API anahtarları yalnızca sunucu tarafında tutulur ve istemciye açılmaz.",
    ],
  },
];

export default function KvkkPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-20">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
      >
        ← Panoya dön
      </Link>

      <header className="mt-6">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Gizlilik
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          KVKK Aydınlatma Metni
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Kişisel verilerin korunması Zephyr&apos;in tasarım önceliğidir. Sistem
          gizlilik-öncelikli (privacy-first) çalışır.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="glass rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          >
            <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
            <div className="mt-2 flex flex-col gap-2">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-7 text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Son güncelleme: 2026 · Cursor Hackathon 2026
      </p>
    </div>
  );
}
