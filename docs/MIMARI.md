# Zephyr — Mimari ve Klasör Yapısı

> Bu belge, projenin **modüler yapısını** ve her katmanın ne işe yaradığını
> tek bakışta anlaşılır biçimde açıklar. Hem web (Next.js) hem backend (Go
> · masterfabric-go) ayrı ayrı, sorumlulukları net ayrılmış modüllerden oluşur.

---

## 1. Üst Düzey Yapı

```
zephyr-ai-urban-solutions/
├── web/        → Next.js 16 web paneli (frontend + API route'ları)
├── backend/    → Go (masterfabric-go) — katmanlı backend + IAM + Postgres
├── docs/       → Dokümanlar (rapor, KVKK belgesi, sunum, bu mimari)
├── .cursor/    → Cursor agentic kuralları (ruleset)
├── render.yaml → Render.com backend deploy tanımı
└── README.md   → Genel tanıtım ve çalıştırma rehberi
```

İki bağımsız çalıştırılabilir parça vardır:
- **web** → Vercel'de yayınlanır.
- **backend** → Render.com'da yayınlanır (Postgres ile).

Web, `NEXT_PUBLIC_BACKEND_URL` tanımlıysa backend'e bağlanır (JWT login);
boşsa localStorage tabanlı demo modunda çalışır.

---

## 2. Web — Feature-First Modüler Yapı

```
web/src/
├── app/                    → Next.js App Router (sayfa + sunucu API uçları)
│   ├── page.tsx            → Ana sayfa (hero + panel girişi)
│   ├── layout.tsx          → Kök layout + metadata
│   ├── kvkk/page.tsx       → KVKK Aydınlatma Metni sayfası
│   └── api/                → Sunucu tarafı API route'ları
│       ├── analyze/        → Adres → 4 yön → AI tespit → rapor
│       └── streetview/     → Street View görsel köprüsü
│
├── features/               → İŞ MODÜLLERİ (her biri kendi içinde kapalı)
│   ├── analyze/            → Analiz paneli, sonuç görünümü, durum/etiket mantığı
│   ├── auth/               → AuthProvider + LoginView (JWT oturum)
│   ├── dashboard/          → Pano (öncelik tablosu, gerçek kayıttan)
│   ├── detections/         → Tespit kartı, öncelik, özet bar
│   ├── navigation/         → DynamicNav (dinamik ada benzeri menü)
│   └── records/            → Kayıt listesi, istatistik, useRecords hook
│
├── components/             → Paylaşılan, modülden bağımsız UI parçaları
│   ├── HeroScanner.tsx     → Dekoratif SVG radar animasyonu
│   └── ModuleCard.tsx      → Genel kart bileşeni
│
├── services/               → DIŞ DÜNYA KATMANI (tek sorumluluk: I/O)
│   ├── apiClient.ts        → Backend istemcisi (JWT, base URL)
│   ├── geocodeService.ts   → Adres → koordinat
│   ├── streetViewService.ts→ Street View URL/metadata
│   ├── hfVisionService.ts  → Hugging Face görsel analiz (birincil tespit)
│   ├── situationAnalysis.ts→ Ortak prompt + JSON ayrıştırma
│   ├── reportService.ts    → Kapsamlı rapor (Gemini → HF → yerel)
│   └── geminiVisionService.ts / visionService.ts / huggingFaceService.ts
│                            → Yedek AI sağlayıcıları (fallback zinciri)
│
└── types/
    └── api.ts              → Tüm paylaşılan tipler ve API zarfı
```

### Katman kuralı (web)
```
app (route) → features (iş mantığı + UI) → services (dış çağrı) → types
```
- **app** yalnızca yönlendirme ve API uçlarını tanımlar.
- **features** her biri bağımsız bir iş modülüdür; başka feature'a sıkı
  bağımlılık kurmaz.
- **services** dış sistemlerle (Google, HF, backend) tek temas noktasıdır.
- **types** tüm katmanların ortak sözleşmesidir.

---

## 3. Backend — Clean Architecture (masterfabric-go)

```
backend/internal/
├── domain/            → SAF İŞ KURALLARI (çerçeveden bağımsız)
│   ├── iam/           → Kimlik: model, repository arayüzü, event, service
│   ├── cleanliness/   → Saha kaydı: model + repository arayüzü
│   ├── tenant/        → Organizasyon/kiracı
│   ├── apimanagement/ → API anahtarı/endpoint yönetimi
│   └── audit/         → Denetim kayıtları
│
├── application/       → KULLANIM SENARYOLARI (use case + DTO)
│   ├── iam/           → register, login use case'leri
│   ├── cleanliness/   → kayıt oluştur/listele/sil/ata/durum + istatistik
│   ├── tenant/        → org yönetimi
│   └── apimanagement/ → endpoint/anahtar senaryoları
│
├── infrastructure/    → TEKNİK DETAYLAR (çerçeve, DB, HTTP)
│   ├── http/
│   │   ├── handler/   → HTTP handler'lar (iam, cleanliness, health, tenant…)
│   │   └── router/    → Chi router + middleware + CORS
│   ├── postgres/      → Postgres repository implementasyonları + migration
│   ├── memory/        → Bellek-içi repo (demo/test için)
│   ├── auth/          → JWT üretimi/doğrulaması
│   └── kafka/         → Event akışı
│
└── shared/            → ORTAK ALTYAPI (config, logger, errors, response,
                         middleware, validator, pagination, telemetry…)
```

### Bağımlılık yönü (backend)
```
infrastructure → application → domain
        (dıştan içe; domain hiçbir dış katmanı tanımaz)
```
- **domain** hiçbir şeye bağımlı değildir (en kararlı çekirdek).
- **application** domain'i kullanır, senaryoları yürütür.
- **infrastructure** her şeyi somutlaştırır (DB, HTTP, JWT).
- **shared** tüm katmanların kullandığı yardımcılardır.

---

## 4. Uçtan Uca İstek Akışı

```
[web] Adres girişi
   → app/api/analyze (route)
      → services/geocodeService     (adres → koordinat)
      → services/streetViewService  (4 yön görsel)
      → services/hfVisionService    (AI tespit · birincil)
      → services/reportService      (Gemini → HF → yerel rapor)
   → features/analyze/AnalysisResultView (sonuç + 360°)
   → features/records (kayıt) ── JWT ──> [backend]
                                            → http/handler/cleanliness
                                            → application/cleanliness/usecase
                                            → domain/cleanliness (kural)
                                            → infrastructure/postgres (kalıcı)
```

---

## 5. Neden Bu Yapı?

- **Anlaşılır:** Klasör adı = sorumluluk. "auth nerede?" → `features/auth`.
- **Modüler:** Bir modülü değiştirmek diğerlerini bozmaz (gevşek bağlılık).
- **Test edilebilir:** İş kuralları (domain/use case) dış sistemlerden ayrık.
- **Kurala uygun:** Backend, hackathon zorunluluğu olan masterfabric-go
  katmanlı mimarisini birebir izler.
- **Dayanıklı:** AI ve dış servis çağrıları `services/` altında izole;
  fallback zincirleri tek yerde yönetilir.
