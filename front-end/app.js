// 국토교통부 API 키는 이후 데이터 조회용으로 보관하고,
// 지도 표시는 카카오 JavaScript SDK를 사용한다.
const mapContainer = document.getElementById('map');
const molitApiKey = import.meta.env.VITE_MOLIT_API_KEY;
const kakaoJsKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

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

	const kakao = await loadKakaoSdk(kakaoJsKey);
	const mapOption = {
		center: new kakao.maps.LatLng(37.5665, 126.9780),
		level: 4
	};

	new kakao.maps.Map(mapContainer, mapOption);
}

initMap().catch((error) => {
	console.error(error);
	if (mapContainer) {
		mapContainer.textContent = '지도를 불러오지 못했습니다. 콘솔 오류를 확인하세요.';
	}
});

// 추후 국토교통부 API를 연결할 때 사용
console.log('MOLIT API key loaded:', Boolean(molitApiKey));