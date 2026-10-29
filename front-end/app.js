const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const PUBLIC_DATA_KEY = import.meta.env.VITE_PUBLIC_DATA_API_KEY;
const YOUTH_CENTER_API_URL =
    import.meta.env.VITE_YOUTH_CENTER_API_URL || 'https://api.odcloud.kr/api/15077586/v1/centers';

function loadKakaoSdk(appKey) {
    return new Promise((resolve, reject) => {
        if (!appKey) {
            reject(new Error('VITE_KAKAO_JAVASCRIPT_KEY 값이 없습니다.'));
            return;
        }

        if (window.kakao && window.kakao.maps) {
            resolve(window.kakao);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${encodeURIComponent(appKey)}`;
        script.async = true;

        script.onload = () => {
            window.kakao.maps.load(() => resolve(window.kakao));
        };

        script.onerror = () => {
            reject(new Error('카카오 지도 SDK 로드에 실패했습니다.'));
        };

        document.head.appendChild(script);
    });
}

function readCoordinate(item, candidateKeys) {
    for (const key of candidateKeys) {
        const raw = item?.[key];
        if (raw === undefined || raw === null || raw === '') {
            continue;
        }

        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            return numeric;
        }
    }
    return null;
}

function readCenterName(item) {
    return (
        item.centerName ||
        item.facilityName ||
        item.orgNm ||
        item.name ||
        item.기관명 ||
        '상담센터'
    );
}

async function fetchYouthCenters() {
    if (!PUBLIC_DATA_KEY) {
        throw new Error('VITE_PUBLIC_DATA_API_KEY 값이 없습니다.');
    }

    const url = new URL(YOUTH_CENTER_API_URL);
    url.searchParams.set('serviceKey', PUBLIC_DATA_KEY);
    url.searchParams.set('page', '1');
    url.searchParams.set('perPage', '500');
    url.searchParams.set('returnType', 'JSON');

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`공공데이터 API 요청 실패: ${response.status}`);
    }

    const payload = await response.json();
    const rows = payload?.data || payload?.items || [];
    if (!Array.isArray(rows)) {
        throw new Error('공공데이터 응답 형식이 예상과 다릅니다.');
    }

    return rows;
}

function drawCentersOnMap(kakao, map, centers) {
    const bounds = new kakao.maps.LatLngBounds();
    let markerCount = 0;

    for (const center of centers) {
        const lat = readCoordinate(center, ['lat', 'latitude', 'y', '위도', 'LAT']);
        const lng = readCoordinate(center, ['lng', 'lon', 'long', 'longitude', 'x', '경도', 'LNG']);

        if (lat === null || lng === null) {
            continue;
        }

        const position = new kakao.maps.LatLng(lat, lng);
        const marker = new kakao.maps.Marker({ position });
        marker.setMap(map);

        const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 8px;font-size:12px;">${readCenterName(center)}</div>`
        });

        kakao.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(map, marker);
        });

        bounds.extend(position);
        markerCount += 1;
    }

    if (markerCount > 0) {
        map.setBounds(bounds);
    }

    return markerCount;
}

async function init() {
    try {
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('id가 map인 요소를 찾지 못했습니다.');
        }

        const kakao = await loadKakaoSdk(KAKAO_JS_KEY);
        const map = new kakao.maps.Map(mapElement, {
            center: new kakao.maps.LatLng(37.5665, 126.978),
            level: 8
        });

        const centers = await fetchYouthCenters();
        const count = drawCentersOnMap(kakao, map, centers);

        if (count === 0) {
            console.warn('좌표가 있는 센터 데이터가 없어 마커를 표시하지 못했습니다.');
        }
    } catch (error) {
        console.error('지도 초기화 중 오류가 발생했습니다.', error);
    }
}

init();

