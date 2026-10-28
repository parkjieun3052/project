const getForm = document.getElementById('getForm');
const postForm = document.getElementById('postForm');
const result = document.getElementById('result');

getForm.addEventListener('submit', (event) => {
    event.preventDefault();
    result.textContent = 'GET 요청 처리 완료';
});

postForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(postForm);
    const data = formData.get('data')?.toString().trim() || '(빈 값)';

    result.textContent = `저장된 데이터: ${data}`;
});

