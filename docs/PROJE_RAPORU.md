# Zephyr — Proje Raporu

> **Kentsel Saha Yönetim Sistemi** — yapay zekâ destekli temizlik & altyapı denetimi
> Cursor Hackathon 2026 · AI-Driven Kentsel Çözümler

---

## 1. Yönetici Özeti

**Zephyr**, belediyelerin saha denetim ve temizlik operasyonlarını veriye dayalı
hale getiren bir karar destek sistemidir. Kullanıcı bir adres girer; sistem o
noktanın **dört yönünü** (ön/arka/sağ/sol) Google Street View üzerinden alır,
**çok-kipli (multimodal) bir yapay zekâ modeli** ile inceler, çevresel sorunları
**önem ve güven skoruyla** tespit eder, **sorumlu ekibi otomatik önerir** ve
insan tarafından okunabilir **kapsamlı bir saha raporu** üretir.

Sistem ayrıca interaktif **360° Street View**, **JWT tabanlı güvenli oturum** ve
**KVKK uyumlu**, gizlilik-öncelikli bir tasarım içerir.

---

## 2. Problem ve Çözüm

**Problem.** Belediye temizlik/bakım ekipleri çoğunlukla sabit güzergâhlarda,
kirliliğin gerçekte nerede biriktiğine dair anlık veri olmadan çalışır. Bu, hem
zaman hem bütçe kaybına yol açar.

**Çözüm.** Zephyr, kamusal sokak görüntülerini **uygulanabilir,
önceliklendirilmiş saha aksiyonlarına** dönüştürür: nerede, ne tür bir sorun
var, ne kadar acil ve hangi ekip gönderilmeli.

---

## 3. Sistem Akışı

```
Adres → Geocoding → Street View (4 yön) → AI Görsel Analiz (durum tespiti)
      → Ekip Önerisi → Kapsamlı AI Raporu → Kayıt / Ekip Yönlendirme
```

1. **Geocoding** — Adres, Google Geocoding ile koordinata çevrilir.
2. **Görüntü toplama** — Dört yönün Street View görselleri paralel alınır.
3. **Tespit** — Dört görsel tek istekte çok-kipli modele gönderilir;
   yapılandırılmış JSON (durumlar + önem + güven + yoğunluk skoru) döner.
4. **Ekip önerisi** — En yüksek önem dereceli soruna göre uygun ekip önerilir.
5. **Kapsamlı rapor** — Yorum motoru profesyonel bir Türkçe saha raporu yazar.
6. **Sunum & kayıt** — Sonuç panelde gösterilir, kaydedilir, ekip yönlendirilir.

---

## 4. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Web | Next.js 16 + TypeScript (App Router) |
| Backend | Go — **masterfabric-go** katmanlı mimarisi |
| Kimlik | masterfabric-go IAM — JWT + RBAC + Postgres |
| AI — Tespit | **Hugging Face** çok-kipli model: `Qwen/Qwen3-VL-8B-Instruct` |
| AI — Yorum | **Gemini** → HF metin modeli → yerel özet (kademeli fallback) |
| Yedek CV | Google Cloud Vision → `facebook/detr-resnet-50` |
| Veri kaynağı | Google Street View Static + Geocoding + Maps Embed (360°) |
| Hosting | Vercel (web), Render.com (backend + Postgres) |
| Geliştirme | Cursor IDE + agentic ruleset (`.cursor/rules/`) |

> **Model eğitilmedi.** Hazır, barındırılan modeller API ile çağrıldı.

Ayrıntılı klasör/mimari açıklaması: [`MIMARI.md`](MIMARI.md).

---

## 5. Yapay Zekâ Kullanımı

### 5.1 Görsel durum tespiti — Hugging Face (birincil)
- Model: `Qwen/Qwen3-VL-8B-Instruct` (vision-language), HF router üzerinden.
- Dört yön görseli **tek istekte** değerlendirilir.
- Çıktı sıkı bir JSON şemasına ayrıştırılır: `densityScore`, `cleanliness` ve
  her biri `type / severity / confidence / direction / description` içeren
  `situations` dizisi.
- Prompt, **insan/araç/yangın musluğu gibi normal kent ögelerini sorun saymayı
  yasaklar** — yanlış pozitifleri (kalabalık ≠ kirli) azaltır.

### 5.2 Kapsamlı yorum/rapor — Gemini (yorum amaçlı)
- Tespitten **ayrılmış** bağımsız bir adımdır.
- Kademeli dayanıklılık: **Gemini → HF metin → yerel özet**. Bir sağlayıcı
  kotası dolsa bile rapor her zaman üretilir (asla hata fırlatmaz).

### 5.3 Prompt teknikleri
- **Yapılandırılmış çıktı** (katı JSON şeması).
- **Negatif kısıtlar** (normal kent ögelerini hariç tutan guardrail).
- **Taksonomi sabitleme** (önceden tanımlı enum'lar).
- **Düşük sıcaklık (0.2)** ile kararlı sonuç.
- **Görev ayrımı** (tespit ve rapor bağımsız çağrılar).

---

## 6. Öne Çıkan Özellikler

- **Hassas durum tespiti**: 6 sorun tipi, önem (düşük→kritik) ve güven skoru.
- **Otomatik ekip yönlendirme**: durum → sorumlu ekip + tek tıkla atama.
- **İnteraktif 360° Street View**: sahayı her yönden gezme.
- **Kapsamlı AI raporu**: profesyonel, akıcı Türkçe değerlendirme.
- **Kayıt & istatistik**: analiz geçmişi, durum (beklemede/atandı/çözüldü).
- **Güvenli erişim**: JWT oturum (backend bağlıysa); aksi halde demo modu.
- **Estetik arayüz**: siyah-beyaz glassmorphism + SVG radar animasyonu.

---

## 7. KVKK ve Veri Güvenliği

- **Amaç sınırlaması**: yalnızca kamusal alandaki **cansız** objeler analiz edilir.
- **Kişisel veri yok**: yüz tanıma, plaka okuma, kişi/araç takibi yapılmaz.
- **Kaynakta anonimleştirme**: Street View'da yüz ve plakalar Google tarafından
  otomatik bulanıklaştırılır.
- **Veri minimizasyonu**: ham görüntüler kalıcı depolanmaz; yalnızca analiz
  sonuçları (skor, durumlar) saklanır.
- **Güvenlik**: API anahtarları sunucu tarafında; istemci harita anahtarı
  yalnızca harita gömme ile sınırlandırılmış; erişim JWT ile korunur.
- Ayrıntı: uygulama içi `/kvkk` sayfası ve [`KVKK_VERI_IMHA_BELGESI.md`](KVKK_VERI_IMHA_BELGESI.md).

---

## 8. Mimari Notları

- **Web**: feature-first yapı (`features/analyze`, `records`, `auth`,
  `dashboard`, `detections`, `navigation`); servisler `services/` altında izole.
- **API zarfı**: tüm uçlar `{ success, data }` / `{ success, message }` döner.
- **Backend**: masterfabric-go katmanları (domain → application → infrastructure)
  + `shared` altyapı; cleanliness alanı kayıt CRUD + istatistik + ekip atama +
  durum güncelleme.
- **Dayanıklılık**: tespit ve rapor için bağımsız fallback zincirleri.

---

## 9. Geliştirme Süreci (Cursor)

- Tüm geliştirme **Cursor IDE** içinde agentic akışla yapıldı.
- `.cursor/rules/` kuralları teknoloji yığınını, feature-first mimariyi, REST
  zarfını, KVKK'yı ve commit disiplinini zorunlu kıldı.
- gcloud / Render / Vercel CLI'ları Cursor ajanı üzerinden çalıştırılarak API
  etkinleştirme ve deploy otomasyonu yapıldı.
- Kod tek seferde değil, **anlamlı commit'lerle aşama aşama** GitHub'a işlendi.

---

## 10. Dağıtım

| Bileşen | Platform | Adres |
|---------|----------|-------|
| Web | Vercel | `https://web-six-tau-79.vercel.app` |
| Backend | Render.com | `https://zephyr-backend-2mtm.onrender.com` |
| Veritabanı | Render Postgres | (backend'e bağlı) |

Sağlık kontrolü: `GET /health/live`, `GET /health/ready`.

---

## 11. Son Düzenleme ve Temizlik (Yarışma Sonrası)

Kod tabanı, yarışma sonrası bakım kalitesi için sadeleştirildi:

- **Ölü kod kaldırıldı**: kullanılmayan `detectionsService.ts`, mock `/api/detections`
  route'u ve `mockData.ts` silindi (dashboard zaten gerçek kayıtları kullanıyor).
- **Dokümanlar düzenlendi**: tüm raporlar, KVKK belgesi ve sunum `docs/` altında
  toplandı; kök dizin yalnızca `README`, `render.yaml`, `.gitignore` içeriyor.
- **Mimari belgesi eklendi**: [`MIMARI.md`](MIMARI.md) ile klasör yapısı ve
  katman kuralları görünür kılındı.
- **Doğrulama**: temiz build (`next build`) başarılı, lint hatasız.

Güncel route listesi: `/`, `/kvkk`, `/api/analyze`, `/api/streetview`.

---

## 12. Sonuç ve Gelecek Çalışmalar

Zephyr, hazır AI modellerini gerçek bir kentsel probleme bağlayan, uçtan uca
çalışan ve gizlilik-öncelikli bir karar destek sistemidir. Gelecekte:

- Toplu/harita üzerinden çoklu nokta taraması ve ısı haritası.
- Ekip mobil bildirimi (Expo tabanlı saha uygulaması).
- Zaman serisi: aynı noktanın periyodik taranıp iyileşme/kötüleşme takibi.
- Model doğruluğu için kurum içi etiketli doğrulama seti (anonimleştirilmiş).

---

_Hazırlayan: Zephyr ekibi · Cursor Hackathon 2026_
