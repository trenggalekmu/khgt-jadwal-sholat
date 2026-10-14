=== Jadwal Sholat KHGT Muhammadiyah ===
Contributors: mastrigus
Requires at least: 5.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Widget dan shortcode jadwal sholat harian beserta tanggal Hijriah (KHGT), dengan pencarian kota dan deteksi lokasi GPS.

== Description ==
Plugin ini menampilkan jadwal sholat harian (Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya) dan tanggal Hijriah dalam bentuk widget atau shortcode. Pengunjung bisa mencari kota atau memakai deteksi lokasi (GPS) peramban.

Data jadwal diambil dari layanan data yang sama dengan widget KHGT di muhammadiyah.or.id, langsung dari peramban pengunjung. Lihat README di GitHub untuk detail.

Privasi: widget meminta izin lokasi saat halaman dibuka. Bila pengunjung mengizinkan, koordinat perangkat dikirim ke layanan data jadwal dan ke Nominatim (OpenStreetMap) untuk nama tempat. Bila ditolak atau pengunjung mencari nama kota, yang dikirim hanya nama kota atau titik kota tersebut. Plugin tidak menyimpan data pengunjung di server situs Anda.

Dibuat oleh mastrigus (MPID PDM Trenggalek). Open source.

== Installation ==
1. Unggah berkas `khgt-jadwal-sholat.zip` via menu Plugin > Tambah Baru > Unggah Plugin.
2. Aktifkan plugin.
3. Pasang lewat Tampilan > Widget (cari "Jadwal Sholat KHGT"), atau tulis shortcode `[jadwal_sholat_khgt kota="Trenggalek"]` di halaman atau tulisan.

== Changelog ==
= 1.0.1 =
* Keamanan: daftar waktu sholat dirender sebagai teks (bukan innerHTML) sehingga respons layanan tidak dapat menyisipkan HTML atau skrip.
* Label formulir widget memakai text domain plugin.

= 1.0.0 =
* Rilis pertama: widget, shortcode, pencarian kota, deteksi GPS.
