const menuButton = document.getElementById('menuButton');
const mainNav = document.getElementById('mainNav');

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

for (const link of document.querySelectorAll('.inactive-link')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    alert('해당 기능은 아직 준비 중입니다.');
  });
}
