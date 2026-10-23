var students = {};
  var currentUser = null;

  function showScreen(name) {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.remove('active');
    document.getElementById(name).classList.add('active');
  }

  function renderRecentChips() {
    var wrap = document.getElementById('recentChips');
    var ids = Object.keys(students);
    wrap.innerHTML = '';
    if (ids.length === 0) return;
    var label = document.createElement('span');
    label.className = 'recent-label';
    label.textContent = 'Continue as:';
    wrap.appendChild(label);
    ids.forEach(function (id) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = id;
      chip.addEventListener('click', function () { login(id); });
      wrap.appendChild(chip);
    });
  }

  function login(rawId) {
    var id = (rawId || '').trim();
    if (!id) {
      document.getElementById('loginError').textContent = 'Enter a name or roll number to continue.';
      return;
    }
    document.getElementById('loginError').textContent = '';
    currentUser = id;
    if (!students[id]) {
      students[id] = { daysHappened: 0, fullDays: 0, halfDays: 0, target: 75 };
    }
    document.getElementById('loginNameInput').value = '';
    loadDashboard();
    showScreen('dashboardScreen');
  }

  function loadDashboard() {
    var data = students[currentUser];
    document.getElementById('userLabel').textContent = currentUser;
    document.getElementById('inputDaysHappened').value = data.daysHappened || '';
    document.getElementById('inputFullDays').value = data.fullDays || '';
    document.getElementById('inputHalfDays').value = data.halfDays || '';
    document.getElementById('targetInput').value = data.target;
    document.getElementById('formError').textContent = '';
    renderSummary();
  }

  function switchStudent() {
    currentUser = null;
    renderRecentChips();
    showScreen('loginScreen');
  }

  function updateLedger() {
    var daysHappened = parseInt(document.getElementById('inputDaysHappened').value, 10) || 0;
    var fullDays = parseInt(document.getElementById('inputFullDays').value, 10) || 0;
    var halfDays = parseInt(document.getElementById('inputHalfDays').value, 10) || 0;
    var errorEl = document.getElementById('formError');

    if (daysHappened < 0 || fullDays < 0 || halfDays < 0) {
      errorEl.textContent = "Numbers can't be negative.";
      return;
    }
    if (fullDays + halfDays > daysHappened) {
      errorEl.textContent = "Full-day and half-day counts together can't exceed the total days.";
      return;
    }
    errorEl.textContent = '';
    var data = students[currentUser];
    data.daysHappened = daysHappened;
    data.fullDays = fullDays;
    data.halfDays = halfDays;
    renderSummary();
  }

  function updateTarget() {
    var t = parseFloat(document.getElementById('targetInput').value);
    var data = students[currentUser];
    data.target = (isNaN(t) || t <= 0) ? 75 : Math.min(t, 100);
    renderSummary();
  }

  function renderSummary() {
    var data = students[currentUser];
    var conducted = data.daysHappened * 8;
    var attended = data.fullDays * 8 + data.halfDays * 4;
    var missed = conducted - attended;
    var absentDays = data.daysHappened - data.fullDays - data.halfDays;
    var pct = conducted > 0 ? (attended / conducted) * 100 : null;

    var emptyState = document.getElementById('summaryEmpty');
    var filledState = document.getElementById('summaryFilled');

    if (pct === null) {
      emptyState.style.display = 'block';
      filledState.style.display = 'none';
      return;
    }
    emptyState.style.display = 'none';
    filledState.style.display = 'block';

    document.getElementById('statConducted').textContent = conducted;
    document.getElementById('statAttended').textContent = attended;
    document.getElementById('statMissed').textContent = missed;
    document.getElementById('statAbsentDays').textContent = absentDays;

    var rounded = Math.round(pct * 10) / 10;
    var percentText = document.getElementById('percentText');
    percentText.textContent = rounded.toFixed(1) + '%';

    var isSafe = pct >= data.target;
    var statusColor = isSafe ? 'var(--stamp-green)' : 'var(--pen-red)';
    percentText.style.color = statusColor;
    var statusLabel = document.getElementById('statusLabel');
    statusLabel.textContent = isSafe ? 'On track' : 'Below target';
    statusLabel.style.color = statusColor;

    var circle = document.getElementById('progressRing');
    var circumference = 2 * Math.PI * 70;
    var offset = circumference * (1 - Math.min(pct, 100) / 100);
    circle.style.stroke = statusColor;
    circle.style.strokeDashoffset = offset;

    var targetFraction = data.target / 100;
    var msgEl = document.getElementById('targetMessage');
    var subEl = document.getElementById('targetSubMessage');
    msgEl.style.color = statusColor;

    if (isSafe) {
      var maxSkip = Math.max(0, Math.floor(attended / targetFraction - conducted));
      if (maxSkip > 0) {
        msgEl.textContent = 'You can miss the next ' + maxSkip + ' lecture' + (maxSkip === 1 ? '' : 's') + ' and stay at or above ' + data.target + '%.';
        var daysEqSkip = maxSkip / 8;
        subEl.textContent = "That's about " + daysEqSkip.toFixed(1) + ' full day' + (daysEqSkip === 1 ? '' : 's') + ' of classes.';
      } else {
        msgEl.textContent = "You're exactly at " + data.target + '% — one more miss will drop you below it.';
        subEl.textContent = '';
      }
    } else {
      if (targetFraction >= 1) {
        msgEl.textContent = "You've already missed a lecture, so 100% isn't reachable anymore this term.";
        subEl.textContent = '';
      } else {
        var needed = Math.ceil((targetFraction * conducted - attended) / (1 - targetFraction));
        msgEl.textContent = 'Attend the next ' + needed + ' lecture' + (needed === 1 ? '' : 's') + ' in a row to reach ' + data.target + '%.';
        var daysEqNeed = needed / 8;
        subEl.textContent = "That's about " + daysEqNeed.toFixed(1) + ' full day' + (daysEqNeed === 1 ? '' : 's') + ' of classes.';
      }
    }
  }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    login(document.getElementById('loginNameInput').value);
  });

  document.getElementById('switchBtn').addEventListener('click', switchStudent);

  document.getElementById('entryForm').addEventListener('submit', function (e) {
    e.preventDefault();
    updateLedger();
  });

  ['inputDaysHappened', 'inputFullDays', 'inputHalfDays'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      document.getElementById('formError').textContent = '';
    });
  });

  document.getElementById('targetInput').addEventListener('input', updateTarget);

  (function initRing() {
    var circle = document.getElementById('progressRing');
    var circumference = 2 * Math.PI * 70;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
  })();
