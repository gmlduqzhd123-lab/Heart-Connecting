let scenarios = [];
let currentScenario = null;
let currentFilter = 'all';
let showingFavorites = false;
let showingReflections = false;
let displayLimit = 12;
let roleSwapped = false;
let searchQuery = '';
let currentStep = 1;
let stepInputs = {1: '', 2: '', 3: ''};
let memoryMode = false;
let lessonTimer = null;
let lessonRemaining = 0;

const encourageMessages = [
  "잘했어! 친구 마음을 생각해보는 게 정말 어려웠을 텐데 용감했어.",
  "멋진 성찰이야. 이렇게 마음을 돌아보는 습관이 중요해.",
  "오늘도 한 걸음 더 나아갔어. 정말 잘하고 있어!",
  "서로의 마음을 이해하려고 노력하는 모습이 보기 좋아.",
  "연습한 만큼 진짜 상황에서도 더 잘 말할 수 있을 거야.",
  "역할까지 바꿔서 생각해보다니 정말 대단해!"
];

const teacherTips = {
  "친구 관계": "쉬는 시간이나 점심시간에 간단히 함께 연습해 보세요. 학생이 직접 역할을 바꿔 해보게 하면 공감 효과가 커집니다.",
  "모둠 활동": "모둠 활동 시작 전에 2분 정도 관련 상황을 다뤄보면 갈등을 예방할 수 있습니다.",
  "수업 중": "수업 중 생긴 갈등을 바로 다루기보다 쉬는 시간에 성찰로 연결해 보세요.",
  "놀이터": "체육 시간이나 쉬는 시간 후 간단한 대화 자료로 활용하기 좋습니다.",
  "급식시간": "급식 후 짧은 성찰 활동으로 연결하면 효과가 있습니다.",
  "쉬는 시간": "갈등 상황 직후 바로 연습하기 좋은 주제입니다."
};

const stepPrompts = {
  1: {
    title: '1. 내 마음 말하기',
    guide: '이 상황에서 내가 느낀 감정을 말해보세요. "나는 ~해서 속상했어/화가 났어/서운했어."',
    placeholder: '예: 나는 이야기를 다 끝내지 못해서 서운했어.'
  },
  2: {
    title: '2. 친구 입장 생각해보기',
    guide: '친구는 어떤 마음이었을까요? 추측이 아니라 "혹시 ~했니?"라고 물어볼 수도 있어요.',
    placeholder: '예: 혹시 급해서 그랬니? 또는 친구는 그냥 재미로 말했을 수도 있어.'
  },
  3: {
    title: '3. 좋은 말 찾기',
    guide: '내가 바라는 점이나 요청을 구체적으로 말해보세요. "다음에는 ~해줬으면 좋겠어."',
    placeholder: '예: 다음에는 이야기를 끝까지 들어줬으면 좋겠어.'
  }
};

const lessonPresets = {
  5: '5분: 상황 1개 선택 → 1단계 마음 말하기 → 느낌 나누기',
  10: '10분: 상황 1개 → 3단계 연습 → 역할 바꾸기 → 성찰',
  40: '40분: 추천 상황 2~3개 → 모둠 연습 → 전체 나눔 → 성찰 정리'
};

function getStorage(key, fallback) {
  if (memoryMode) return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function setStorage(key, value) {
  if (memoryMode) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

async function loadScenarios() {
  const listEl = document.getElementById('scenario-list');
  try {
    const res = await fetch('scenarios.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.scenarios || !Array.isArray(data.scenarios) || data.scenarios.length === 0) {
      throw new Error('empty or invalid data');
    }
    scenarios = data.scenarios;
    renderDashboard();
    renderTodayRecommend();
    renderScenarioList('all');
    updateModeUI();
    renderLessonPresets();
  } catch (e) {
    listEl.innerHTML = '<p style="text-align:center; color:#c00;">상황 자료를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.</p><button onclick="location.reload()" class="load-more-btn">다시 시도</button>';
    document.getElementById('stats').textContent = '자료를 불러오지 못했습니다.';
    document.getElementById('today-card').innerHTML = '<p>추천 자료를 준비 중입니다.</p>';
  }
}

function markOpened(id) {
  const opened = getStorage('opened', []);
  if (!opened.includes(id)) {
    opened.push(id);
    setStorage('opened', opened);
  }
}

function getFavorites() {
  return getStorage('favorites', []);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  setStorage('favorites', favs);
  updateFavButton();
  renderDashboard();
}

function updateFavButton() {
  const btn = document.getElementById('fav-btn');
  if (!currentScenario || !btn) return;
  const isFav = getFavorites().includes(currentScenario.id);
  btn.textContent = isFav ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
  btn.classList.toggle('active', isFav);
}

function renderDashboard() {
  const opened = getStorage('opened', []);
  const reflections = memoryMode ? 0 : Object.keys(localStorage).filter(k => k.startsWith('reflection_')).length;
  const favs = getFavorites().length;
  document.getElementById('stats').textContent = `본 상황 ${opened.length}개 · 성찰 ${reflections}개 · 즐겨찾기 ${favs}개${memoryMode ? ' (메모리 모드)' : ''}`;
}

function renderTodayRecommend() {
  if (scenarios.length === 0) return;
  const recommended = scenarios.filter(s => s.teaching?.recommended);
  const pool = recommended.length > 0 ? recommended : scenarios;
  const day = new Date().getDate();
  const scenario = pool[day % pool.length];
  document.getElementById('today-card').innerHTML = `
    <div class="scenario-item" data-id="${scenario.id}" style="margin:0;">
      <div class="top-row">
        <span class="cat-badge">${scenario.category}</span>
        <span class="item-title">${scenario.title}</span>
      </div>
      <div class="item-preview">${scenario.situation.substring(0, 60)}...</div>
    </div>
  `;
  const card = document.querySelector('#today-card .scenario-item');
  if (card) card.addEventListener('click', () => showScenario(scenario.id));
}

function filterBySearch(items) {
  if (!searchQuery) return items;
  const q = searchQuery.toLowerCase().trim();
  return items.filter(s =>
    (s.title || '').toLowerCase().includes(q) ||
    (s.situation || '').toLowerCase().includes(q) ||
    (s.category || '').toLowerCase().includes(q)
  );
}

function renderListItems(items, container) {
  const limited = items.slice(0, displayLimit);
  container.innerHTML = limited.map(s => `
    <div class="scenario-item" data-id="${s.id}">
      <div class="top-row">
        <span class="cat-badge">${s.category}</span>
        <span class="item-title">${s.title}${s.teaching?.recommended ? ' ⭐' : ''}</span>
      </div>
      <div class="item-preview">${(s.situation || '').substring(0, 70)}${(s.situation || '').length > 70 ? '...' : ''}</div>
    </div>
  `).join('');

  if (items.length > displayLimit) {
    container.innerHTML += `<button id="load-more" class="load-more-btn">더 보기 (${items.length - displayLimit}개 더)</button>`;
    document.getElementById('load-more').onclick = () => {
      displayLimit += 12;
      refreshCurrentList();
    };
  }

  container.querySelectorAll('.scenario-item').forEach(item => {
    item.onclick = () => showScenario(item.dataset.id);
  });
}

function refreshCurrentList() {
  if (showingFavorites) renderFavorites();
  else if (showingReflections) renderReflections();
  else renderScenarioList(currentFilter);
}

function renderScenarioList(category) {
  currentFilter = category;
  showingFavorites = false;
  showingReflections = false;
  const container = document.getElementById('scenario-list');
  let filtered = category === 'all' ? scenarios : scenarios.filter(s => s.category === category);
  filtered = filterBySearch(filtered);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">해당 조건의 시나리오가 없습니다. 😊</p>';
    return;
  }

  renderListItems(filtered, container);
  document.getElementById('list-title').textContent = searchQuery ? `"${searchQuery}" 검색 결과` : '상황 선택하기';
}

function renderFavorites() {
  showingFavorites = true;
  showingReflections = false;
  const favs = getFavorites();
  let filtered = scenarios.filter(s => favs.includes(s.id));
  filtered = filterBySearch(filtered);
  const container = document.getElementById('scenario-list');
  document.getElementById('list-title').textContent = '내가 저장한 상황';
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">아직 저장한 상황이 없어요.</p>';
    return;
  }
  renderListItems(filtered, container);
}

function renderReflections() {
  showingFavorites = false;
  showingReflections = true;
  const container = document.getElementById('scenario-list');
  document.getElementById('list-title').textContent = '내가 작성한 성찰';
  if (memoryMode) {
    container.innerHTML = '<p style="text-align:center; color:#888;">메모리 모드에서는 성찰이 저장되지 않습니다.</p>';
    return;
  }
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('reflection_')) {
      const id = key.replace('reflection_', '');
      const scenario = scenarios.find(s => s.id === id);
      if (scenario) items.push(scenario);
    }
  }
  const filtered = filterBySearch(items);
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">아직 작성한 성찰이 없어요.</p>';
    return;
  }
  renderListItems(filtered, container);
}

function saveCurrentStepInput() {
  const input = document.getElementById('step-input');
  if (input) stepInputs[currentStep] = input.value;
}

function showStepContent(step) {
  currentStep = step;
  const container = document.getElementById('step-content');
  if (!container) return;
  const p = stepPrompts[step];
  container.innerHTML = `
    <h4>${p.title}</h4>
    <p class="step-guide">${p.guide}</p>
    <textarea id="step-input" placeholder="${p.placeholder}" rows="3">${stepInputs[step] || ''}</textarea>
  `;
  document.querySelectorAll('.step').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.step) === step);
  });
}

function initPracticeSteps() {
  stepInputs = {1: '', 2: '', 3: ''};
  currentStep = 1;
  showStepContent(1);
  document.querySelectorAll('.step').forEach(step => {
    step.onclick = () => {
      saveCurrentStepInput();
      showStepContent(parseInt(step.dataset.step));
    };
  });
}

function showScenario(id) {
  currentScenario = scenarios.find(s => s.id === id);
  if (!currentScenario) return;
  roleSwapped = false;
  markOpened(id);
  renderDashboard();

  document.getElementById('intro').classList.add('hidden');
  document.getElementById('practice').classList.remove('hidden');

  document.getElementById('scenario-title').textContent = currentScenario.title;
  document.getElementById('scenario-situation').textContent = currentScenario.situation;
  renderScripts();
  initPracticeSteps();

  document.getElementById('empathy-list').innerHTML =
    (currentScenario.empathy_examples || []).map(ex => `<li>${ex}</li>`).join('');
  document.getElementById('questions-list').innerHTML =
    (currentScenario.questions || []).map(q => `<li>${q}</li>`).join('');

  const saved = memoryMode ? '' : (localStorage.getItem(`reflection_${id}`) || '');
  document.getElementById('reflection').value = saved;
  document.getElementById('save-message').classList.add('hidden');
  document.getElementById('encourage').classList.add('hidden');

  updateFavButton();
  updateTeacherTip();
  document.getElementById('swap-role-btn').textContent = '🔄 역할 바꾸기';
}

function renderScripts() {
  const scriptsEl = document.getElementById('scripts');
  let scripts = currentScenario.scripts || [];
  if (roleSwapped && scripts.length >= 2) {
    scripts = [scripts[1], scripts[0]];
  }
  scriptsEl.innerHTML = scripts.map(script => `
    <div class="script-block">
      <strong>${script.role}:</strong>
      ${(script.lines || []).map(line => `<p>${line}</p>`).join('')}
    </div>
  `).join('');
}

function updateTeacherTip() {
  const tipCard = document.getElementById('teacher-tip-card');
  const isTeacher = document.getElementById('teacher-mode')?.checked;
  if (isTeacher && currentScenario) {
    tipCard.style.display = 'block';
    document.getElementById('teacher-tip-text').textContent = teacherTips[currentScenario.category] || '상황에 맞게 자유롭게 활용해 보세요.';
  } else {
    tipCard.style.display = 'none';
  }
}

function updateModeUI() {
  const isTeacher = document.getElementById('teacher-mode')?.checked;
  document.body.classList.toggle('teacher-mode', isTeacher);
  updateTeacherTip();
  const presetCard = document.getElementById('lesson-preset-card');
  if (presetCard) presetCard.style.display = isTeacher ? 'block' : 'none';
}

function renderLessonPresets() {
  const container = document.getElementById('lesson-presets');
  if (!container) return;
  container.innerHTML = Object.entries(lessonPresets).map(([min, desc]) =>
    `<button class="lesson-btn" data-min="${min}">${min}분 수업</button>`
  ).join('') + `<p id="lesson-desc" class="lesson-desc"></p><p id="lesson-timer" class="lesson-timer"></p>`;
  container.querySelectorAll('.lesson-btn').forEach(btn => {
    btn.onclick = () => startLesson(parseInt(btn.dataset.min));
  });
}

function startLesson(minutes) {
  if (lessonTimer) clearInterval(lessonTimer);
  lessonRemaining = minutes * 60;
  document.getElementById('lesson-desc').textContent = lessonPresets[minutes];
  updateTimerDisplay();
  lessonTimer = setInterval(() => {
    lessonRemaining--;
    updateTimerDisplay();
    if (lessonRemaining <= 0) {
      clearInterval(lessonTimer);
      document.getElementById('lesson-timer').textContent = '수업 시간 종료!';
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(lessonRemaining / 60);
  const s = lessonRemaining % 60;
  document.getElementById('lesson-timer').textContent = `남은 시간: ${m}:${s.toString().padStart(2, '0')}`;
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayLimit = 12;
      searchQuery = '';
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      renderScenarioList(btn.dataset.category);
    });
  });
}

document.getElementById('back-btn')?.addEventListener('click', () => {
  saveCurrentStepInput();
  document.getElementById('practice').classList.add('hidden');
  document.getElementById('intro').classList.remove('hidden');
  currentScenario = null;
  roleSwapped = false;
  refreshCurrentList();
});

document.getElementById('fav-btn')?.addEventListener('click', () => {
  if (currentScenario) toggleFavorite(currentScenario.id);
});

document.getElementById('swap-role-btn')?.addEventListener('click', () => {
  if (!currentScenario) return;
  roleSwapped = !roleSwapped;
  renderScripts();
  document.getElementById('swap-role-btn').textContent = roleSwapped ? '🔄 원래 역할로' : '🔄 역할 바꾸기';
});

document.getElementById('save-reflection')?.addEventListener('click', () => {
  if (!currentScenario) return;
  if (memoryMode) {
    alert('메모리 모드에서는 성찰이 저장되지 않습니다. 저장하려면 메모리 모드를 끄세요.');
    return;
  }
  const text = document.getElementById('reflection').value.trim();
  if (text) {
    localStorage.setItem(`reflection_${currentScenario.id}`, text);
    document.getElementById('save-message').classList.remove('hidden');
    document.getElementById('encourage').textContent = encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
    document.getElementById('encourage').classList.remove('hidden');
    renderDashboard();
    setTimeout(() => document.getElementById('save-message').classList.add('hidden'), 2500);
  }
});

document.getElementById('copy-reflection')?.addEventListener('click', async () => {
  const text = document.getElementById('reflection').value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    alert('성찰 내용이 복사되었습니다.');
  } catch {
    alert('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
  }
});

document.getElementById('print-reflection')?.addEventListener('click', () => window.print());

document.getElementById('random-btn')?.addEventListener('click', () => {
  if (scenarios.length === 0) return;
  const random = scenarios[Math.floor(Math.random() * scenarios.length)];
  showScenario(random.id);
});

document.getElementById('favorites-btn')?.addEventListener('click', () => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  displayLimit = 12;
  renderFavorites();
});

document.getElementById('reflections-btn')?.addEventListener('click', () => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  displayLimit = 12;
  renderReflections();
});

document.getElementById('teacher-tips-btn')?.addEventListener('click', () => {
  document.getElementById('teacher-modal').classList.remove('hidden');
});

document.getElementById('close-modal')?.addEventListener('click', () => {
  document.getElementById('teacher-modal').classList.add('hidden');
});

document.getElementById('teacher-mode')?.addEventListener('change', updateModeUI);

document.getElementById('memory-mode')?.addEventListener('change', (e) => {
  memoryMode = e.target.checked;
  renderDashboard();
  if (showingReflections) renderReflections();
});

document.getElementById('search-input')?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  displayLimit = 12;
  refreshCurrentList();
});

document.getElementById('font-size-btn')?.addEventListener('click', () => {
  const body = document.body;
  if (body.classList.contains('xlarge-font')) body.classList.remove('xlarge-font');
  else if (body.classList.contains('large-font')) {
    body.classList.remove('large-font');
    body.classList.add('xlarge-font');
  } else body.classList.add('large-font');
});

loadScenarios();
setupFilters();
