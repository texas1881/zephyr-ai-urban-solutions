# Zephyr — Hackathon Raporu

> **Cursor Hackathon 2026: AI-Driven Kentsel Çözümler**
> Kentsel Saha Yönetim Sistemi — yapay zekâ destekli temizlik & altyapı denetimi

---

## 1. Özet

**Zephyr**, belediyelerin saha denetim ve temizlik operasyonlarını veriye dayalı
hale getiren bir karar destek sistemidir. Bir adres girilir; sistem o noktanın
**dört yönünü** (ön/arka/sağ/sol) Google Street View üzerinden alır, **çok-kipli
(multimodal) bir yapay zekâ modeli** ile inceler, çevresel sorunları (çöp,
aşırı kirlilik, dolu çöp kutusu, yol hasarı, moloz, grafiti) **önem ve güven
skoruyla** tespit eder, **sorumlu ekibi otomatik önerir** ve son olarak insan
tarafından okunabilir **kapsamlı bir saha raporu** üretir.

Sistem ayrıca **interaktif 360° Street View** ile sahanın her yönden
gezilebilmesini, **JWT tabanlı oturum** ile güvenli erişimi ve **KVKK uyumlu**
gizlilik-öncelikli bir tasarımı içerir.

---

## 2. Çözülen Problem

Belediye temizlik/bakım ekipleri çoğunlukla sabit güzergâhlarda, kirliliğin
gerçekte nerede biriktiğine dair anlık veri olmadan çalışır. Bu, hem zaman hem
bütçe kaybına yol açar. Zephyr, kamusal sokak görüntülerini **uygulanabilir,
önceliklendirilmiş saha aksiyonlarına** dönüştürür.

---

## 3. Sistem Akışı

```
Adres → Geocoding → Street View (4 yön) → AI Görsel Analiz (durum tespiti)
      → Ekip Önerisi → Kapsamlı AI Raporu → Kayıt / Ekip Yönlendirme
```

1. **Geocoding** — Adres, Google Geocoding ile koordinata çevrilir.
2. **Görüntü toplama** — Dört yönün Street View Static görselleri paralel alınır.
3. **Tespit (HF vision)** — Dört görsel tek istekte çok-kipli modele gönderilir;
   yapılandırılmış JSON (durumlar + önem + güven + yoğunluk skoru) döner.
4. **Ekip önerisi** — En yüksek önem dereceli soruna göre Temizlik / Yol Bakım
   ekibi otomatik önerilir.
5. **Kapsamlı rapor (Gemini → HF → yerel)** — Yorum motoru profesyonel bir
   Türkçe saha raporu yazar.
6. **Sunum** — Sonuç; 4 yön görseli + 360° gezinme + durum kartları + AI raporu
   olarak panelde gösterilir, kayıt edilir, ekip yönlendirilebilir.

---

## 4. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Web | Next.js 16 + TypeScript (App Router, server/client components) |
| Backend | Go — **masterfabric-go** katmanlı mimarisi (zorunlu) |
| Kimlik | masterfabric-go IAM — JWT + RBAC + Postgres |
| AI — Tespit | **Hugging Face** çok-kipli model: `Qwen/Qwen3-VL-8B-Instruct` (ücretsiz, router/Novita) |
| AI — Yorum | **Gemini** (birincil yorum) → HF metin modeli → yerel özet (kademeli fallback) |
| Yedek CV | Google Cloud Vision → COCO nesne tespiti (`facebook/detr-resnet-50`) |
| Veri kaynağı | Google Street View Static + Geocoding + **Maps Embed (360°)** |
| Hosting | Vercel (web), Render.com (backend + Postgres) |

> **Model eğitimi yapılmadı.** Hazır (önceden eğitilmiş) barındırılan modeller
> API üzerinden çağrıldı — hackathon kuralına uygun.

---

## 5. Yapay Zekâ Kullanımı (Detay)

### 5.1 Görsel durum tespiti — Hugging Face (birincil)
- Model: `Qwen/Qwen3-VL-8B-Instruct` (vision-language), HF router üzerinden.
- Dört yön görseli **tek istekte** değerlendirilir, ortalama **~5 sn**.
- Çıktı, sıkı bir JSON şemasına göre ayrıştırılır: `densityScore`,
  `cleanliness`, ve her biri `type / severity / confidence / direction /
  description` içeren `situations` dizisi.
- Prompt, **insan/araç/yangın musluğu gibi normal kent ögelerini sorun
  saymayı kesinlikle yasaklar** — yanlış pozitifleri (kalabalık ≠ kirli)
  önler.

### 5.2 Kapsamlı yorum/rapor — Gemini (yorum amaçlı)
- Tespitten **ayrılmış** bir adımdır; Gemini yalnızca **yorum/rapor** üretir.
- Kademeli dayanıklılık: **Gemini → HF metin → yerel özet**. Böylece bir
  sağlayıcı kotası dolsa bile rapor her zaman üretilir (asla hata fırlatmaz).

### 5.3 Cursor kullanımı
- Tüm geliştirme **Cursor IDE** içinde agentic akışla yapıldı.
- `.cursor/rules/` kuralları teknoloji yığınını, feature-first mimariyi, REST
  zarfını, KVKK ve commit disiplinini zorunlu kıldı.
- gcloud/Render/Vercel CLI'ları Cursor ajanı üzerinden çalıştırılarak API
  etkinleştirme ve deploy otomasyonu yapıldı.

---

## 6. Öne Çıkan Özellikler

- **Hassas durum tespiti**: 6 sorun tipi, önem (düşük→kritik) ve güven skoru.
- **Otomatik ekip yönlendirme**: durum → sorumlu ekip eşleşmesi + tek tıkla atama.
- **İnteraktif 360° Street View**: sahayı her yönden gezme (Maps Embed API).
- **Kapsamlı AI raporu**: profesyonel, akıcı Türkçe saha değerlendirmesi.
- **Kayıt & istatistik**: analiz geçmişi, durum (beklemede/atandı/çözüldü).
- **Güvenli erişim**: JWT oturum (backend bağlıysa); aksi halde demo modu.
- **Estetik arayüz**: siyah-beyaz glassmorphism + SVG radar animasyonu.

---

## 7. KVKK ve Veri Güvenliği

- **Amaç sınırlaması**: yalnızca kamusal alandaki **cansız** objeler analiz edilir.
- **Kişisel veri yok**: yüz tanıma, plaka okuma, kişi/araç takibi **yapılmaz**;
  insan/araç sadece "ortam göstergesi" olarak işaretlenir, skora katılmaz.
- **Kaynakta anonimleştirme**: Street View görüntülerinde yüz ve plakalar Google
  tarafından otomatik bulanıklaştırılır.
- **Veri minimizasyonu**: ham görüntüler kalıcı depolanmaz; yalnızca analiz
  sonuçları (skor, durumlar) saklanır.
- **Güvenlik**: API anahtarları yalnızca sunucu tarafında; erişim JWT ile korunur.
- Ayrıntılı [KVKK Aydınlatma Metni](web/src/app/kvkk/page.tsx) uygulama
  içinde `/kvkk` sayfasında sunulur.

---

## 8. Mimari Notları

- **Web**: feature-first klasör yapısı (`features/analyze`, `features/records`,
  `features/auth`, `features/dashboard`). Servisler `services/` altında tiplenmiş.
- **API zarfı**: tüm uçlar `{ success, data }` / `{ success, message }` döner.
- **Backend**: masterfabric-go katmanları (domain / application / infrastructure);
  cleanliness alanı kayıt CRUD + istatistik + ekip atama + durum güncelleme.
- **Dayanıklılık**: tespit ve rapor için bağımsız fallback zincirleri.

---

## 9. Kurallara Uyum Öz-Değerlendirmesi

| Kriter | Durum | Not |
|--------|:----:|-----|
| Belirlenen teknoloji yığını (Next.js / Go-masterfabric / HF / Google) | ✅ | Tamamı kullanıldı |
| Model eğitmeden hazır AI kullanımı | ✅ | HF + Gemini API çağrıları |
| Gerçek bir kentsel problemi çözme | ✅ | Saha denetim + ekip yönlendirme |
| KVKK uyumu | ✅ | Cansız obje, anonim, /kvkk metni |
| Cursor agentic geliştirme + ruleset | ✅ | `.cursor/rules/` zorunlu |
| Çalışır deploy (web + backend) | ✅ | Vercel + Render |
| UX/estetik | ✅ | Glassmorphism + 360° + SVG animasyon |

---

## 10. Çalıştırma

```bash
# Web
cd web && npm install && cp .env.example .env.local && npm run dev

# Backend (bellek-içi demo)
cd backend && go run ./cmd/zephyr
```

Gerekli anahtarlar `web/.env.example` içinde açıklanmıştır.

---

_Hazırlayan: Zephyr ekibi · Cursor Hackathon 2026_
