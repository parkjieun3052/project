document.addEventListener('DOMContentLoaded', () => {
const button = document.getElementById('testButton');
const result = document.getElementById('result');

if (!button || !result) {
    return;
}

button.addEventListener('click', () => {
    // 배포된 웹서버에서 버튼 클릭이 되면 화면에 확인됨
    result.textContent = '버튼이 클릭되었습니다!';
});
});