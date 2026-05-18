(() => {
  'use strict';

  const STORAGE_KEY = 'zaladunkiMaripoDataV1';
  const statusLabels = {
    planned: 'Planowany',
    loading: 'Na zaladunku',
    road: 'W trasie',
    done: 'Dostarczony',
  };

  const monthNames = [
    'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
  ];

  const dayNames = ['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Nd'];

  const els = {
    vehicleForm: document.getElementById('vehicleForm'),
    vehicleName: document.getElementById('vehicleName'),
    vehiclePlate: document.getElementById('vehiclePlate'),
    vehicleType: document.getElementById('vehicleType'),
    loadForm: document.getElementById('loadForm'),
    loadVehicle: document.getElementById('loadVehicle'),
    loadStartDate: document.getElementById('loadStartDate'),
    loadStartTime: document.getElementById('loadStartTime'),
    loadEndDate: document.getElementById('loadEndDate'),
    loadEndTime: document.getElementById('loadEndTime'),
    loadName: document.getElementById('loadName'),
    loadFrom: document.getElementById('loadFrom'),
    loadTo: document.getElementById('loadTo'),
    loadWeight: document.getElementById('loadWeight'),
    loadStatus: document.getElementById('loadStatus'),
    loadNotes: document.getElementById('loadNotes'),
    vehiclesList: document.getElementById('vehiclesList'),
    loadsList: document.getElementById('loadsList'),
    calendar: document.getElementById('calendar'),
    calendarTitle: document.getElementById('calendarTitle'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    todayBtn: document.getElementById('todayBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    carsCount: document.getElementById('carsCount'),
    loadsCount: document.getElementById('loadsCount'),
    todayCount: document.getElementById('todayCount'),
    emptyStateTemplate: document.getElementById('emptyStateTemplate'),
  };

  const today = new Date();
  let calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let state = readState();

  function seedState() {
    const todayIso = toDateInputValue(today);
    return {
      vehicles: [
        { id: createId(), name: 'Mercedes Actros - Karol', plate: 'PZ 4827M', type: 'Ciagnik siodlowy', createdAt: new Date().toISOString() },
        { id: createId(), name: 'MAN TGX - Michal', plate: 'PO 7M42A', type: 'Ciagnik siodlowy', createdAt: new Date().toISOString() },
        { id: createId(), name: 'Iveco Daily - lokalny', plate: 'PZ 9182L', type: 'Bus', createdAt: new Date().toISOString() },
      ],
      loads: [],
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && Array.isArray(stored.vehicles) && Array.isArray(stored.loads)) {
        stored.loads = stored.loads.map(normalizeLoadPeriod);
        return stored;
      }
    } catch {
      // Corrupted local storage should not block the dispatcher.
    }
    const seeded = seedState();
    if (seeded.vehicles.length) {
      seeded.loads.push({
        id: createId(),
        vehicleId: seeded.vehicles[0].id,
        startDate: toDateInputValue(today),
        endDate: toDateInputValue(today),
        startTime: '08:00',
        endTime: '10:00',
        name: 'Palety euro',
        from: 'Poznan',
        to: 'Wroclaw',
        weight: '8 t',
        status: 'planned',
        notes: 'Przykladowy ladunek startowy. Mozesz go usunac.',
        createdAt: new Date().toISOString(),
      });
    }
    return seeded;
  }

  function writeState() {
    state.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizePlate(value) {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseLocalDate(dateString, timeString = '00:00') {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0, 0);
  }

  function addMinutes(timeString, minutesToAdd) {
    const [hour, minute] = (timeString || '00:00').split(':').map(Number);
    const date = new Date(2000, 0, 1, hour || 0, minute || 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function addMinutesToDateTime(dateString, timeString, minutesToAdd) {
    const date = parseLocalDate(dateString, timeString);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return {
      date: toDateInputValue(date),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    };
  }

  function normalizeLoadPeriod(load) {
    const startDate = load.startDate || load.date || toDateInputValue(today);
    const startTime = load.startTime || load.time || '08:00';
    let endDate = load.endDate || load.date || startDate;
    let endTime = load.endTime || addMinutes(startTime, 60);

    if (`${endDate}T${endTime}` <= `${startDate}T${startTime}`) {
      const fallbackEnd = addMinutesToDateTime(startDate, startTime, 60);
      endDate = fallbackEnd.date;
      endTime = fallbackEnd.time;
    }

    const { date, time, ...rest } = load;
    return { ...rest, startDate, endDate, startTime, endTime };
  }

  function loadStartDate(load) {
    return load.startDate || load.date || toDateInputValue(today);
  }

  function loadEndDate(load) {
    return load.endDate || load.date || loadStartDate(load);
  }

  function loadStartTime(load) {
    return load.startTime || load.time || '00:00';
  }

  function loadEndTime(load) {
    return load.endTime || addMinutes(loadStartTime(load), 60);
  }

  function timeRange(load) {
    return `${loadStartTime(load)}-${loadEndTime(load)}`;
  }

  function loadStartStamp(load) {
    return `${loadStartDate(load)}T${loadStartTime(load)}`;
  }

  function loadEndStamp(load) {
    return `${loadEndDate(load)}T${loadEndTime(load)}`;
  }

  function dateInLoadPeriod(load, dateString) {
    return dateString >= loadStartDate(load) && dateString <= loadEndDate(load);
  }

  function periodLabel(load) {
    if (loadStartDate(load) === loadEndDate(load)) {
      return `${formatDate(loadStartDate(load))} · ${timeRange(load)}`;
    }
    return `${formatDate(loadStartDate(load))} ${loadStartTime(load)} -> ${formatDate(loadEndDate(load))} ${loadEndTime(load)}`;
  }

  function calendarPeriodLabel(load, dateString) {
    if (loadStartDate(load) === loadEndDate(load)) return timeRange(load);
    if (dateString === loadStartDate(load)) return `${loadStartTime(load)} start`;
    if (dateString === loadEndDate(load)) return `${loadEndTime(load)} koniec`;
    return 'w trasie';
  }

  function formatDate(dateString) {
    const date = parseLocalDate(dateString);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  }

  function vehicleById(id) {
    return state.vehicles.find(vehicle => vehicle.id === id);
  }

  function loadsForVehicle(id) {
    return state.loads.filter(load => load.vehicleId === id);
  }

  function sortedLoads(loads = state.loads) {
    return [...loads].sort((a, b) => {
      const byStart = loadStartStamp(a).localeCompare(loadStartStamp(b));
      if (byStart) return byStart;
      return loadEndStamp(a).localeCompare(loadEndStamp(b));
    });
  }

  function emptyState(text = 'Dodaj pierwszy wpis w formularzu po lewej stronie.') {
    const node = els.emptyStateTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('span').textContent = text;
    return node;
  }

  function renderVehicleOptions() {
    els.loadVehicle.innerHTML = '';
    if (!state.vehicles.length) {
      const option = document.createElement('option');
      option.textContent = 'Najpierw dodaj samochod';
      option.value = '';
      els.loadVehicle.append(option);
      els.loadVehicle.disabled = true;
      els.loadForm.querySelector('button[type="submit"]').disabled = true;
      return;
    }

    els.loadVehicle.disabled = false;
    els.loadForm.querySelector('button[type="submit"]').disabled = false;
    for (const vehicle of state.vehicles) {
      const option = document.createElement('option');
      option.value = vehicle.id;
      option.textContent = `${vehicle.plate} - ${vehicle.name}`;
      els.loadVehicle.append(option);
    }
  }

  function renderVehicles() {
    els.vehiclesList.innerHTML = '';
    if (!state.vehicles.length) {
      els.vehiclesList.append(emptyState('Brak samochodow. Dodaj pojazd z numerem rejestracyjnym.'));
      return;
    }

    for (const vehicle of state.vehicles) {
      const count = loadsForVehicle(vehicle.id).length;
      const card = document.createElement('article');
      card.className = 'vehicle-card';
      card.innerHTML = `
        <div class="vehicle-card__top">
          <div>
            <strong>${escapeHtml(vehicle.name)}</strong>
            <div class="meta">${escapeHtml(vehicle.type)} · ${count} ladunkow</div>
          </div>
          <span class="plate">${escapeHtml(vehicle.plate)}</span>
        </div>
        <div class="card-actions">
          <button type="button" data-action="selectVehicle" data-id="${vehicle.id}">Dodaj ladunek</button>
          <button type="button" class="danger" data-action="deleteVehicle" data-id="${vehicle.id}">Usun</button>
        </div>
      `;
      els.vehiclesList.append(card);
    }
  }

  function renderLoads() {
    els.loadsList.innerHTML = '';
    const loads = sortedLoads();
    if (!loads.length) {
      els.loadsList.append(emptyState('Brak ladunkow. Zapisz pierwszy ladunek do kalendarza.'));
      return;
    }

    for (const load of loads) {
      const vehicle = vehicleById(load.vehicleId);
      const card = document.createElement('article');
      card.className = 'load-card';
      card.innerHTML = `
        <div class="load-card__top">
          <div>
            <strong>${escapeHtml(load.name)}</strong>
            <div class="meta">${escapeHtml(periodLabel(load))} · ${escapeHtml(load.from)} -> ${escapeHtml(load.to)}</div>
          </div>
          <span class="status ${load.status}">${statusLabels[load.status]}</span>
        </div>
        <div class="meta">
          ${vehicle ? `<span class="plate">${escapeHtml(vehicle.plate)}</span> ${escapeHtml(vehicle.name)}` : 'Samochod usuniety'}
        </div>
        <div class="meta">Waga: ${escapeHtml(load.weight || 'brak danych')}</div>
        ${load.notes ? `<div class="meta">${escapeHtml(load.notes)}</div>` : ''}
        <div class="card-actions">
          <button type="button" data-action="cycleStatus" data-id="${load.id}">Zmien status</button>
          <button type="button" data-action="downloadIcs" data-id="${load.id}">Do kalendarza .ics</button>
          <button type="button" class="danger" data-action="deleteLoad" data-id="${load.id}">Usun</button>
        </div>
      `;
      els.loadsList.append(card);
    }
  }

  function renderCalendar() {
    els.calendar.innerHTML = '';
    els.calendarTitle.textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;

    for (const day of dayNames) {
      const head = document.createElement('div');
      head.className = 'calendar__head';
      head.textContent = day;
      els.calendar.append(head);
    }

    const first = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayOffset);

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = toDateInputValue(date);
      const dayLoads = sortedLoads(state.loads.filter(load => dateInLoadPeriod(load, iso)));

      const day = document.createElement('div');
      day.className = 'calendar__day';
      if (date.getMonth() !== calendarDate.getMonth()) day.classList.add('is-muted');
      if (iso === toDateInputValue(today)) day.classList.add('is-today');

      const number = document.createElement('div');
      number.className = 'calendar__number';
      number.innerHTML = `<span>${date.getDate()}</span><span>${dayLoads.length ? dayLoads.length : ''}</span>`;
      day.append(number);

      const items = document.createElement('div');
      items.className = 'calendar__items';
      for (const load of dayLoads.slice(0, 4)) {
        const vehicle = vehicleById(load.vehicleId);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'calendar__item';
        item.dataset.action = 'focusLoad';
        item.dataset.id = load.id;
        item.innerHTML = `
          <strong>${escapeHtml(calendarPeriodLabel(load, iso))} ${escapeHtml(vehicle ? vehicle.plate : 'BRAK')}</strong>
          <span>${escapeHtml(load.name)}</span>
          <span>${escapeHtml(load.from)} -> ${escapeHtml(load.to)}</span>
        `;
        items.append(item);
      }
      if (dayLoads.length > 4) {
        const more = document.createElement('span');
        more.className = 'meta';
        more.textContent = `+${dayLoads.length - 4} wiecej`;
        items.append(more);
      }
      day.append(items);
      els.calendar.append(day);
    }
  }

  function renderStats() {
    const todayIso = toDateInputValue(today);
    els.carsCount.textContent = String(state.vehicles.length);
    els.loadsCount.textContent = String(state.loads.length);
    els.todayCount.textContent = String(state.loads.filter(load => dateInLoadPeriod(load, todayIso)).length);
  }

  function render() {
    renderStats();
    renderVehicleOptions();
    renderVehicles();
    renderLoads();
    renderCalendar();
  }

  function addVehicle(event) {
    event.preventDefault();
    const plate = normalizePlate(els.vehiclePlate.value);
    if (state.vehicles.some(vehicle => vehicle.plate === plate)) {
      alert('Samochod z takim numerem rejestracyjnym juz istnieje.');
      return;
    }

    state.vehicles.push({
      id: createId(),
      name: els.vehicleName.value.trim(),
      plate,
      type: els.vehicleType.value,
      createdAt: new Date().toISOString(),
    });
    writeState();
    els.vehicleForm.reset();
    render();
  }

  function addLoad(event) {
    event.preventDefault();
    const vehicleId = els.loadVehicle.value;
    if (!vehicleById(vehicleId)) {
      alert('Wybierz poprawny samochod.');
      return;
    }
    const startStamp = `${els.loadStartDate.value}T${els.loadStartTime.value}`;
    const endStamp = `${els.loadEndDate.value}T${els.loadEndTime.value}`;
    if (endStamp <= startStamp) {
      alert('Data i godzina zakonczenia musza byc pozniejsze niz rozpoczecie.');
      return;
    }

    state.loads.push({
      id: createId(),
      vehicleId,
      startDate: els.loadStartDate.value,
      endDate: els.loadEndDate.value,
      startTime: els.loadStartTime.value,
      endTime: els.loadEndTime.value,
      name: els.loadName.value.trim(),
      from: els.loadFrom.value.trim(),
      to: els.loadTo.value.trim(),
      weight: els.loadWeight.value.trim(),
      status: els.loadStatus.value,
      notes: els.loadNotes.value.trim(),
      createdAt: new Date().toISOString(),
    });
    writeState();
    els.loadForm.reset();
    setDefaultLoadDate();
    render();
  }

  function deleteVehicle(id) {
    const vehicle = vehicleById(id);
    if (!vehicle) return;
    const count = loadsForVehicle(id).length;
    const message = count
      ? `Usunac ${vehicle.plate}? Usunie to tez ${count} ladunkow przypisanych do tego samochodu.`
      : `Usunac ${vehicle.plate}?`;
    if (!confirm(message)) return;
    state.vehicles = state.vehicles.filter(item => item.id !== id);
    state.loads = state.loads.filter(item => item.vehicleId !== id);
    writeState();
    render();
  }

  function deleteLoad(id) {
    if (!confirm('Usunac ten ladunek z kalendarza?')) return;
    state.loads = state.loads.filter(load => load.id !== id);
    writeState();
    render();
  }

  function cycleStatus(id) {
    const order = ['planned', 'loading', 'road', 'done'];
    const load = state.loads.find(item => item.id === id);
    if (!load) return;
    const current = order.indexOf(load.status);
    load.status = order[(current + 1) % order.length];
    writeState();
    render();
  }

  function selectVehicleForLoad(id) {
    els.loadVehicle.value = id;
    els.loadName.focus();
  }

  function focusLoad(id) {
    const card = els.loadsList.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.closest('.load-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function icsDate(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function loadToIcs(load) {
    const vehicle = vehicleById(load.vehicleId);
    const start = parseLocalDate(loadStartDate(load), loadStartTime(load));
    const end = parseLocalDate(loadEndDate(load), loadEndTime(load));
    const summary = `${vehicle ? vehicle.plate : 'Samochod'} - ${load.name}`;
    const description = [
      `Samochod: ${vehicle ? `${vehicle.plate} ${vehicle.name}` : 'brak'}`,
      `Okres: ${periodLabel(load)}`,
      `Trasa: ${load.from} -> ${load.to}`,
      `Waga: ${load.weight || 'brak danych'}`,
      `Status: ${statusLabels[load.status]}`,
      `Notatki: ${load.notes || 'brak'}`,
    ].join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:${load.id}@zaladunki-maripo`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `LOCATION:${escapeIcs(`${load.from} -> ${load.to}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'END:VEVENT',
    ].join('\\r\\n');
  }

  function escapeIcs(value) {
    return String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replaceAll('\n', '\\n');
  }

  function downloadIcs(loads, fileName) {
    if (!loads.length) {
      alert('Brak ladunkow do eksportu.');
      return;
    }
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Maripo//Zaladunki Maripo//PL',
      ...loads.map(loadToIcs),
      'END:VCALENDAR',
    ].join('\\r\\n');
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function setDefaultLoadDate() {
    const todayIso = toDateInputValue(today);
    els.loadStartDate.value = todayIso;
    els.loadEndDate.value = todayIso;
    els.loadStartTime.value = '08:00';
    els.loadEndTime.value = '10:00';
  }

  function syncEndDateWithStart() {
    if (!els.loadEndDate.value || els.loadEndDate.value < els.loadStartDate.value) {
      els.loadEndDate.value = els.loadStartDate.value;
    }
  }

  els.vehicleForm.addEventListener('submit', addVehicle);
  els.loadForm.addEventListener('submit', addLoad);
  els.loadStartDate.addEventListener('change', syncEndDateWithStart);

  els.vehiclesList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'deleteVehicle') deleteVehicle(button.dataset.id);
    if (button.dataset.action === 'selectVehicle') selectVehicleForLoad(button.dataset.id);
  });

  els.loadsList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const load = state.loads.find(item => item.id === button.dataset.id);
    if (button.dataset.action === 'cycleStatus') cycleStatus(button.dataset.id);
    if (button.dataset.action === 'deleteLoad') deleteLoad(button.dataset.id);
    if (button.dataset.action === 'downloadIcs' && load) {
      downloadIcs([load], `ladunek-${loadStartDate(load)}-${loadStartTime(load)}-${loadEndDate(load)}-${loadEndTime(load)}.ics`);
    }
  });

  els.calendar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="focusLoad"]');
    if (button) focusLoad(button.dataset.id);
  });

  els.prevMonth.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });

  els.nextMonth.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  els.todayBtn.addEventListener('click', () => {
    calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
  });

  els.exportAllBtn.addEventListener('click', () => {
    downloadIcs(sortedLoads(), 'zaladunki-maripo.ics');
  });

  setDefaultLoadDate();
  render();
})();
