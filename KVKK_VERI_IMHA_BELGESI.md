# KVKK — Veri İşleme, Anonimleştirme ve İmha Belgesi

> Zephyr · Cursor Hackathon 2026 · 6 Haziran 2026
> 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.

---

## 1. Veri Sorumlusu ve Kapsam

- **Proje:** Zephyr — Kentsel Saha Yönetim Sistemi
- **Ekip / Veri Sorumlusu:** Zephyr ekibi (iletişim: mertali9812@gmail.com)
- **Kapsam:** Bu belge, hackathon süresince işlenen görüntü ve konum verilerinin
  toplanma amacını, anonimleştirme yöntemini ve imha taahhüdünü kayıt altına alır.

## 2. İşlenen Veriler ve Amaç

| Veri | Kaynak | Amaç | Saklama |
|------|--------|------|---------|
| Adres / koordinat | Kullanıcı girişi | Konuma ait kamusal görüntüyü almak | Yalnızca analiz sonucu (skor/durum) saklanır |
| Sokak görüntüsü (4 yön) | Google Street View | Çevresel durum tespiti | **Kalıcı saklanmaz** (geçici, istek bazlı) |
| Analiz sonucu | Sistem | Öncelik panosu / kayıt | localStorage / backend (anonim) |

- Görüntü analizi **yalnızca cansız kentsel objeleri** (çöp, atık, dolu çöp
  kutusu, yol hasarı, moloz, grafiti) hedef alır. Bu kapsam, model promptunda
  **enum olarak dayatılır**.

## 3. Kişisel Veri Yasağı (Uygulanan Önlemler)

- ❌ Kimlik tespiti, yüz tanıma, plaka okuma, kişi/araç takibi **yapılmaz**.
- ✅ İnsan/araç gibi ögeler yalnızca "ortam göstergesi" olarak işaretlenir ve
  **kirlilik skoruna katılmaz**; kişisel veri olarak işlenmez.
- ✅ Sistem promptu, insan/araç/yangın musluğu gibi ögeleri sorun olarak
  işaretlemeyi **açıkça yasaklar** (kod: `web/src/services/situationAnalysis.ts`).

## 4. Anonimleştirme (Blurring)

- Google Street View görüntülerinde **insan yüzleri ve araç plakaları Google
  tarafından kaynağında, geri döndürülemez biçimde bulanıklaştırılır.**
- Proje kendi modelini **eğitmediği** için ham kişisel veri içeren bir eğitim
  veri seti oluşturulmaz/saklanmaz; modeller hazır olarak API ile çağrılır.

## 5. Veri Güvenliği

- API anahtarları **yalnızca sunucu tarafında** tutulur; istemciye açılan harita
  anahtarı yalnızca harita gömme (Maps Embed) ile sınırlandırılmıştır.
- Erişim, backend bağlıyken **JWT oturum** ile korunur.
- Ham görüntü veya gizli anahtar **açık GitHub deposuna yüklenmemiştir**
  (`.env*` dosyaları `.gitignore` ile hariç tutulmuştur).

## 6. İmha Taahhüdü

- Hackathon (6 Haziran 2026, 17:00) sona erdiğinde:
  - İstek bazlı tutulan **tüm geçici görüntü önbellekleri kalıcı olarak silinir**.
  - Demo/test sırasında oluşturulan analiz kayıtları (localStorage / backend
    veritabanı) temizlenir.
  - Görüntü verisi içeren herhangi bir kalıcı depolama bulunmamaktadır.

## 7. Beyan

İşbu belgeyle, yukarıdaki veri işleme, anonimleştirme ve imha esaslarına
uyulduğu ve hackathon sonunda ham verilerin imha edileceği taahhüt edilir.

| Tarih | Sorumlu | Beyan |
|-------|---------|-------|
| 6 Haziran 2026 | Zephyr ekibi | KVKK uyumu sağlanmış, imha taahhüt edilmiştir. |
