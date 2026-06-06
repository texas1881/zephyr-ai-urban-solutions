# Zephyr

> Belediyeler için yapay zekâ destekli kentsel temizlik analizi platformu — **Cursor Hackathon 2026: AI-Driven Kentsel Çözümler** için geliştirildi.

Zephyr, belediyelerin saha denetim ve temizlik operasyonlarını veriye dayalı hale getirir. Model eğitmeye gerek kalmadan, **Hugging Face** üzerindeki hazır **çok-kipli (multimodal) görsel-dil modeli** (`Qwen/Qwen3-VL-8B-Instruct`) ile sokağın dört yönü incelenir; çöp, aşırı kirlilik, dolu çöp kutusu, yol hasarı, moloz ve grafiti gibi durumlar **önem ve güven skoruyla** tespit edilir, sorumlu **ekip otomatik önerilir** ve **Gemini** ile kapsamlı bir saha raporu üretilir. Ayrıca **interaktif 360° Street View** ve **JWT tabanlı güvenli oturum** sunar.

> Ayrıntılı teslim raporu için bkz. [`HACKATHON_RAPORU.md`](HACKATHON_RAPORU.md).

Sistem tamamen **KVKK uyumludur**: yalnızca kamusal alandaki cansız objeler (çöp, atık, kirli alanlar) analiz edilir. Yüz tanıma, plaka okuma veya kişi/araç takibi **yapılmaz**.

## Problem

Belediye temizlik ekipleri çoğu zaman, kirliliğin gerçekte nerede biriktiğine dair anlık bir veri olmadan sabit güzergâhlarda çalışır. Bu durum hem zaman hem bütçe kaybına yol açar; bazı alanlar gereğinden uzun süre kirli kalır.

## Çözüm

Zephyr, kamusal sokak görüntülerini uygulanabilir temizlik önceliklerine dönüştürür:

1. **Topla** — Sokak/çevre görüntüleri Google Street View API üzerinden alınır.
2. **Anonimleştir** — İşlemeden önce görüntülerdeki insan yüzleri ve araç plakaları geri döndürülemez biçimde bulanıklaştırılır (KVKK gereği).
3. **Tespit Et** — Hugging Face Inference API üzerindeki önceden eğitilmiş nesne tespiti modeli çağrılarak çöp ve çevresel kirlilik tespit edilir.
4. **Skorla** — Her konum için bir çöp yoğunluğu skoru hesaplanır.
5. **Önceliklendir** — Konumlar bir temizlik öncelik listesine/haritasına göre sıralanır.
6. **Sun** — Sonuçlar Next.js web paneli ve Expo mobil uygulaması üzerinden sunulur.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Web | Next.js + TypeScript |
| Backend | Go (Golang) — **masterfabric-go** mimarisi (zorunlu) |
| Kimlik | masterfabric-go IAM — JWT + RBAC + Postgres |
| AI — Tespit | Hugging Face çok-kipli model `Qwen/Qwen3-VL-8B-Instruct` (ücretsiz) |
| AI — Yorum | Gemini (birincil) → HF metin → yerel özet |
| Yedek CV | Google Cloud Vision → COCO (`facebook/detr-resnet-50`) |
| Veri kaynağı | Google Street View + Geocoding + Maps Embed (360°) |
| Hosting | Vercel (web), Render.com (backend + Postgres) |

## Mimari

```
        ┌──────────────────────┐
        │  Google Street View   │  4 yön (ön/arka/sağ/sol)
        │  + Geocoding          │  yüz/plaka kaynağında bulanık (Google)
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  HF çok-kipli model    │  durum tespiti (çöp/yol hasarı/...)
        │  (Qwen3-VL, eğitim yok)│  → JSON: durumlar + önem + güven
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  Gemini (yorum)        │  kapsamlı saha raporu
        │  → HF → yerel fallback │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────────────────────┐
        │  Go Backend (masterfabric-go + IAM)    │  JWT + kayıt CRUD +
        │  ekip atama + durum + istatistik       │  öncelik sıralaması
        └──────────────────┬───────────────────┘
                           ▼
                 ┌────────────────┐
                 │  Next.js Web    │  analiz / kayıtlar / öncelik panosu
                 │  (panel + 360°) │  + JWT login
                 └────────────────┘
```

Tüm HTTP API'leri tutarlı bir REST yanıt zarfı (envelope) kullanır:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "" }
```

## AI ve Cursor Kullanımı

Proje **baştan sona Cursor IDE** içinde, agentic (kurallı ajan) bir akışla geliştirildi. Hem ürünün içindeki AI hem de geliştirme sürecindeki AI şeffaf biçimde belgelenmiştir.

### Üründeki AI (model eğitimi yok — hazır modeller API ile)

| Görev | Servis / Model | Dosya |
|-------|----------------|-------|
| Görsel durum tespiti (birincil) | Hugging Face `Qwen/Qwen3-VL-8B-Instruct` (çok-kipli) | [`web/src/services/hfVisionService.ts`](web/src/services/hfVisionService.ts) |
| Kapsamlı saha raporu (yorum) | Gemini → HF metin → yerel | [`web/src/services/reportService.ts`](web/src/services/reportService.ts) |
| Ortak prompt + JSON ayrıştırma | — | [`web/src/services/situationAnalysis.ts`](web/src/services/situationAnalysis.ts) |
| Yedek görü | Google Vision → COCO (`facebook/detr-resnet-50`) | [`web/src/services/visionService.ts`](web/src/services/visionService.ts), [`huggingFaceService.ts`](web/src/services/huggingFaceService.ts) |

### Kullanılan Prompt Teknikleri

- **Yapılandırılmış çıktı (structured output)** — Modelden katı bir JSON şeması (densityScore, cleanliness, situations[]) istenir; yanıt lenient bir parser ile güvenle ayrıştırılır.
- **Negatif kısıtlama (guardrail prompting)** — Prompt, insan/araç/yangın musluğu gibi normal kent ögelerini sorun saymayı **açıkça yasaklar**; bu, yanlış pozitifleri (kalabalık ≠ kirli) ciddi şekilde azaltır.
- **Taksonomi sabitleme** — 6 sorun tipi + 4 önem derecesi enum olarak dayatılır, böylece çıktı ekip-yönlendirme mantığıyla bire bir eşleşir.
- **Düşük sıcaklık (temperature 0.2)** — tekrarlanabilir, kararlı tespit için.
- **Görev ayrıştırma** — tespit ve yorum farklı çağrılara ayrıldı; her biri bağımsız fallback zincirine sahip (dayanıklılık).

### Cursor Özellikleri ve Ruleset

- **Cursor Ruleset** — [`.cursor/rules/`](.cursor/rules/) altındaki kurallar teknoloji yığınını, feature-first mimariyi, REST zarfını, KVKK kurallarını ve commit disiplinini zorunlu kılar (`alwaysApply`).
- **Agentic akış** — Özellik iskeletleme, tipli servis üretimi, refactor ve README senkronu Cursor ajanı ile yapıldı.
- **TODO/plan yönetimi** — Çok adımlı işler ajan içi yapılandırılmış görev listesiyle yürütüldü.

### Cursor CLI / Harici CLI Otomasyonu (ekstra puan)

Geliştirme ve deploy otomasyonu, **Cursor ajanının terminal entegrasyonu üzerinden** yürütülen CLI'larla yapıldı:

- **`gcloud`** — Google Cloud API'lerini (Generative Language, Maps Embed) etkinleştirme ve API anahtarı kısıtlamalarını düzeltme ajan tarafından otomatikleştirildi.
- **`vercel`** — Production env değişkenleri eklenip `vercel --prod` ile deploy ajan üzerinden tetiklendi.
- **`render`** — Backend blueprint/servis yönetimi.
- **`git`** — Sürekli, anlamlı commit'ler ajan üzerinden atıldı (aşağıdaki commit disiplini bölümüne bakın).

### Sürekli Entegrasyon (Commit Disiplini)

Kod tek seferde değil, **anlamlı commit'lerle aşama aşama** GitHub'a işlendi (`git log` ile süreç izlenebilir). Örnek commit'ler: siyah-beyaz cam tasarım, masterfabric kayıt alanları, IAM login/session, HF vision + Gemini yorum motoru.

## KVKK ve Veri Güvenliği

Zephyr, gizliliği önceleyerek (privacy-first) geliştirilmiştir. Uygulama içi
ayrıntılı metin: **[`/kvkk`](web/src/app/kvkk/page.tsx)**.

- **Amaç sınırlaması** — Model promptu yalnızca cansız kentsel objeleri (çöp, atık, dolu çöp kutusu, hasarlı yol, moloz, grafiti) hedef alır; bu, sistemde **enum olarak dayatılır**.
- **Kişisel veri yok** — Kimlik tespiti, yüz tanıma, plaka okuma veya profilleme **yapılmaz**. İnsan/araç yalnızca "ortam göstergesi" olarak işaretlenir, **kirlilik skoruna katılmaz**.
- **Kaynakta anonimleştirme** — Google Street View görüntülerinde yüzler ve plakalar Google tarafından kaynağında geri döndürülemez biçimde bulanıklaştırılır; kendi modelimizi eğitmediğimiz için ek ham veri seti tutulmaz.
- **Veri minimizasyonu** — Ham görüntüler kalıcı depolanmaz; yalnızca analiz sonuçları (skor, durumlar) saklanır. API anahtarları yalnızca sunucu tarafındadır, açık repoya yüklenmez.
- **Güvenli erişim** — Backend bağlıyken erişim JWT oturum ile korunur.
- **Silme taahhüdü** — Hackathon sonunda tüm geçici görüntü önbellekleri kalıcı olarak silinir; bu durum belgelenir.

## Depo Yapısı

```
zephyr-ai-urban-solutions/
├─ web/        # Next.js paneli (dinamik dashboard) + AI inference API route'ları
├─ backend/    # masterfabric-go (zorunlu mimari) + Zephyr kayıt API'si (cmd/zephyr)
└─ .cursor/    # Cursor agentic ruleset
```

Web paneli üç modülden oluşur ve üstteki dinamik menüyle modüller arası geçiş yapılır:
**Analiz** (adres → Street View → AI tespiti), **Kayıtlar** (veri birikimi + istatistik),
**Pano** (temizlik öncelik listesi).

## Kurulum ve Çalıştırma

### Web (Next.js)

```bash
cd web
npm install
cp .env.example .env.local   # anahtarları doldur
npm run dev                  # http://localhost:3000
```

Ortam değişkenleri (`web/.env.local`):

| Değişken | Açıklama |
|----------|----------|
| `GOOGLE_STREET_VIEW_API_KEY` | Google Street View Static API anahtarı (sunucu tarafı) |
| `HUGGINGFACE_API_TOKEN` | Hugging Face Inference API token'ı ("Inference Providers" izinli) |
| `HF_DETECTION_MODEL` | Kullanılacak nesne tespiti modeli (varsayılan `facebook/detr-resnet-50`) |
| `NEXT_PUBLIC_BACKEND_URL` | Go backend adresi (boş bırakılırsa lokal mock API kullanılır) |

> Anahtarlar olmadan da panel, örnek (mock) verilerle çalışır. `GET /api/analyze` için Street View ve Hugging Face anahtarları gereklidir.

### Backend (masterfabric-go)

Backend, zorunlu **masterfabric-go** mimarisi üzerine kuruludur. Zephyr'in
veri-biriktirme bağlamı (analiz kayıtları) bu repo içine clean-architecture
katlarıyla (`internal/zephyr/{domain,store,transport}`) eklenmiştir.

Zephyr kayıt API'si (Postgres gerektirmez, bellek-içi depo):

```bash
cd backend
go run ./cmd/zephyr     # http://localhost:8080
```

Tam masterfabric-go platformu (Postgres/Redis/Kafka ile):

```bash
cd backend
make run        # http://localhost:8080  (Docker gerektirir)
./dev.sh        # hot-reload
```

**Kayıt API uçları** (`{ success, data }` zarfı):

- `POST /api/v1/records` — yeni analiz kaydı ekle
- `GET /api/v1/records` — kayıtları listele (yeniden eskiye)
- `GET /api/v1/records/stats` — toplu istatistikler
- `GET /health/live` — canlılık kontrolü

Web paneli `NEXT_PUBLIC_BACKEND_URL` tanımlıysa kayıtları bu API'ye gönderir;
tanımlı değilse veriyi tarayıcıda (localStorage) biriktirir.

## Deploy (Render + Vercel)

### 1. Backend → Render.com

1. [render.com](https://render.com) → **New** → **Blueprint**
2. `texas1881/zephyr-ai-urban-solutions` reposunu bağla
3. Kökteki `render.yaml` otomatik olarak **Postgres** + **zephyr-backend** web servisini oluşturur
4. Deploy bitince URL: `https://zephyr-backend-2mtm.onrender.com`
5. İlk açılışta migration'lar otomatik çalışır; `GET /health/live` ile kontrol edin

### 2. Web → Vercel

1. Vercel projesinde **Root Directory** = `web`
2. Production ortam değişkenleri (Vercel → Settings → Environment Variables):

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://zephyr-backend-2mtm.onrender.com` |
| `HUGGINGFACE_API_TOKEN` | **Birincil** görsel analiz (HF vision) + rapor yedeği |
| `HF_VISION_MODEL` | Tespit modeli (varsayılan `Qwen/Qwen3-VL-8B-Instruct`) |
| `GEMINI_API_KEY` | Kapsamlı rapor (yorum amaçlı) — Google AI Studio `AIza...` |
| `GOOGLE_STREET_VIEW_API_KEY` | Street View + Geocoding (sunucu tarafı) |
| `NEXT_PUBLIC_MAPS_EMBED_KEY` | İnteraktif 360° Street View (Maps Embed API) |

3. `NEXT_PUBLIC_BACKEND_URL` dolu olduğunda panel **login zorunlu** olur; kayıtlar JWT ile backend'e senkronlanır.
4. Boş bırakılırsa demo modu (localStorage, auth kapalı) devam eder.

```bash
cd web
vercel --prod
```

## Ekip

| Rol | Üyeler |
|-----|--------|
| Web Geliştirici | Mert Ali Işık, Yunus Emre Günaydın |
| Mobil Geliştirici | Asaf Güner |
| Dokümantasyon | Ege Dündar |
| Backend / AI | Mert Ali Işık, Yunus Emre Günaydın |

## Lisans

Cursor Hackathon 2026 için geliştirilmiştir.
