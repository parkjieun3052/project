const menuButton = document.getElementById('menuButton');
const mainNav = document.getElementById('mainNav');
const nameSearchForm = document.getElementById('nameSearchForm');
const regionSearchForm = document.getElementById('regionSearchForm');
const regionSelect = document.getElementById('regionSelect');
const nearbyButton = document.getElementById('nearbyButton');
const resultMessage = document.getElementById('resultMessage');
const resultCount = document.getElementById('resultCount');
const centerResults = document.getElementById('centerResults');

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

function setResults(regionText, count) {
  if (resultMessage) {
    resultMessage.textContent = `${regionText} 기준으로 상담센터를 찾았습니다.`;
  }
  if (resultCount) {
    resultCount.textContent = `${count}개 센터`;
  }
  if (centerResults) {
    centerResults.setAttribute('data-region', regionText);
  }
}

if (nameSearchForm) {
  nameSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const keywordInput = document.getElementById('centerKeyword');
    const keyword = (keywordInput?.value || '').trim();
    const label = keyword ? `“${keyword}”` : '입력한 키워드';
    setResults(label, 2);
  });
}

if (regionSearchForm) {
  regionSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = regionSelect?.value;
    if (!value) {
      setResults('지역을 선택해주세요', 0);
      return;
    }
    setResults(value, 3);
  });
}

if (nearbyButton) {
  nearbyButton.addEventListener('click', () => {
    setResults('현재 위치 주변', 5);
  });
}

for (const link of document.querySelectorAll('.inactive-link')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    alert('해당 기능은 아직 준비 중입니다.');
  });
}
