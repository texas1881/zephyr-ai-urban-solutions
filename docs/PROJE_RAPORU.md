# Zephyr — Kapsamlı Proje Raporu

> **Kentsel Saha Yönetim Sistemi** · Cursor Hackathon 2026  
> Son güncelleme: Haziran 2026

---

## 1. Yönetici Özeti

**Zephyr**, belediye saha denetimini veriye dayalı hale getiren bir karar destek sistemidir. Kullanıcı adres girer; sistem **360° Street View** (8×45° panorama), **çoklu ajan yapay zekâ** (Vision → Thinking → Arbiter), **OWL/DETR kanıt katmanı** ve **bounding box overlay** ile çevresel sorunları tespit eder, ekip önerir ve Türkçe saha raporu üretir.

| Metrik | Değer |
|--------|-------|
| Benchmark skoru | **9.2/10** (11/12 vaka, yerel) |
| Production web | https://web-zephyr8.vercel.app |
| Backend | https://zephyr-backend-2mtm.onrender.com |
| Analiz süresi | ~30–50 sn/konum |

---

## 2. Sistem Mimarisi (Güncel)

```
Adres → Geocoding → Street View (8 kare, fov=66, pitch=-8)
      → OWL/DETR/Grounding DINO (kanıt)
      → Vision Agent (Qwen-VL zinciri)
      → Thinking Reviewer (görsel doğrulama)
      → Arbiter (tutarlılık)
      → Doğrulama + zenginleştirme
      → Rapor (HF metin → yerel)
      → UI (overlay + kayıt)
```

### Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Web | Next.js 16, TypeScript, Framer Motion |
| AI tespit | HF OWLv2 + DETR-101 + Grounding DINO (opsiyonel) |
| AI VLM | Qwen3-VL 30B → 8B → Qwen2.5-VL (fallback) |
| AI Thinking | Qwen3-VL-Thinking |
| AI Arbiter | Qwen2.5-7B |
| Görüntü | Google Street View Static (max 640×640) |
| Backend | Go — masterfabric-go, JWT IAM, Postgres |
| Kayıt | localStorage + backend fire-and-forget sync |
| Hosting | Vercel (web), Render (backend) |

---

## 3. Kod Denetimi — Bulgular

### Kritik / Yüksek

| # | Sorun | Durum |
|---|-------|-------|
| 1 | `/api/analyze` kimlik doğrulamasız — maliyet kötüye kullanımı riski | **Açık** — rate limit / API key önerilir |
| 2 | Backend kayıtları in-memory — Render redeploy'da silinir | **Açık** — Postgres persistence gerekli |
| 3 | Benchmark API auth yok | **Açık** |
| 4 | Kayıtlar yalnızca localStorage'dan yükleniyordu | **Düzeltildi** — backend GET merge |
| 5 | Çöp kutusu yanlış pozitif (agresif bin tespiti) | **Düzeltildi** — eşik + kanıt kapısı |
| 6 | Ekip yönlendirme composite string gönderiyordu | **Düzeltildi** — `resolvePrimaryTeam` |

### Orta

| # | Sorun | Durum |
|---|-------|-------|
| 7 | `apiRequest` JSON parse crash | **Düzeltildi** |
| 8 | AnalyzePanel `res.ok` kontrolü yok | **Düzeltildi** |
| 9 | Cascade hata sessiz DETR'e düşüyor | **Düzeltildi** — `analysisDegraded` + log |
| 10 | Backend sync hataları sessiz | **Düzeltildi** — `syncError` UI |
| 11 | Eksik panorama uyarısı yok | **Düzeltildi** — `warnings[]` |
| 12 | `.env.example` 1280px (yanlış) | **Düzeltildi** — 640×640 |
| 13 | 360° scan-frame aşırı istek | **Düzeltildi** — debounce 900ms |
| 14 | CORS `*` + credentials backend | **Açık** |
| 15 | JWT localStorage — XSS riski | **Açık** (hackathon kabulü) |

### Düşük

| # | Sorun | Durum |
|---|-------|-------|
| 16 | Ölü export `analyzeWithDetectionPipeline` | Açık |
| 17 | `NEXT_PUBLIC_MAPS_EMBED_KEY` kullanılmıyor | Açık |
| 18 | PROJE_RAPORU eski URL/model bilgisi | **Güncellendi** |

---

## 4. Bu Oturumda Yapılan Bug Fix'ler

1. **`apiClient.ts`** — Güvenli JSON parse; sync hata loglama
2. **`AnalyzePanel.tsx`** — HTTP status + parse hata yönetimi
3. **`useRecords.ts`** — Backend'den kayıt yükleme + merge; syncError
4. **`RecordsView.tsx`** — Birincil ekip adı; sync uyarısı
5. **`teamRouting.ts`** — `resolvePrimaryTeam()` helper
6. **`analyze/route.ts`** — API key kontrolü; degraded flag; panorama uyarısı; cascade log
7. **`AnalysisResultView.tsx`** — Degraded/uyarı gösterimi
8. **`detectionOverlays.ts`** — Dinamik görüntü boyutu
9. **`detectionCascade.ts`** — Güven eşikleri hizalandı (0.55)
10. **`Panorama360Viewer.tsx`** — Scan debounce artırıldı

---

## 5. Benchmark Sonuçları

**Set:** 12 İstanbul konumu (`web/benchmark/locations.csv`)

| Sonuç | Detay |
|-------|-------|
| **11/12 PASS** | Skor **9.2/10** |
| Tek FAIL | Ataşehir — recall (model temiz döndü) |
| Ortalama latency | ~33 sn/vaka |

Çalıştırma:
```bash
cd web
BENCHMARK_BASE_URL=http://localhost:3001 node scripts/run-benchmark.mjs
```

> Production Vercel Deployment Protection benchmark scriptini 401 ile engelleyebilir.

---

## 6. Tespit Pipeline Kalite Ayarları

| Parametre | Değer | Açıklama |
|-----------|-------|----------|
| `STREET_VIEW_IMAGE_SIZE` | 640×640 | Google SV gerçek tavan |
| `ANALYSIS_VIEW.fov` | 66 | Zoom — nesne başına daha fazla piksel |
| `ANALYSIS_VIEW.pitch` | -8 | Kaldırım/zemin odaklı |
| Bin OWL eşiği | 0.42 | FP azaltma |
| `dolu_cop_kutusu` min güven | 0.72 | Kutu + taşma kanıtı zorunlu |
| Konsensüs min güven | 0.55 | Validator ile hizalı |

---

## 7. UI Özellikleri

- Kurumsal siyah-beyaz glass tema
- Sabit chrome + dikey sekme geçişi (yatay kayma fix)
- **DetectionImageFrame** — bounding box overlay + toggle
- 360° panorama gezinme + anlık tarama paneli
- 18 hızlı-dene lokasyonu
- Canlı nav pulse / success flash

---

## 8. Geliştirme Önerileri (Öncelik Sırası)

### P0 — Üretim güvenilirliği
1. **Rate limiting** — `/api/analyze`, `/api/scan-frame` (Vercel middleware veya Upstash)
2. **Postgres persistence** — cleanliness kayıtları kalıcı depolama
3. **CORS düzeltmesi** — explicit Vercel origin listesi
4. **Benchmark auth** — shared secret veya JWT

### P1 — Veri tutarlılığı
5. Backend DTO genişletme — `aiReport`, `directionImages`, `createdAt`
6. İki yönlü sync — conflict resolution stratejisi
7. Analiz progress UI — aşama göstergesi (Street View → Vision → Arbiter)

### P2 — Doğruluk
8. Kadıköy/Ataşehir recall iyileştirme — daha spesifik geocode koordinatları
9. Grounding DINO endpoint aktifleştirme
10. Etiketli doğrulama seti genişletme (20+ konum)

### P3 — Ürün
11. Harita ısı haritası (çoklu nokta)
12. Ekip mobil bildirimi
13. Zaman serisi — periyodik tarama karşılaştırması

---

## 9. Dağıtım

| Bileşen | URL |
|---------|-----|
| Web (prod) | https://web-zephyr8.vercel.app |
| Backend | https://zephyr-backend-2mtm.onrender.com |
| GitHub | https://github.com/texas1881/zephyr-ai-urban-solutions (`develop`) |

### Vercel env (zorunlu)
- `GOOGLE_STREET_VIEW_API_KEY`
- `HUGGINGFACE_API_TOKEN`
- `HF_VISION_MODEL`, `HF_THINKING_MODEL`, `HF_ARBITER_MODEL`
- `NEXT_PUBLIC_BACKEND_URL`

### Render env
- `DATABASE_URL`, `JWT_SECRET`
- `KAFKA_ENABLED=false`

---

## 10. KVKK

- Yalnızca kamusal alan, cansız obje analizi
- Yüz/plaka tanıma yok
- Ham görüntü kalıcı depolanmaz
- Detay: `/kvkk`

---

## 11. Sonuç

Zephyr hackathon kapsamında **uçtan uca çalışan**, benchmark ile **9.2/10** doğrulanmış, görsel kanıt overlay'li ve çoklu ajan konsensüslü bir saha denetim platformudur. Kritik teknik borç: **API güvenliği**, **kalıcı depolama** ve **production benchmark erişimi**. Bu oturumda 10 somut bug fix uygulandı; kalan maddeler P0–P3 yol haritasında listelenmiştir.

---

_Hazırlayan: Zephyr ekibi · Cursor Hackathon 2026_
