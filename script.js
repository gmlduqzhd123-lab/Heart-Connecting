let scenarios = [];
let currentScenario = null;
let currentFilter = 'all';
let showingFavorites = false;

const encourageMessages = [
  "잘했어! 친구 마음을 생각해보는 게 정말 어려웠을 텐데 용감했어.",
  "멋진 성찰이야. 이렇게 마음을 돌아보는 습관이 중요해.",
  "오늘도 한 걸음 더 나아갔어. 정말 잘하고 있어!",
  "서로의 마음을 이해하려고 노력하는 모습이 보기 좋아.",
  "연습한 만큼 진짜 상황에서도 더 잘 말할 수 있을 거야."
];

const teacherTips = {
  "친구 관계": "쉬는 시간이나 점심시간에 간단히 함께 연습해 보세요.",
  "모둠 활동": "모둠 활동 시작 전에 2분 정도 관련 상황을 다뤄보면 갈등을 예방할 수 있습니다.",
  "수업 중": "수업 중 생긴 갈등을 바로 다루기보다 쉬는 시간에 성찰로 연결해 보세요.",
  "놀이터": "체육 시간이나 쉬는 시간 후 간단한 대화 자료로 활용하기 좋습니다.",
  "급식시간": "급식 후 짧은 성찰 활동으로 연결하면 효과가 있습니다.",
  "쉬는 시간": "갈등 상황 직후 바로 연습하기 좋은 주제입니다."
};

async function loadScenarios() {
  try {
    const res = await fetch('scenarios.json');
    const data = await res.json();
    scenarios = data.scenarios;
    renderDashboard();
    renderTodayRecommend();
    renderScenarioList('all');
  } catch (e) {
    document.getElementById('scenario-list').innerHTML = '<p>시나리오를 불러오지 못했습니다.</p>';
  }
}

function getPracticedIds() {
  return JSON.parse(localStorage.getItem('practiced') || '[]');
}

function markPracticed(id) {
  const practiced = getPracticedIds();
  if (!practiced.includes(id)) {
    practiced.push(id);
    localStorage.setItem('practiced', JSON.stringify(practiced));
  }
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('favorites', JSON.stringify(favs));
  updateFavButton();
}

function updateFavButton() {
  const btn = document.getElementById('fav-btn');
  if (!currentScenario) return;
  const isFav = getFavorites().includes(currentScenario.id);
  btn.textContent = isFav ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
  btn.classList.toggle('active', isFav);
}

function renderDashboard() {
  const practiced = getPracticedIds();
  document.getElementById('stats').textContent = `지금까지 ${practiced.length}개의 상황을 연습했어요.`;
}

function renderTodayRecommend() {
  if (scenarios.length === 0) return;
  const day = new Date().getDate();
  const scenario = scenarios[day % scenarios.length];
  document.getElementById('today-card').innerHTML = `
    <div class="scenario-card" data-id="${scenario.id}" style="margin:0;">
      <span class="category">${scenario.category}</span>
      <h3>${scenario.title}</h3>
      <p>${scenario.situation}</p>
    </div>
  `;
  document.querySelector('#today-card .scenario-card').addEventListener('click', () => showScenario(scenario.id));
}

function renderScenarioList(category) {
  currentFilter = category;
  showingFavorites = false;
  const container = document.getElementById('scenario-list');
  let filtered = category === 'all' ? scenarios : scenarios.filter(s => s.category === category);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">해당 카테고리의 시나리오가 없습니다. 😊</p>';
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="scenario-card" data-id="${s.id}">
      <span class="category">${s.category}</span>
      <h3>${s.title}</h3>
      <p>${s.situation}</p>
    </div>
  `).join('');

  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => showScenario(card.dataset.id));
  });

  updateProgress(category);
}

function renderFavorites() {
  showingFavorites = true;
  const favs = getFavorites();
  const filtered = scenarios.filter(s => favs.includes(s.id));
  const container = document.getElementById('scenario-list');

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">아직 저장한 상황이 없어요. ☆를 눌러 저장해 보세요!</p>';
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="scenario-card" data-id="${s.id}">
      <span class="category">${s.category}</span>
      <h3>${s.title}</h3>
      <p>${s.situation}</p>
    </div>
  `).join('');

  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => showScenario(card.dataset.id));
  });
}

function updateProgress(category) {
  const el = document.getElementById('progress-info');
  if (category === 'all') {
    el.textContent = '';
    return;
  }
  const total = scenarios.filter(s => s.category === category).length;
  const practiced = getPracticedIds().filter(id => {
    const s = scenarios.find(sc => sc.id === id);
    return s && s.category === category;
  }).length;
  el.textContent = `이 카테고리 연습: ${practiced} / ${total}`;
}

function showScenario(id) {
  currentScenario = scenarios.find(s => s.id === id);
  if (!currentScenario) return;

  markPracticed(id);
  renderDashboard();

  document.getElementById('intro').classList.add('hidden');
  const practice = document.getElementById('practice');
  practice.classList.remove('hidden');

  document.getElementById('scenario-title').textContent = currentScenario.title;
  document.getElementById('scenario-situation').textContent = currentScenario.situation;

  const scriptsEl = document.getElementById('scripts');
  scriptsEl.innerHTML = currentScenario.scripts.map(script => `
    <div class="script-block">
      <strong>${script.role}:</strong>
      ${script.lines.map(line => `<p>${line}</p>`).join('')}
    </div>
  `).join('');

  document.getElementById('empathy-list').innerHTML = 
    currentScenario.empathy_examples.map(ex => `<li>${ex}</li>`).join('');

  document.getElementById('questions-list').innerHTML = 
    currentScenario.questions.map(q => `<li>${q}</li>`).join('');

  const saved = localStorage.getItem(`reflection_${id}`);
  document.getElementById('reflection').value = saved || '';
  document.getElementById('save-message').classList.add('hidden');
  document.getElementById('encourage').classList.add('hidden');

  updateFavButton();

  const tipCard = document.getElementById('teacher-tip-card');
  if (document.getElementById('teacher-mode').checked) {
    tipCard.style.display = 'block';
    document.getElementById('teacher-tip-text').textContent = teacherTips[currentScenario.category] || '상황에 맞게 자유롭게 활용해 보세요.';
  } else {
    tipCard.style.display = 'none';
  }
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderScenarioList(btn.dataset.category);
    });
  });
}

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('practice').classList.add('hidden');
  document.getElementById('intro').classList.remove('hidden');
  currentScenario = null;
  if (showingFavorites) renderFavorites();
  else renderScenarioList(currentFilter);
});

document.getElementById('fav-btn').addEventListener('click', () => {
  if (currentScenario) toggleFavorite(currentScenario.id);
});

document.getElementById('save-reflection').addEventListener('click', () => {
  if (!currentScenario) return;
  const text = document.getElementById('reflection').value.trim();
  if (text) {
    localStorage.setItem(`reflection_${currentScenario.id}`, text);
    const msg = document.getElementById('save-message');
    msg.classList.remove('hidden');
    const enc = document.getElementById('encourage');
    enc.textContent = encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
    enc.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});

document.getElementById('copy-reflection').addEventListener('click', () => {
  const text = document.getElementById('reflection').value;
  if (text) {
    navigator.clipboard.writeText(text);
    alert('성찰 내용이 복사되었습니다.');
  }
});

document.getElementById('print-reflection').addEventListener('click', () => {
  window.print();
});

document.getElementById('random-btn').addEventListener('click', () => {
  if (scenarios.length === 0) return;
  const random = scenarios[Math.floor(Math.random() * scenarios.length)];
  showScenario(random.id);
});

document.getElementById('favorites-btn').addEventListener('click', () => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  renderFavorites();
});

document.getElementById('teacher-tips-btn').addEventListener('click', () => {
  document.getElementById('teacher-modal').classList.remove('hidden');
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('teacher-modal').classList.add('hidden');
});

document.getElementById('teacher-mode').addEventListener('change', () => {
  if (currentScenario) showScenario(currentScenario.id);
});

// Init
loadScenarios();
setupFilters();
