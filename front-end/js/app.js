const mapContainer = document.getElementById('map');
const resultList = document.getElementById('resultList');
const kakaoJsKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const kakaoRestKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

const searchInput = document.getElementById('searchInput') || document.getElementById('centerKeyword');
const searchButton = document.getElementById('searchButton') || document.querySelector('#nameSearchForm button[type="submit"]');
const nearbyButton = document.getElementById('nearbyButton');
const regionSelect = document.getElementById('regionSelect');
const nameSearchForm = document.getElementById('nameSearchForm');
const regionSearchForm = document.getElementById('regionSearchForm');

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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=${encodeURIComponent(appKey)}`;
    script.async = true;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve(window.kakao));
        return;
      }
      reject(new Error('카카오 지도 SDK가 로드되었지만 초기화되지 않았습니다.'));
    };
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
  resultList.style.display = documents && documents.length ? 'block' : 'none';

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

async function mapApi(mapLocation) {
  const response = await kakaoGet('https://dapi.kakao.com/v2/maps/staticmap', {
    center: mapLocation,
    size: '640x480',
    level: 3,
    markers: `location:${mapLocation}|option:false`
  });
  return response.blob();
}

async function regionKakaoApi(keyword) {
  const response = await kakaoGet('https://dapi.kakao.com/v2/local/search/keyword.json', {
    query: `${keyword} 상담센터`
  });
  const json = await response.json();
  renderPlaces(json.documents);
  renderResultList(json.documents);
  return json;
}

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

async function handleSearch() {
  const keyword = (searchInput?.value || '').trim();
  if (!keyword) {
    alert('검색어를 입력하세요.');
    return;
  }

  try {
    await regionKakaoApi(keyword);
    if (document.getElementById('center-search')) {
      document.getElementById('center-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error(error);
    alert('상담센터 검색 중 오류가 발생했습니다.');
  }
}

async function handleRegionSearch() {
  const value = regionSelect?.value?.trim();
  if (!value) {
    alert('지역을 선택하세요.');
    return;
  }

  try {
    await regionKakaoApi(value);
  } catch (error) {
    console.error(error);
    alert('지역 검색 중 오류가 발생했습니다.');
  }
}

async function handleNearbySearch() {
  const fallbackText = (searchInput?.value || '').trim();

  try {
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('위치 정보 접근 실패')));
      });

      const response = await kakaoGet('https://dapi.kakao.com/v2/local/search/keyword.json', {
        query: '상담센터',
        x: position.coords.longitude,
        y: position.coords.latitude,
        radius: 5000,
        sort: 'distance'
      });
      const json = await response.json();
      renderPlaces(json.documents);
      renderResultList(json.documents);
      return;
    }

    if (fallbackText) {
      await nearbyKakaoApi(fallbackText);
      return;
    }

    alert('현재 위치를 가져오지 못했고, 기준 주소도 입력되지 않았습니다.');
  } catch (error) {
    console.error(error);
    if (fallbackText) {
      try {
        await nearbyKakaoApi(fallbackText);
      } catch (fallbackError) {
        console.error(fallbackError);
        alert('내 주변 상담센터 검색 중 오류가 발생했습니다.');
      }
      return;
    }
    alert('내 주변 상담센터를 불러오지 못했습니다.');
  }
}

function bindUiEvents() {
  if (searchButton) {
    searchButton.addEventListener('click', handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    });
  }

  if (nearbyButton) {
    nearbyButton.addEventListener('click', handleNearbySearch);
  }

  if (regionSearchForm) {
    regionSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleRegionSearch();
    });
  }

  if (nameSearchForm) {
    nameSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleSearch();
    });
  }
}

async function initMap() {
  if (!mapContainer) {
    return;
  }

  kakaoRef = await loadKakaoSdk(kakaoJsKey);
  map = new kakaoRef.maps.Map(mapContainer, {
    center: new kakaoRef.maps.LatLng(37.5665, 126.978),
    level: 4
  });
}

window.kakaoApi = {
  mapApi,
  region: regionKakaoApi,
  toCoordinates: addressToCoordinates,
  nearby: nearbyKakaoApi
};

bindUiEvents();

const params = new URLSearchParams(window.location.search);
const initialKeyword = params.get('keyword');
if (initialKeyword && searchInput) {
  searchInput.value = initialKeyword;
  handleSearch();
}

initMap().catch((error) => {
  console.error(error);
  if (mapContainer) {
    mapContainer.textContent = '지도를 불러오지 못했습니다. 콘솔 오류를 확인하세요.';
  }
});

