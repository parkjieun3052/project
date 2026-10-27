document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('testButton');

  if (!button) {
    return;
  }

  button.addEventListener('click', () => {
    console.log('버튼 클릭됨');
  });
});
