// ================= СОСТОЯНИЕ =================
let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let worldCities = JSON.parse(localStorage.getItem('worldCities') || 'null') || [
  { city:'Москва', offset:3 },
  { city:'Калининград', offset:2 },
  { city:'Омск', offset:6 },
  { city:'Екатеринбург', offset:5 }
];

let editingAlarmId = null;
let selectedDays = [];
let selectedHour = 7, selectedMinute = 0;
let snoozeEnabled = true;
let snoozeDuration = 9;
let alarmLabel = 'Будильник';
let alarmSound = 'Отражение';

const DAYS_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

// ================= НАВИГАЦИЯ =================
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('screen-' + tab.dataset.screen).classList.add('active');
    if (navigator.vibrate) navigator.vibrate(5);
  });
});

// ================= МИРОВЫЕ ЧАСЫ =================
function renderWorldClocks() {
  const list = document.getElementById('worldList');
  list.innerHTML = worldCities.map((c, i) => {
    const diff = c.offset - 3;
    const diffLabel = diff === 0 ? '+0Ч' : (diff > 0 ? '+' + diff + 'Ч' : diff + 'Ч');
    return `
      <div class="world-item" data-index="${i}">
        <div class="world-left">
          <div class="world-offset" data-role="day">Сегодня, ${diffLabel}</div>
          <div class="world-city">${c.city}</div>
        </div>
        <div class="world-time-big" data-role="time">00:00</div>
      </div>
    `;
  }).join('');
}

function tickWorldClocks() {
  worldCities.forEach((c, i) => {
    const item = document.querySelector(`.world-item[data-index="${i}"]`);
    if (!item) return;
    const timeEl = item.querySelector('[data-role="time"]');
    const dayEl = item.querySelector('[data-role="day"]');
    if (timeEl) timeEl.textContent = getCityTime(c.offset);
    if (dayEl) {
      const diff = c.offset - 3;
      const diffLabel = diff === 0 ? '+0Ч' : (diff > 0 ? '+' + diff + 'Ч' : diff + 'Ч');
      dayEl.textContent = getDayLabel(c.offset) + ', ' + diffLabel;
    }
  });
}

function getCityTime(offset) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const city = new Date(utc + offset * 3600000);
  return String(city.getHours()).padStart(2,'0') + ':' + String(city.getMinutes()).padStart(2,'0');
}

function getDayLabel(offset) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const city = new Date(utc + offset * 3600000);
  const msk = new Date(utc + 3 * 3600000);
  const diff = city.getDate() - msk.getDate();
  if (diff === 0) return 'Сегодня';
  if (diff === 1 || diff === -30) return 'Завтра';
  if (diff === -1 || diff === 30) return 'Вчера';
  return 'Сегодня';
}

const CITY_DB = [
  { city:'Москва', offset:3 },{ city:'Калининград', offset:2 },
  { city:'Санкт-Петербург', offset:3 },{ city:'Самара', offset:4 },
  { city:'Екатеринбург', offset:5 },{ city:'Омск', offset:6 },
  { city:'Красноярск', offset:7 },{ city:'Иркутск', offset:8 },
  { city:'Якутск', offset:9 },{ city:'Владивосток', offset:10 },
  { city:'Магадан', offset:11 },{ city:'Камчатка', offset:12 },
  { city:'Лондон', offset:0 },{ city:'Париж', offset:1 },
  { city:'Берлин', offset:1 },{ city:'Нью-Йорк', offset:-5 },
  { city:'Лос-Анджелес', offset:-8 },{ city:'Токио', offset:9 },
  { city:'Пекин', offset:8 },{ city:'Дубай', offset:4 },
  { city:'Стамбул', offset:3 },{ city:'Каир', offset:2 },
  { city:'Сидней', offset:11 },{ city:'Рио-де-Жанейро', offset:-3 }
];

function renderCityList(filter = '') {
  const list = document.getElementById('cityList');
  const f = filter.toLowerCase();
  const filtered = CITY_DB.filter(c => c.city.toLowerCase().includes(f));
  list.innerHTML = filtered.map(c => `
    <div class="city-item" data-city="${c.city}" data-offset="${c.offset}">
      <span class="city-item-name">${c.city}</span>
      <span class="city-item-offset">UTC${c.offset >= 0 ? '+' : ''}${c.offset}</span>
    </div>
  `).join('');
}

document.getElementById('addCityBtn').addEventListener('click', () => {
  renderCityList();
  document.getElementById('citySearch').value = '';
  document.getElementById('cityModal').classList.add('open');
});

document.getElementById('cityCancel').addEventListener('click', () => {
  document.getElementById('cityModal').classList.remove('open');
});

document.getElementById('citySearch').addEventListener('input', (e) => {
  renderCityList(e.target.value);
});

document.getElementById('cityList').addEventListener('click', (e) => {
  const item = e.target.closest('.city-item');
  if (!item) return;
  worldCities.push({ city:item.dataset.city, offset:Number(item.dataset.offset) });
  localStorage.setItem('worldCities', JSON.stringify(worldCities));
  renderWorldClocks();
  tickWorldClocks();
  document.getElementById('cityModal').classList.remove('open');
  if (navigator.vibrate) navigator.vibrate(10);
});

document.getElementById('editWorldBtn').addEventListener('click', () => {
  if (worldCities.length > 1) {
    if (confirm('Удалить последний город из списка?')) {
      worldCities.pop();
      localStorage.setItem('worldCities', JSON.stringify(worldCities));
      renderWorldClocks();
      tickWorldClocks();
    }
  } else {
    alert('Нельзя удалить все города');
  }
});

setInterval(tickWorldClocks, 1000);
renderWorldClocks();
tickWorldClocks();

// ================= БУДИЛЬНИКИ =================
function saveAlarms() { localStorage.setItem('alarms', JSON.stringify(alarms)); }

function formatDays(days) {
  if (!days || days.length === 0) return 'Никогда';
  if (days.length === 7) return 'Каждый день';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'По будням';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'По выходным';
  return days.slice().sort((a,b) => {
    const order = [1,2,3,4,5,6,0];
    return order.indexOf(a) - order.indexOf(b);
  }).map(d => DAYS_SHORT[d]).join(', ');
}

function renderAlarms() {
  const list = document.getElementById('alarmList');
  const empty = document.getElementById('emptyState');

  if (alarms.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = alarms.map(a => `
    <div class="alarm-swipe-wrap" data-id="${a.id}">
      <div class="alarm-delete-bg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/>
        </svg>
      </div>
      <div class="alarm-card ${a.enabled ? '' : 'disabled'}" data-id="${a.id}">
        <div class="alarm-info" onclick="handleAlarmEdit(event, '${a.id}')">
          <div class="alarm-time">${a.time}</div>
          <div class="alarm-label">${a.label || 'Будильник'}${a.days && a.days.length ? ' · ' + formatDays(a.days) : ''}</div>
        </div>
        <div class="switch ${a.enabled ? 'on' : ''}" onclick="handleAlarmToggle(event, '${a.id}')"></div>
      </div>
    </div>
  `).join('');

  attachSwipeHandlers();
}

function handleAlarmToggle(e, id) {
  e.stopPropagation();
  e.preventDefault();
  const a = alarms.find(x => x.id === id);
  if (!a) return;
  a.enabled = !a.enabled;
  saveAlarms();
  renderAlarms();
  if (navigator.vibrate) navigator.vibrate(10);
}

function handleAlarmEdit(e, id) {
  const card = e.currentTarget.closest('.alarm-card');
  if (card && card.style.transform && card.style.transform.includes('-')) {
    card.style.transform = 'translateX(0)';
    return;
  }
  editAlarm(id);
}

function editAlarm(id) {
  const a = alarms.find(x => x.id === id);
  if (!a) return;
  editingAlarmId = id;
  const [h, m] = a.time.split(':').map(Number);
  selectedHour = h;
  selectedMinute = m;
  selectedDays = [...(a.days || [])];
  alarmLabel = a.label || 'Будильник';
  alarmSound = a.sound || 'Отражение';
  snoozeEnabled = a.snooze !== false;
  snoozeDuration = a.snoozeDuration || 9;

  document.getElementById('modalTitle').textContent = 'Изменить';
  updateAlarmModalUI();
  document.getElementById('alarmModal').classList.add('open');
  setTimeout(() => {
    setWheelValue('hours', selectedHour);
    setWheelValue('minutes', selectedMinute);
  }, 50);
}

function updateAlarmModalUI() {
  document.getElementById('repeatValue').textContent = formatDays(selectedDays) + ' ›';
  document.getElementById('labelValue').textContent = alarmLabel;
  document.getElementById('soundValue').textContent = alarmSound + ' ›';
  document.getElementById('snoozeDuration').textContent = snoozeDuration + ' мин';
  const sw = document.getElementById('snoozeSwitch');
  sw.classList.toggle('on', snoozeEnabled);
  document.querySelectorAll('#repeatModal .day').forEach(btn => {
    btn.classList.toggle('active', selectedDays.includes(Number(btn.dataset.day)));
  });
}

document.getElementById('addAlarmBtn').addEventListener('click', () => {
  editingAlarmId = null;
  selectedDays = [];
  selectedHour = 7;
  selectedMinute = 0;
  alarmLabel = 'Будильник';
  alarmSound = 'Отражение';
  snoozeEnabled = true;
  snoozeDuration = 9;
  document.getElementById('modalTitle').textContent = 'Новый будильник';
  updateAlarmModalUI();
  document.getElementById('alarmModal').classList.add('open');
  setTimeout(() => {
    setWheelValue('hours', selectedHour);
    setWheelValue('minutes', selectedMinute);
  }, 50);
});

document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('alarmModal').classList.remove('open');
});

document.getElementById('modalSave').addEventListener('click', () => {
  const time = String(selectedHour).padStart(2,'0') + ':' + String(selectedMinute).padStart(2,'0');
  if (editingAlarmId) {
    const a = alarms.find(x => x.id === editingAlarmId);
    a.time = time;
    a.label = alarmLabel;
    a.sound = alarmSound;
    a.days = [...selectedDays];
    a.snooze = snoozeEnabled;
    a.snoozeDuration = snoozeDuration;
  } else {
    alarms.push({
      id: Date.now().toString(),
      time, label: alarmLabel, sound: alarmSound,
      days: [...selectedDays], enabled: true,
      snooze: snoozeEnabled, snoozeDuration
    });
  }
  saveAlarms();
  renderAlarms();
  document.getElementById('alarmModal').classList.remove('open');
  if (navigator.vibrate) navigator.vibrate(20);
});

// Повтор
document.getElementById('repeatRow').addEventListener('click', () => {
  document.getElementById('repeatModal').classList.add('open');
});
document.getElementById('repeatCancel').addEventListener('click', () => {
  document.getElementById('repeatModal').classList.remove('open');
});
document.getElementById('repeatSave').addEventListener('click', () => {
  updateAlarmModalUI();
  document.getElementById('repeatModal').classList.remove('open');
});
document.querySelectorAll('#repeatModal .day').forEach(btn => {
  btn.addEventListener('click', () => {
    const day = Number(btn.dataset.day);
    if (selectedDays.includes(day)) selectedDays = selectedDays.filter(d => d !== day);
    else selectedDays.push(day);
    btn.classList.toggle('active');
    if (navigator.vibrate) navigator.vibrate(5);
  });
});

// Название
document.getElementById('labelRow').addEventListener('click', () => {
  const v = prompt('Название будильника:', alarmLabel);
  if (v !== null && v.trim()) {
    alarmLabel = v.trim().slice(0, 30);
    updateAlarmModalUI();
  }
});

// Звук
document.getElementById('soundRow').addEventListener('click', () => {
  const sounds = ['Отражение', 'Радар', 'Мелодия', 'Сигнал', 'Без звука'];
  const v = prompt('Звук (' + sounds.join(', ') + '):', alarmSound);
  if (v && sounds.includes(v)) { alarmSound = v; updateAlarmModalUI(); }
});

// Отложить switch
document.getElementById('snoozeSwitch').addEventListener('click', () => {
  snoozeEnabled = !snoozeEnabled;
  document.getElementById('snoozeSwitch').classList.toggle('on', snoozeEnabled);
});

// Длительность откладывания
document.getElementById('snoozeDuration').addEventListener('click', () => {
  const v = prompt('Длительность откладывания (мин):', snoozeDuration);
  const n = parseInt(v);
  if (!isNaN(n) && n > 0 && n < 60) {
    snoozeDuration = n;
    updateAlarmModalUI();
  }
});

// ================= СВАЙП ДЛЯ УДАЛЕНИЯ =================
function attachSwipeHandlers() {
  document.querySelectorAll('.alarm-card').forEach(card => {
    let startX = 0, startY = 0, currentX = 0, isOpen = false, isDragging = false;
    const OPEN_X = -88;

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = isOpen ? OPEN_X : 0;
      card.classList.add('no-transition');
      isDragging = false;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!isDragging) {
        if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 8) return;
        isDragging = true;
      }
      let x = currentX + dx;
      if (x > 0) x = 0;
      if (x < OPEN_X - 40) x = OPEN_X - 40;
      card.style.transform = `translateX(${x}px)`;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      card.classList.remove('no-transition');
      if (!isDragging) return;
      const dx = e.changedTouches[0].clientX - startX;
      const x = currentX + dx;
      if (x < OPEN_X / 2) {
        card.style.transform = `translateX(${OPEN_X}px)`;
        isOpen = true;
      } else {
        card.style.transform = 'translateX(0)';
        isOpen = false;
      }
    });
  });

  document.querySelectorAll('.alarm-delete-bg').forEach(bg => {
    bg.addEventListener('click', () => {
      const wrap = bg.closest('.alarm-swipe-wrap');
      const id = wrap.dataset.id;
      wrap.classList.add('removing');
      if (navigator.vibrate) navigator.vibrate(15);
      setTimeout(() => {
        alarms = alarms.filter(a => a.id !== id);
        saveAlarms();
        renderAlarms();
      }, 350);
    });
  });

  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.alarm-swipe-wrap')) {
      document.querySelectorAll('.alarm-card').forEach(c => {
        c.style.transform = 'translateX(0)';
      });
    }
  }, { passive: true });
}

// ================= КОЛЕСО ВЫБОРА ВРЕМЕНИ =================
function buildWheel(colEl, type, max) {
  const items = [];
  for (let i = 0; i < max; i++) {
    const label = String(i).padStart(2, '0');
    items.push(`<div class="wheel-item" data-value="${i}">${label}</div>`);
  }
  colEl.innerHTML = items.join('');

  colEl.addEventListener('scroll', () => {
    const idx = Math.round(colEl.scrollTop / 44);
    const items = colEl.querySelectorAll('.wheel-item');
    items.forEach((it, i) => {
      it.classList.toggle('selected', i === idx);
    });
    if (type === 'hours') selectedHour = idx;
    if (type === 'minutes') selectedMinute = idx;
    if (navigator.vibrate) navigator.vibrate(3);
  });

  colEl.addEventListener('scrollend', () => {
    const idx = Math.round(colEl.scrollTop / 44);
    colEl.scrollTo({ top: idx * 44, behavior:'smooth' });
  });
}

function setWheelValue(type, value) {
  const col = document.querySelector(`.time-wheel .wheel-col[data-type="${type}"]`);
  if (!col) return;
  col.scrollTop = value * 44;
  col.querySelectorAll('.wheel-item').forEach((it, i) => {
    it.classList.toggle('selected', i === value);
  });
}

document.querySelectorAll('#alarmWheel .wheel-col').forEach(col => {
  const type = col.dataset.type;
  buildWheel(col, type, type === 'hours' ? 24 : 60);
});
setWheelValue('hours', 7);
setWheelValue('minutes', 0);

// ================= КНОПКА "НАСТРОИТЬ" СОН =================
document.getElementById('setupBtn').addEventListener('click', () => {
  document.getElementById('sleepModal').classList.add('open');
});
document.getElementById('sleepClose').addEventListener('click', () => {
  document.getElementById('sleepModal').classList.remove('open');
});
document.getElementById('sleepActionBtn').addEventListener('click', () => {
  document.getElementById('sleepModal').classList.remove('open');
  if (navigator.vibrate) navigator.vibrate(10);
  setTimeout(() => alert('Откроется приложение «Здоровье»'), 300);
});

// ================= СЕКУНДОМЕР =================
let swRunning = false, swStartTime = 0, swElapsed = 0, swInterval = null, swLapCount = 0;
let swCurrentPage = 0;

function formatSW(ms) {
  const total = Math.floor(ms / 10);
  const cs = String(total % 100).padStart(2,'0');
  const s = String(Math.floor(total / 100) % 60).padStart(2,'0');
  const m = String(Math.floor(total / 6000)).padStart(2,'0');
  return `${m}:${s},${cs}`;
}

(function buildSwTicks() {
  const g = document.getElementById('swTicks');
  if (!g) return;
  let html = '';
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6) * Math.PI / 180;
    const inner = i % 5 === 0 ? 122 : 130;
    const outer = 138;
    const x1 = 150 + Math.sin(angle) * inner;
    const y1 = 150 - Math.cos(angle) * inner;
    const x2 = 150 + Math.sin(angle) * outer;
    const y2 = 150 - Math.cos(angle) * outer;
    const w = i % 5 === 0 ? 2 : 1;
    const color = i % 5 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
    html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  for (let n = 0; n < 12; n++) {
    const angle = (n * 30) * Math.PI / 180;
    const r = 105;
    const x = 150 + Math.sin(angle) * r;
    const y = 150 - Math.cos(angle) * r;
    const label = n === 0 ? 60 : n * 5;
    html += `<text x="${x}" y="${y + 6}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="18" font-family="-apple-system,sans-serif">${label}</text>`;
  }
  g.innerHTML = html;
})();

function updateSwUI(ms) {
  const text = formatSW(ms);
  document.getElementById('stopwatchDisplay').textContent = text;
  const analogText = document.getElementById('swAnalogText');
  if (analogText) analogText.textContent = text;
  const secs = (ms / 1000) % 60;
  const deg = secs * 6;
  const hand = document.getElementById('swHand');
  if (hand) hand.setAttribute('transform', `rotate(${deg} 150 150)`);
}

document.querySelectorAll('#swDots .dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const page = Number(dot.dataset.page);
    swCurrentPage = page;
    document.querySelectorAll('#swDots .dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    document.querySelectorAll('.sw-page').forEach((p, i) => {
      p.classList.toggle('active', i === page);
    });
    if (navigator.vibrate) navigator.vibrate(5);
  });
});

document.getElementById('swStart').addEventListener('click', () => {
  if (swRunning) {
    clearInterval(swInterval);
    swElapsed += Date.now() - swStartTime;
    swRunning = false;
    document.getElementById('swStart').textContent = 'Старт';
  } else {
    swStartTime = Date.now();
    swInterval = setInterval(() => {
      updateSwUI(swElapsed + (Date.now() - swStartTime));
    }, 16);
    swRunning = true;
    document.getElementById('swStart').textContent = 'Пауза';
  }
  if (navigator.vibrate) navigator.vibrate(10);
});

document.getElementById('swLap').addEventListener('click', () => {
  if (!swRunning) return;
  swLapCount++;
  const lap = document.createElement('div');
  lap.className = 'lap-item';
  lap.innerHTML = `<span>Круг ${swLapCount}</span><span>${formatSW(swElapsed + (Date.now() - swStartTime))}</span>`;
  document.getElementById('laps').prepend(lap);
  if (navigator.vibrate) navigator.vibrate(8);
});

updateSwUI(0);

// ================= ТАЙМЕР =================
function buildTimerWheel() {
  const cols = {
    hours: { max:24, unit:'час' },
    minutes: { max:60, unit:'мин' },
    seconds: { max:60, unit:'сек' }
  };
  document.querySelectorAll('#timerWheel .wheel-col').forEach(col => {
    const type = col.dataset.type;
    const cfg = cols[type];
    let html = '';
    for (let i = 0; i < cfg.max; i++) {
      html += `<div class="wheel-item" data-value="${i}">${i}<span class="unit">${cfg.unit}</span></div>`;
    }
    col.innerHTML = html;
  });
}
buildTimerWheel();

// ================= СРАБАТЫВАНИЕ =================
document.getElementById('stopBtn').addEventListener('click', () => {
  document.getElementById('alarmRinging').classList.remove('active');
  if (navigator.vibrate) navigator.vibrate(10);
});

document.getElementById('snoozeBtn').addEventListener('click', () => {
  document.getElementById('alarmRinging').classList.remove('active');
  setTimeout(() => {
    document.getElementById('alarmRinging').classList.add('active');
    if (navigator.vibrate) navigator.vibrate([500,200,500]);
  }, 5000);
});

// ================= SERVICE WORKER =================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
renderAlarms();