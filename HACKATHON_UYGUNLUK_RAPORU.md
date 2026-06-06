# Zephyr — Hackathon Uygunluk & Puanlama Raporu

> Cursor Hackathon 2026: AI-Driven Kentsel Çözümler · resmi kurallara göre öz-değerlendirme

---

## Genel Karar: ✅ UYGUN (Canlı, çalışan ürün)

Proje, kuralların **zorunlu teknik yığınına**, **AI/Cursor kullanım** ve **KVKK**
şartlarına uyuyor; web ve backend **canlıda çalışıyor**. Aşağıda resmi 100 puanlık
çizelgeye göre öz-değerlendirme ve kapatılması önerilen küçük açıklar var.

Canlı: **https://web-six-tau-79.vercel.app** · Backend: `zephyr-backend-2mtm.onrender.com/health/live` → `alive`

---

## 1. Zorunlu Teknoloji Yığını Uyumu

| Gereksinim | Durum | Not |
|------------|:----:|-----|
| Web: **Next.js** | ✅ | Next.js 16 + TypeScript |
| Backend: **Go + masterfabric-go mimarisi** | ✅ | Kendi mimari kurulmadı; masterfabric-go katmanları kullanıldı |
| AI: **Hugging Face** | ✅ | `Qwen/Qwen3-VL-8B-Instruct` (tespit) + HF metin (rapor yedeği) |
| Harici veri: **Google Street View API** | ✅ | 4 yön + Geocoding + Maps Embed (360°) |
| Hosting: **Vercel + Render.com** | ✅ | Web Vercel, backend Render (+Postgres) |
| Mobil: **Expo** | ⚠️ | Etkinlikte mobil kapsamdan çıkarıldı (sözlü bildirim). Teyit edilmeli. |

> **Tek dikkat noktası:** Resmi bildirgede mobil (Expo) zorunlu görünüyor; ekibe
> mobilin kaldırıldığı bildirildiyse sorun yok, aksi halde jüriye bu durum açıkça
> belirtilmelidir.

---

## 2. Resmi Puanlama Çizelgesi (100 Puan) — Öz-Değerlendirme

| Kriter | Ağırlık | Öz-puan | Gerekçe |
|--------|:------:|:------:|---------|
| **Teknik Çalışırlık** (hatasız derlenme, mimariye uyum, canlı demo) | 30 | **27** | `next build` temiz, canlı prod çalışıyor, masterfabric-go'ya uyum tam. Demo akıcı. |
| **Doğruluk ve Güvenilirlik** (CV başarısı) | 25 | **19** | Çok-kipli model gerçek sahnede çöp/yol hasarı tespit ediyor; guardrail ile yanlış pozitif düşük. Eşik/etiket ince ayarı sınırlı. |
| **Kamu Faydasına Uygunluk** | 20 | **18** | Saha denetimi + otomatik ekip yönlendirme + öncelik panosu somut belediye değeri. |
| **AI Adaptasyonu** (Cursor IDE, agentic, dökümantasyon) | 10 | **9** | Ruleset, agentic akış, CLI otomasyonu (gcloud/vercel) README'de belgeli. |
| **KVKK ve Etik Uyum** | 10 | **9** | Cansız obje odağı (enum), kişisel veri yok, /kvkk metni, kaynakta blur. |
| **Sunum ve Dökümantasyon** (README) | 5 | **5** | README + iki rapor + uygulama içi UX. |
| **TOPLAM (tahmini)** | 100 | **~87** | |

---

## 3. Ödül Hakedişi — 4 Zorunlu Koşul

| Koşul | Durum | Açıklama |
|-------|:----:|----------|
| 1. Canlı Demo | ✅ | Vercel prod + Render backend ayakta |
| 2. Tekrarlanabilir sonuçlar | ✅ | Aynı adres → kararlı sonuç (temperature 0.2, yapılandırılmış JSON) |
| 3. Çalıştırılabilir kaynak kod + commit geçmişi | ✅ | GitHub `develop`, aşamalı anlamlı commit'ler |
| 4. KVKK silme/anonimleştirme belgesi | 🟡 | `/kvkk` + README var; **resmi imzalı imha belgesi** sunum öncesi eklenmeli |

---

## 4. Güçlü Yönler

- **Sadece tespit değil, aksiyon**: durum → sorumlu ekip → tek tıkla yönlendirme.
- **Dayanıklı AI mimarisi**: tespit ve rapor için bağımsız fallback zincirleri; bir
  sağlayıcı kotası dolsa bile ürün çalışmaya devam eder (canlı kanıt: Gemini kotası
  dolu → rapor otomatik HF'e düşüyor).
- **Gerçek veri akışı**: öncelik panosu artık demo veriyle değil, yapılan analizlerle dolar.
- **İnteraktif 360° Street View** + estetik siyah-beyaz cam arayüz + SVG animasyon.
- **Güvenlik**: JWT oturum, sunucu-tarafı anahtarlar.

---

## 5. Sunumdan Önce Önerilen Kapatmalar

1. **Mobil (Expo) durumu** jüriyle netleştirilsin (kapsamdaysa kısa bir Expo iskeleti).
2. **KVKK imha belgesi** (kısa imzalı PDF/metin) eklensin — ödül koşulu.
3. **Gemini kredisi** doldurulursa rapor motoru otomatik Gemini'ye döner (kod hazır);
   demoda "yorum motoru" olarak Gemini'yi göstermek puan için artı.
4. Demo senaryosunda **kirli bir adres** önceden seçilip durum kartları + ekip
   yönlendirme + 360° canlı gösterilsin.

---

_Öz-değerlendirme · Cursor Hackathon 2026 · Zephyr ekibi_
