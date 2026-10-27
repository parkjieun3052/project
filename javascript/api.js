document.addEventListener('DOMContentLoaded', () => {
const button = document.getElementById('testButton');
const result = document.getElementById('result');

if (!button || !result) {
    return;
}

button.addEventListener('click', () => {
    // 배포된 웹서버에서 버튼 클릭이 되면 클릭되었다고 확인
    result.textContent = 'ok';
    console.log('버튼 클릭됨');
});
});