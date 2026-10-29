const mapContainer = document.getElementById('map');
const kakaoJsKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const kakaoRestKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

let kakaoRef;
let map;
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
		script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
		script.onerror = () => reject(new Error('카카오 지도 SDK 로드 실패'));
		document.head.appendChild(script);
	});
}

function clearMarkers() {
	for (const marker of markers) {
		marker.setMap(null);
	}
	markers = [];
}

function renderPlaces(documents) {
	clearMarkers();
	const bounds = new kakaoRef.maps.LatLngBounds();

	for (const doc of documents || []) {
		const x = Number(doc.x);
		const y = Number(doc.y);
		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			continue;
		}

		const position = new kakaoRef.maps.LatLng(y, x);
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

async function kakaoGet(url, params) {
	if (!kakaoRestKey) {
		throw new Error('VITE_KAKAO_REST_API_KEY 값이 없습니다.');
	}

	const endpoint = new URL(url);
	Object.entries(params || {}).forEach(([k, v]) => endpoint.searchParams.set(k, String(v)));

	const response = await fetch(endpoint.toString(), {
		headers: { Authorization: `KakaoAK ${kakaoRestKey}` }
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`카카오 API 오류 ${response.status}: ${text}`);
	}

	return response;
}

// 정적 지도 조회 (python map_api)
async function mapApi(mapLocation) {
	const response = await kakaoGet('https://dapi.kakao.com/v2/maps/staticmap', {
		center: mapLocation,
		size: '640x480',
		level: 3,
		markers: `location:${mapLocation}|option:false`
	});
	return response.blob();
}

// 지역별 상담센터 검색 (python region_kakaoapi)
async function regionKakaoApi(keyword) {
	const response = await kakaoGet('https://dapi.kakao.com/v2/local/search/keyword.json', {
		query: `${keyword} 상담센터`
	});
	const json = await response.json();
	renderPlaces(json.documents);
	return json;
}

// 주소를 좌표로 변환 (python address_to_coordinates)
async function addressToCoordinates(address) {
	const response = await kakaoGet('https://dapi.kakao.com/v2/local/search/address.json', {
		query: address
	});
	const json = await response.json();
	const first = json.documents?.[0];

	if (!first) {
		return null;
	}

	return { x: Number(first.x), y: Number(first.y) };
}

// 내 주변 상담센터 검색 (python nearby_kakaoapi)
async function nearbyKakaoApi(address) {
	const coordinates = await addressToCoordinates(address);
	if (!coordinates) {
		return null;
	}

	const response = await kakaoGet('https://dapi.kakao.com/v2/local/search/keyword.json', {
		query: '상담센터',
		x: coordinates.x,
		y: coordinates.y,
		radius: 5000,
		sort: 'distance'
	});
	const json = await response.json();
	renderPlaces(json.documents);
	return json;
}

async function initMap() {
	if (!mapContainer) {
		throw new Error('id="map" 요소를 찾지 못했습니다.');
	}

	kakaoRef = await loadKakaoSdk(kakaoJsKey);
	map = new kakaoRef.maps.Map(mapContainer, {
		center: new kakaoRef.maps.LatLng(37.5665, 126.978),
		level: 4
	});
}

initMap().catch((error) => {
	console.error(error);
	if (mapContainer) {
		mapContainer.textContent = '지도를 불러오지 못했습니다. 콘솔 오류를 확인하세요.';
	}
});

// 콘솔 테스트용
// kakaoApi.region('서울')
// kakaoApi.nearby('서울시청')
// kakaoApi.toCoordinates('서울특별시 중구 세종대로 110')
window.kakaoApi = {
	mapApi,
	region: regionKakaoApi,
	toCoordinates: addressToCoordinates,
	nearby: nearbyKakaoApi
};
