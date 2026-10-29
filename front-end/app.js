const mapContainer = document.getElementById('map');
const resultList = document.getElementById('resultList');
const kakaoJsKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const kakaoRestKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

// id를 추가하지 않고 현재 HTML 구조에서 컨트롤을 선택
const nameInput = document.querySelector('input[type="text"]');
const regionSelect = document.querySelector('select[name="region"]');
const buttons = document.querySelectorAll('button');
const nameSearchButton = buttons[0];
const nearbySearchButton = buttons[1];
const regionSearchButton = buttons[2];

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

function renderResultList(documents) {
	if (!resultList) {
		return;
	}

	resultList.innerHTML = '';
	for (const doc of documents || []) {
		const item = document.createElement('li');
		const name = doc.place_name || '이름 없음';
		const address = doc.road_address_name || doc.address_name || '주소 없음';
		item.textContent = `${name} - ${address}`;
		resultList.appendChild(item);
	}
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
	renderResultList(json.documents);
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
		renderResultList([]);
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
	renderResultList(json.documents);
	return json;
}

function bindUiEvents() {
	if (nameSearchButton) {
		nameSearchButton.addEventListener('click', async () => {
			const keyword = (nameInput?.value || '').trim();
			if (!keyword) {
				alert('검색어를 입력하세요.');
				return;
			}

			try {
				await regionKakaoApi(keyword);
			} catch (error) {
				console.error(error);
				alert('이름 검색 중 오류가 발생했습니다.');
			}
		});
	}

	if (nearbySearchButton) {
		nearbySearchButton.addEventListener('click', async () => {
			const address = (nameInput?.value || '').trim();
			if (!address) {
				alert('기준 주소를 입력하세요.');
				return;
			}

			try {
				await nearbyKakaoApi(address);
			} catch (error) {
				console.error(error);
				alert('내 주변 검색 중 오류가 발생했습니다.');
			}
		});
	}

	if (regionSearchButton) {
		regionSearchButton.addEventListener('click', async () => {
			const value = (regionSelect?.selectedOptions?.[0]?.textContent || '').trim();
			if (!value || value === '선택하세요') {
				alert('지역을 선택하세요.');
				return;
			}

			try {
				await regionKakaoApi(value);
			} catch (error) {
				console.error(error);
				alert('지역 검색 중 오류가 발생했습니다.');
			}
		});
	}
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

bindUiEvents();

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
