const fallbackPrograms = [
	{
		title: '전국민 마음투자 지원사업',
		scope: '국가',
		region: '전국',
		ages: ['청년', '성인', '중장년'],
		target: '청년, 성인',
		support: '전문 심리상담 8회 바우처 지원',
		period: '상시 접수',
		status: '접수중',
		apply: '복지로 또는 주민센터 방문 신청',
		docs: '신분증, 건강보험 자격확인서',
		contact: '보건복지상담센터 129'
	},
	{
		title: '청소년상담복지센터 연계 지원',
		scope: '국가',
		region: '전국',
		ages: ['청소년', '보호자'],
		target: '청소년, 보호자',
		support: '개인상담 및 위기개입 프로그램',
		period: '연중 상시',
		status: '접수중',
		apply: '청소년전화 1388 또는 지역 센터 접수',
		docs: '기본 상담신청서',
		contact: '청소년전화 1388'
	},
	{
		title: '서울시 청년 마음건강 지원',
		scope: '지자체',
		region: '서울',
		ages: ['청년'],
		target: '만 19~39세 청년',
		support: '심층상담 및 맞춤형 심리지원 프로그램',
		period: '분기별 모집',
		status: '접수중',
		apply: '서울시 청년몽땅정보통 온라인 신청',
		docs: '신분증, 거주지 증빙',
		contact: '다산콜센터 120'
	},
	{
		title: '아동·청소년 정서발달 바우처',
		scope: '국가',
		region: '전국',
		ages: ['아동', '청소년'],
		target: '만 7~18세 아동·청소년',
		support: '정서·행동 발달 프로그램 및 상담 연계',
		period: '연중 지자체 공고',
		status: '접수중',
		apply: '주민센터 또는 복지로 신청',
		docs: '보호자 신분증, 기본 증빙서류',
		contact: '보건복지상담센터 129'
	}
];

const env = import.meta.env || {};
const API_TIMEOUT_MS = Number(env.VITE_PUBLIC_DATA_TIMEOUT_MS || 8000);
const SUPPORT_PROXY_ENDPOINT = env.VITE_SUPPORT_PROXY_ENDPOINT || '/api/support';

const SOURCE_CONFIGS = [
	{ source: 'national', scope: '국가', defaultRegion: '전국' },
	{ source: 'local', scope: '지자체', defaultRegion: '' },
	{ source: 'youth', scope: '국가', defaultRegion: '전국' }
];

let programs = [...fallbackPrograms];

const supportGrid = document.getElementById('supportGrid');
const supportKeyword = document.getElementById('supportKeyword');
const supportRegion = document.getElementById('supportRegion');
const supportAge = document.getElementById('supportAge');
const supportSelectRow = document.getElementById('supportSelectRow');
const supportRegionWrap = document.getElementById('supportRegionWrap');
const supportAgeWrap = document.getElementById('supportAgeWrap');
const scopeButtons = document.querySelectorAll('.support-filter-chip');
const supportResultText = document.getElementById('supportResultText');
const programCount = document.getElementById('programCount');

let activeScope = 'all';

function pickValue(record, keys, fallback = '') {
	for (const key of keys) {
		const value = record?.[key];
		if (value !== undefined && value !== null && String(value).trim()) {
			return String(value).trim();
		}
	}
	return fallback;
}

function inferAges(targetText) {
	const text = String(targetText || '');
	const ages = [];

	if (/아동|유아|초등/.test(text)) {
		ages.push('아동');
	}
	if (/청소년|중고생|학생/.test(text)) {
		ages.push('청소년');
	}
	if (/청년/.test(text)) {
		ages.push('청년');
	}
	if (/성인/.test(text)) {
		ages.push('성인');
	}
	if (/중장년|장년|노년|어르신|고령/.test(text)) {
		ages.push('중장년');
	}
	if (/보호자|부모|양육자/.test(text)) {
		ages.push('보호자');
	}

	return ages.length ? ages : ['성인'];
}

function findFirstArray(node) {
	if (Array.isArray(node) && node.length > 0 && typeof node[0] === 'object') {
		return node;
	}
	if (!node || typeof node !== 'object') {
		return null;
	}

	for (const value of Object.values(node)) {
		const found = findFirstArray(value);
		if (found) {
			return found;
		}
	}

	return null;
}

function parseXmlItems(xmlText) {
	const parser = new DOMParser();
	const xml = parser.parseFromString(xmlText, 'application/xml');
	const parserError = xml.querySelector('parsererror');
	if (parserError) {
		return [];
	}

	const items = [...xml.querySelectorAll('item')];
	return items.map((item) => {
		const data = {};
		for (const child of [...item.children]) {
			data[child.tagName] = child.textContent?.trim() || '';
		}
		return data;
	});
}

async function fetchSource(config) {
	if (!config.source) {
		return [];
	}

	const url = new URL(SUPPORT_PROXY_ENDPOINT, window.location.origin);
	url.searchParams.set('source', config.source);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
	let response;
	try {
		response = await fetch(url.toString(), { signal: controller.signal });
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error(`API 응답 시간 초과(${API_TIMEOUT_MS}ms)`);
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
	if (!response.ok) {
		throw new Error(`API 요청 실패 (${response.status})`);
	}

	const contentType = response.headers.get('content-type') || '';
	let records = [];

	if (contentType.includes('application/json')) {
		const json = await response.json();
		records = findFirstArray(json) || [];
	} else {
		const text = await response.text();
		records = parseXmlItems(text);
	}

	return records
		.map((record) => {
			const title = pickValue(record, ['servNm', 'svcNm', 'title', 'programName', 'serviceName', 'bizNm']);
			if (!title) {
				return null;
			}

			const region = pickValue(record, ['ctpvNm', 'sidoNm', 'region', 'areaNm', 'signguNm'], config.defaultRegion || '전국');
			const target = pickValue(record, ['sprtTrgtCn', 'target', 'trgterIndvdlArrayCn', 'tgtrDtlCn'], '대상 정보 확인 필요');
			const support = pickValue(record, ['alwServCn', 'support', 'intrcnCn', 'servDgst'], '지원내용 확인 필요');
			const period = pickValue(record, ['aplyPrdCn', 'period', 'rceptBgngYmd'], '모집 공고 확인');
			const apply = pickValue(record, ['aplyMthCn', 'aplyMthdCn', 'apply'], '공고문 확인 후 신청');
			const docs = pickValue(record, ['sbmsnDcmntCn', 'docs'], '신청 시 필요서류 확인');
			const contact = pickValue(record, ['inqNum', 'callCenterNo', 'phoneNo', 'contact'], '관할 기관 문의');

			return {
				title,
				scope: config.scope,
				region,
				ages: inferAges(target),
				target,
				support,
				period,
				status: '접수중',
				apply,
				docs,
				contact
			};
		})
		.filter(Boolean);
}

async function loadProgramsFromApi() {
	const enabledSources = SOURCE_CONFIGS.filter((source) => source.source);
	if (!enabledSources.length) {
		throw new Error('API URL이 설정되지 않았습니다.');
	}

	const settled = await Promise.allSettled(enabledSources.map((source) => fetchSource(source)));
	const merged = [];
	for (const result of settled) {
		if (result.status === 'fulfilled') {
			merged.push(...result.value);
		}
	}

	if (!merged.length) {
		throw new Error('API 응답에서 사업 데이터를 찾지 못했습니다.');
	}

	const deduped = [];
	const seen = new Set();
	for (const item of merged) {
		const key = `${item.title}-${item.region}-${item.scope}`;
		if (!seen.has(key)) {
			seen.add(key);
			deduped.push(item);
		}
	}

	return deduped;
}

function getStatusClass(status) {
	if (status === '마감임박') {
		return 'is-close';
	}
	if (status === '접수예정') {
		return 'is-scheduled';
	}
	return 'is-open';
}

function renderPrograms(list) {
	if (!supportGrid) {
		return;
	}

	if (!list.length) {
		supportGrid.innerHTML = '<p class="support-empty">조건에 맞는 사업이 없습니다. 검색어 또는 필터를 변경해 보세요.</p>';
		if (supportResultText) {
			supportResultText.textContent = '검색 결과가 없습니다.';
		}
		return;
	}

	supportGrid.innerHTML = list
		.map((program) => {
			const statusClass = getStatusClass(program.status);
			return `
				<article class="support-card">
					<div class="support-card-head">
						<span class="support-badge">${program.scope} · ${program.region}</span>
						<span class="support-state ${statusClass}">${program.status}</span>
					</div>
					<h3>${program.title}</h3>
					<p class="support-target"><strong>지원대상</strong> ${program.target}</p>
					<p class="support-benefit"><strong>지원내용</strong> ${program.support}</p>
					<ul>
						<li><strong>신청기간</strong> ${program.period}</li>
						<li><strong>문의처</strong> ${program.contact}</li>
					</ul>
					<details>
						<summary>신청방법/서류 보기</summary>
						<p><strong>신청방법</strong> ${program.apply}</p>
						<p><strong>준비서류</strong> ${program.docs}</p>
					</details>
				</article>
			`;
		})
		.join('');

	if (supportResultText) {
		supportResultText.textContent = `총 ${list.length}개 사업이 검색되었습니다.`;
	}
}

function filterPrograms() {
	const keyword = (supportKeyword?.value || '').trim();
	const selectedRegion = supportRegion?.value || 'all';
	const selectedAge = supportAge?.value || 'all';
	const useRegionFilter = activeScope === '지자체';
	const useAgeFilter = activeScope === '연령별';
	const filtered = programs.filter((program) => {
		const matchesScope = activeScope === 'all' || activeScope === '연령별' || program.scope === activeScope;
		const matchesRegion = !useRegionFilter || selectedRegion === 'all' || program.region === selectedRegion || program.region === '전국';
		const matchesAge = !useAgeFilter || selectedAge === 'all' || program.ages.includes(selectedAge);
		const haystack = `${program.title} ${program.target} ${program.region} ${program.support}`;
		const matchesKeyword = !keyword || haystack.includes(keyword);
		return matchesScope && matchesRegion && matchesAge && matchesKeyword;
	});

	renderPrograms(filtered);
}

function updateConditionalFilters() {
	const showRegion = activeScope === '지자체';
	const showAge = activeScope === '연령별';

	if (supportRegionWrap) {
		supportRegionWrap.classList.toggle('is-visible', showRegion);
	}

	if (supportAgeWrap) {
		supportAgeWrap.classList.toggle('is-visible', showAge);
	}

	if (supportSelectRow) {
		supportSelectRow.classList.toggle('is-visible', showRegion || showAge);
	}

	if (!showRegion && supportRegion) {
		supportRegion.value = 'all';
	}

	if (!showAge && supportAge) {
		supportAge.value = 'all';
	}
}

function updateProgramCount() {
	if (programCount) {
		programCount.textContent = String(programs.length);
	}
}

for (const button of scopeButtons) {
	button.addEventListener('click', () => {
		activeScope = button.dataset.scope || 'all';
		for (const node of scopeButtons) {
			node.classList.toggle('active', node === button);
		}
		updateConditionalFilters();
		filterPrograms();
	});
}

if (supportKeyword) {
	supportKeyword.addEventListener('input', filterPrograms);
}

if (supportRegion) {
	supportRegion.addEventListener('change', filterPrograms);
}

if (supportAge) {
	supportAge.addEventListener('change', filterPrograms);
}

async function init() {
	updateProgramCount();
	updateConditionalFilters();
	filterPrograms();

	try {
		if (supportResultText) {
			supportResultText.textContent = '기본 목록을 먼저 표시했고, 정부지원사업 API 최신 정보를 불러오는 중입니다.';
		}
		programs = await loadProgramsFromApi();
		if (supportResultText) {
			supportResultText.textContent = `API 연동 완료: 총 ${programs.length}개 사업`;
		}
	} catch (error) {
		console.error(error);
		programs = fallbackPrograms;
		if (supportResultText) {
			const reason = error instanceof Error ? error.message : '알 수 없는 오류';
			supportResultText.textContent = `API 연결 실패(${reason}) - 기본 목록을 표시합니다. 환경변수/API URL/CORS를 확인하세요.`;
		}
	}

	updateProgramCount();
	updateConditionalFilters();
	filterPrograms();
}

init();