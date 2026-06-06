# Zephyr

> Belediyeler için yapay zekâ destekli kentsel temizlik analizi platformu — **Cursor Hackathon 2026: AI-Driven Kentsel Çözümler** için geliştirildi.

Zephyr, belediyelerin çevre temizliği operasyonlarını iyileştirmelerine yardımcı olur. Model eğitmeye gerek kalmadan, **Hugging Face Inference API** üzerindeki hazır (önceden eğitilmiş) bir nesne tespiti modeli kullanılarak sokak görüntülerindeki yerde bulunan çöp ve çevresel kirlilik tespit edilir, **çöp yoğunluğu** hesaplanır, bir **temizlik önceliği haritası** oluşturulur ve belediyelerin temizlik operasyonlarını daha verimli planlaması sağlanır.

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
| Mobil | Expo |
| Backend | Go (Golang) — **masterfabric-go** mimarisi (zorunlu) |
| AI / CV | Hugging Face Inference API (`facebook/detr-resnet-50`, nesne tespiti) |
| Veri kaynağı | Google Street View API |
| Hosting | Vercel (web), Render.com (backend) |

## Mimari

```
                 ┌─────────────────────┐
                 │  Google Street View  │
                 │        API           │
                 └──────────┬──────────┘
                            │ görüntüler
                            ▼
                 ┌─────────────────────┐
                 │   Anonimleştirme     │  yüz & plaka bulanıklaştırma (KVKK)
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  HF Inference API    │  çöp / kirlilik tespiti
                 │  (nesne tespiti)     │  (eğitim yok, hazır model)
                 └──────────┬──────────┘
                            ▼
        ┌──────────────────────────────────────┐
        │  Go Backend (masterfabric-go)         │
        │  yoğunluk skoru + öncelik sıralaması   │
        └───────────┬───────────────┬──────────┘
                    ▼               ▼
        ┌────────────────┐  ┌────────────────┐
        │  Next.js Web    │  │   Expo Mobil   │
        │  (panel)        │  │   (saha uyg.)  │
        └────────────────┘  └────────────────┘
```

Tüm HTTP API'leri tutarlı bir REST yanıt zarfı (envelope) kullanır:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "" }
```

## AI ve Cursor Kullanımı

Proje tamamen **Cursor IDE** içinde, agentic (kurallı ajan) bir akışla geliştirilmektedir.

- **Cursor Ruleset** — Proje genelindeki kurallar [`.cursor/rules/hackathon-rules.mdc`](.cursor/rules/hackathon-rules.mdc) dosyasında yer alır ve teknoloji yığınımızı, feature-first mimariyi, REST kurallarını, KVKK kurallarını ve commit disiplinini zorunlu kılar. Kurallar `alwaysApply: true` olduğundan her ajan aksiyonu hackathon kısıtlarına otomatik uyar.
- **Prompt Kullanımı** — Cursor ajanı; özellikleri iskeletlemek, tipli servisler üretmek ve README'yi kod tabanıyla senkron tutmak için kullanılır.
- **Hugging Face Inference API** — Kendi modelimizi eğitmek yerine, barındırılan önceden eğitilmiş bir nesne tespiti modeli (`facebook/detr-resnet-50`; COCO sınıfları çöp temsilcisi olarak kullanılır) çağrılır. `HF_DETECTION_MODEL` ortam değişkeniyle TACO ile fine-tune edilmiş bir çöp modeline geçilebilir. Entegrasyon [`web/src/services/huggingFaceService.ts`](web/src/services/huggingFaceService.ts) içindedir ve `GET /api/analyze?lat=&lng=` ile sunulur.

> _Bu bölüm, AI akışı geliştikçe (Cursor CLI / SDK otomasyonları dâhil) güncel tutulur._

## KVKK ve Veri Güvenliği

Zephyr, gizliliği önceleyerek geliştirilmiştir:

- **Amaç sınırlaması** — Modeller yalnızca cansız kentsel objeleri (çöp, atık, hasarlı yol vb.) hedef alır.
- **Kişisel veri yok** — Kimlik tespiti, yüz tanıma, plaka okuma veya profilleme yapılmaz.
- **Zorunlu anonimleştirme** — İnsan yüzleri ve araç plakaları model işlemeden önce geri döndürülemez biçimde bulanıklaştırılır.
- **Veri güvenliği** — Ham görüntüler asla açık repolara veya şifrelenmemiş depolamaya yüklenmez.
- **Silme taahhüdü** — Hackathon sonunda tüm ham görüntüler kalıcı olarak silinir ve bu durum yazılı olarak belgelenir.

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

## Deploy

- **Web → Vercel:** `web/` klasörü kök (root) olacak şekilde Vercel'e bağlanır; ortam değişkenleri Vercel panelinden tanımlanır.
- **Backend → Render.com:** `backend/` klasörü Go servisi olarak deploy edilir.

## Ekip

| Rol | Üyeler |
|-----|--------|
| Web Geliştirici | Mert Ali Işık, Yunus Emre Günaydın |
| Mobil Geliştirici | Asaf Güner |
| Dokümantasyon | Ege Dündar |
| Backend / AI | Mert Ali Işık, Yunus Emre Günaydın |

## Lisans

Cursor Hackathon 2026 için geliştirilmiştir.
