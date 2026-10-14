(function() {
    document.addEventListener("DOMContentLoaded", function() {
        const widgets = document.querySelectorAll(".khgt-widget-container");
        if (!widgets.length) return;

        const API_BASE = (typeof khgtConfig !== 'undefined' && khgtConfig.apiBase) 
            ? khgtConfig.apiBase 
            : "https://khgt-api-dev.matadigital.workers.dev/api/sholat";

        widgets.forEach(container => initKHGTWidget(container, API_BASE));
    });

    const PROV_ID = {
        'Special Region of Yogyakarta': 'DI Yogyakarta', 'Yogyakarta': 'DI Yogyakarta',
        'Special Capital Region of Jakarta': 'DKI Jakarta', 'Jakarta': 'DKI Jakarta',
        'Riau Islands': 'Kepulauan Riau', 'Bangka Belitung Islands': 'Kepulauan Bangka Belitung',
        'West Nusa Tenggara': 'Nusa Tenggara Barat', 'East Nusa Tenggara': 'Nusa Tenggara Timur',
        'West Papua': 'Papua Barat', 'North Maluku': 'Maluku Utara'
    };
    const COMPASS_ID = { 'North': 'Utara', 'South': 'Selatan', 'East': 'Timur', 'West': 'Barat', 'Central': 'Tengah', 'Southeast': 'Tenggara' };
    const BASE_ID = { 'Sumatra': 'Sumatera', 'Java': 'Jawa', 'Kalimantan': 'Kalimantan', 'Sulawesi': 'Sulawesi' };

    function localizeName(name) {
        return String(name).split(',').map(s => s.trim()).filter(s => s && s !== 'Indonesia').map(part => {
            if (PROV_ID[part]) return PROV_ID[part];
            const m = part.match(/^(North|South|East|West|Central|Southeast) (Sumatra|Java|Kalimantan|Sulawesi)$/);
            return m ? BASE_ID[m[2]] + ' ' + COMPASS_ID[m[1]] : part;
        }).join(', ');
    }

    function initKHGTWidget(container, API_BASE) {
        const now = new Date();
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);

        const elDate = container.querySelector('.khgt-ui-date');
        const elCity = container.querySelector('.khgt-ui-city');
        const elHijri = container.querySelector('.khgt-ui-hijri');
        const elList = container.querySelector('.khgt-ui-list');
        const elLoader = container.querySelector('.khgt-loader');
        const elError = container.querySelector('.khgt-error-box');
        const inpSearch = container.querySelector('.khgt-city-in');
        const btnSearch = container.querySelector('.khgt-city-go');
        const btnGps = container.querySelector('.btn-gps');
        const defaultCity = container.getAttribute('data-default-city') || 'Yogyakarta';

        elDate.innerText = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(now);

        async function callWorker(endpoint, payload) {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (!json.status && !json.success) {
                throw new Error(json.error || json.message || "Gagal mengambil data");
            }
            return json.data;
        }

        async function loadData(param, type = 'city') {
            elLoader.style.display = 'block';
            elList.style.opacity = '0.3';
            elError.style.display = 'none';

            try {
                let lat, lng, lokasiLabel;

                if (type === 'gps') {
                    lat = param.lat;
                    lng = param.lng;
                    lokasiLabel = "Lokasi Saya";
                    try {
                        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&accept-language=id&lat=${lat}&lon=${lng}`);
                        const revJson = await rev.json();
                        if (revJson && revJson.address) {
                            lokasiLabel = revJson.address.city || revJson.address.county || revJson.address.town || "Lokasi Saya";
                        }
                    } catch (e) {}
                } else {
                    const cacheKey = `khgt_city_${param.toLowerCase()}`;
                    const cached = sessionStorage.getItem(cacheKey);
                    let cityData;

                    if (cached) {
                        cityData = JSON.parse(cached);
                    } else {
                        const cityRes = await callWorker('search', { q: param });
                        if (!cityRes || !cityRes.length) throw new Error("Kota tidak ditemukan");
                        cityData = cityRes[0];
                        sessionStorage.setItem(cacheKey, JSON.stringify(cityData));
                    }

                    lat = cityData.lat;
                    lng = cityData.lng;
                    lokasiLabel = localizeName(cityData.name || param);
                }

                elCity.innerText = lokasiLabel;
                inpSearch.value = lokasiLabel;

                const schedRes = await callWorker('schedule', {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    date: todayStr,
                    mode: 'daily'
                });

                const todaySchedule = Array.isArray(schedRes) ? schedRes[0] : schedRes;
                if (!todaySchedule) throw new Error("Jadwal tidak tersedia.");

                renderList(todaySchedule);

                let hijriDate = todaySchedule.hijri || (schedRes.meta ? schedRes.meta.hijri : null);
                if (!hijriDate || hijriDate === "-") {
                    try {
                        const raw = new Intl.DateTimeFormat('id-ID-u-ca-islamic-civil', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        }).format(now);
                        hijriDate = raw.replace(/ (AH|H)$/, '') + " H";
                    } catch (e) {
                        hijriDate = "-";
                    }
                }
                elHijri.innerText = hijriDate;

            } catch (err) {
                console.error("KHGT Error:", err);
                elError.innerText = "Gagal memuat jadwal. Silakan coba kota lain.";
                elError.style.display = 'block';
                elHijri.innerText = "-";
            } finally {
                elLoader.style.display = 'none';
                elList.style.opacity = '1';
                btnGps.classList.remove('loading');
            }
        }

        function renderList(schedule) {
            const normalized = {};
            for (const k in schedule) normalized[k.toLowerCase()] = schedule[k];

            const order = ['subuh', 'terbit', 'dzuhur', 'ashar', 'maghrib', 'isya'];
            let html = '';
            const curMin = now.getHours() * 60 + now.getMinutes();
            let nextFound = false;

            order.forEach(key => {
                const val = normalized[key] || '-';
                let active = '';
                if (val !== '-' && val.includes(':')) {
                    const [h, m] = val.split(':');
                    const schedMin = parseInt(h, 10) * 60 + parseInt(m, 10);
                    if (!nextFound && schedMin > curMin && key !== 'terbit') {
                        active = 'active';
                        nextFound = true;
                    }
                }
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                html += `<li class="nm-ws-item ${active}"><span>${label}</span><strong>${val}</strong></li>`;
            });
            elList.innerHTML = html;
        }

        btnSearch.addEventListener('click', () => {
            if (inpSearch.value.trim()) loadData(inpSearch.value.trim(), 'city');
        });

        inpSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && inpSearch.value.trim()) {
                loadData(inpSearch.value.trim(), 'city');
            }
        });

        function handleGPS() {
            if (!navigator.geolocation) {
                loadData(defaultCity, 'city');
                return;
            }
            btnGps.classList.add('loading');
            navigator.geolocation.getCurrentPosition(
                pos => loadData({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps'),
                () => {
                    btnGps.classList.remove('loading');
                    loadData(defaultCity, 'city');
                },
                { timeout: 8000, maximumAge: 60000 }
            );
        }

        btnGps.addEventListener('click', handleGPS);
        handleGPS();
    }
})();
