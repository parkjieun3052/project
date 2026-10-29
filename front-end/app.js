// kakao map api를 가지고 지도를 생성하고 그위에 공공데이터 포털 API 키 - 전국_청소년상담복지센터 데이터를 표시하기
const mapContainer = document.getElementById('map'); // 지도를 표시할 div 
const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 지도의 중심좌표
    level: 3 // 지도의 확대 레벨
};
const map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성
// 공공데이터 포털 API 키 - 전국_청소년상담복지센터 데이터를 가져와서 지도에 마커로 표시
fetch(`https://api.odcloud.kr/api/15077586/v1/centers?serviceKey=${import.meta.env.VITE_PUBLIC_DATA_API_KEY}`)
    .then(response => response.json())
    .then(data => {
        data.data.forEach(center => {
            const markerPosition = new kakao.maps.LatLng(center.lat, center.lng);
            const marker = new kakao.maps.Marker({
                position: markerPosition
            });
            marker.setMap(map);
        });
    })
    .catch(error => console.error('Error fetching data:', error));

