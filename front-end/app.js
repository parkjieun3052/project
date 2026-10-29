// 국토교통부 API 키는 이후 데이터 조회용으로 보관하고,
// 지도 표시는 카카오 JavaScript SDK를 사용한다.
const mapContainer = document.getElementById('map');
const molitApiKey = import.meta.env.VITE_MOLIT_API_KEY;
const kakaoJsKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const publicDataApiKey = import.meta.env.VITE_PUBLIC_DATA_API_KEY;
const youthCenterApiUrl =
	import.meta.env.VITE_YOUTH_CENTER_API_URL || 'https://api.odcloud.kr/api/15077586/v1/centers';

let kakaoRef;
let map;
let allCenters = [];
let markers = [];

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
			reject(new Error('카카오 지도 SDK 로드 실패'));
		};

		document.head.appendChild(script);
	});
}

async function initMap() {
	if (!mapContainer) {
		throw new Error('id="map" 요소를 찾지 못했습니다.');
	}

	kakaoRef = await loadKakaoSdk(kakaoJsKey);
	const mapOption = {
		center: new kakaoRef.maps.LatLng(37.5665, 126.9780),
		level: 4
	};

	map = new kakaoRef.maps.Map(mapContainer, mapOption);

	// 시작할 때 전체 센터를 가져와 지도에 표시
	allCenters = await fetchCenters();
	renderMarkers(allCenters);
}

function toNumber(value) {
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function readLatLng(center) {
	const lat =
		toNumber(center.lat) ??
		toNumber(center.latitude) ??
		toNumber(center.y) ??
		toNumber(center.위도);
	const lng =
		toNumber(center.lng) ??
		toNumber(center.lon) ??
		toNumber(center.longitude) ??
		toNumber(center.x) ??
		toNumber(center.경도);

	if (lat === null || lng === null) {
		return null;
	}

	return { lat, lng };
}

function centerName(center) {
	return center.centerName || center.facilityName || center.orgNm || center.name || center.기관명 || '';
}

function centerRegion(center) {
	return center.sido || center.sigungu || center.address || center.addr || center.소재지 || '';
}

async function fetchCenters() {
	if (!publicDataApiKey) {
		throw new Error('VITE_PUBLIC_DATA_API_KEY 값이 없습니다.');
	}

	const url = new URL(youthCenterApiUrl);
	url.searchParams.set('serviceKey', publicDataApiKey);
	url.searchParams.set('page', '1');
	url.searchParams.set('perPage', '500');
	url.searchParams.set('returnType', 'JSON');

	const res = await fetch(url.toString());
	if (!res.ok) {
		throw new Error(`공공데이터 요청 실패: ${res.status}`);
	}

	const json = await res.json();
	return Array.isArray(json.data) ? json.data : [];
}

function clearMarkers() {
	for (const marker of markers) {
		marker.setMap(null);
	}
	markers = [];
}

function renderMarkers(centers) {
	clearMarkers();
	const bounds = new kakaoRef.maps.LatLngBounds();

	for (const center of centers) {
		const latLng = readLatLng(center);
		if (!latLng) {
			continue;
		}

		const position = new kakaoRef.maps.LatLng(latLng.lat, latLng.lng);
		const marker = new kakaoRef.maps.Marker({ position });
		marker.setMap(map);
		markers.push(marker);
		bounds.extend(position);
	}

	if (markers.length > 0) {
		map.setBounds(bounds);
	}

	return markers.length;
}

function distanceKm(lat1, lng1, lat2, lng2) {
	const toRad = (deg) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

//VITE_PUBLIC_DATA_API_KEY를 사용해서 검색,조회할 것
//상담센터 이름으로 검색하기 기능
function searchByName(keyword) {
	const q = (keyword || '').trim().toLowerCase();
	const filtered = allCenters.filter((c) => centerName(c).toLowerCase().includes(q));
	renderMarkers(filtered);
	return filtered;
}

//내 주변 상담센터 조회기능
function searchNearby(radiusKm = 5) {
	if (!navigator.geolocation) {
		throw new Error('브라우저가 위치 정보를 지원하지 않습니다.');
	}

	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				const filtered = allCenters.filter((c) => {
					const latLng = readLatLng(c);
					if (!latLng) {
						return false;
					}
					return distanceKm(latitude, longitude, latLng.lat, latLng.lng) <= radiusKm;
				});
				renderMarkers(filtered);
				resolve(filtered);
			},
			(err) => reject(err)
		);
	});
}

// 지역별 상담센터 조회기능
function searchByRegion(regionKeyword) {
	const q = (regionKeyword || '').trim().toLowerCase();
	const filtered = allCenters.filter((c) => centerRegion(c).toLowerCase().includes(q));
	renderMarkers(filtered);
	return filtered;
}

initMap().catch((error) => {
	console.error(error);
	if (mapContainer) {
		mapContainer.textContent = '지도를 불러오지 못했습니다. 콘솔 오류를 확인하세요.';
	}
});

// 추후 국토교통부 API를 연결할 때 사용
console.log('MOLIT API key loaded:', Boolean(molitApiKey));

// 콘솔에서 바로 테스트할 수 있게 전역으로 노출
// 예시: centerSearch.byName('서울'), centerSearch.byRegion('부산'), centerSearch.nearby(10)
window.centerSearch = {
	byName: searchByName,
	nearby: searchNearby,
	byRegion: searchByRegion
};
