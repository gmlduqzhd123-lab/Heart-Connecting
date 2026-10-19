let scenarios = [];
let currentScenario = null;

async function loadScenarios() {
  try {
    const res = await fetch('scenarios.json');
    const data = await res.json();
    scenarios = data.scenarios;
    renderScenarioList('all');
  } catch (e) {
    document.getElementById('scenario-list').innerHTML = '<p>시나리오를 불러오지 못했습니다.</p>';
  }
}

function renderScenarioList(category) {
  const container = document.getElementById('scenario-list');
  const filtered = category === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.category === category);

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
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      showScenario(id);
    });
  });
}

function showScenario(id) {
  currentScenario = scenarios.find(s => s.id === id);
  if (!currentScenario) return;

  document.getElementById('intro').classList.add('hidden');
  const practice = document.getElementById('practice');
  practice.classList.remove('hidden');
  practice.style.animation = 'none';
  practice.offsetHeight; // reflow
  practice.style.animation = '';

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
});

document.getElementById('save-reflection').addEventListener('click', () => {
  if (!currentScenario) return;
  const text = document.getElementById('reflection').value.trim();
  if (text) {
    localStorage.setItem(`reflection_${currentScenario.id}`, text);
    const msg = document.getElementById('save-message');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});

// Init
loadScenarios();
setupFilters();
