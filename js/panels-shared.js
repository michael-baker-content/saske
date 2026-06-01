// ════════════════════════════════════════════
// PANELS — Shared helpers (condition card)
// ════════════════════════════════════════════

// ── Condition card helper ─────────────────
function buildConditionCard(listId, selId, addFn, clearFn, title='Conditions', extraClass='', summaryId='') {
  const cl = C.conditions_list;
  const summaryHtml = (listId === 'cond-list' || summaryId)
    ? `<div id="${summaryId || 'cond-effects-summary'}" class="cond-effects-summary" style="display:none"></div>`
    : '';

  // Build select options: ranked conditions show family name only,
  // simple/positive show name with |bad or |good type tag
  const rankedOpts = cl.negative_ranked.map(c =>
    `<option value="${c.name}|ranked|${c.maxLevel}">${c.name}</option>`
  ).join('');
  const simpleOpts = cl.negative_simple.map(c =>
    `<option value="${c}|bad">${c}</option>`
  ).join('');
  const positiveOpts = cl.positive.map(c =>
    `<option value="${c}|good">${c}</option>`
  ).join('');

  return `
  <div class="card ${extraClass}">
    <div class="card-title">${title}</div>
    <div class="cond-list" id="${listId}"><span class="cond-none">No active conditions</span></div>
    ${summaryHtml}
    <div class="row cond-add-row" id="${selId}-row">
      <select class="cond-select" id="${selId}" onchange="condSelChange('${selId}')">
        <option value="">Add condition…</option>
        <optgroup label="Ranked">${rankedOpts}</optgroup>
        <optgroup label="Negative">${simpleOpts}</optgroup>
        <optgroup label="Positive">${positiveOpts}</optgroup>
      </select>
      <input class="cond-level-input" type="number" id="${selId}-level"
        min="1" max="4" value="1" style="display:none"
        onchange="condLevelChange('${selId}')"/>
      <button class="btn sm" id="${selId}-add-btn" ontouchstart="" onclick="${addFn}()" disabled>Add</button>
      <button class="btn sm danger" id="${listId}-clear-btn" ontouchstart="" onclick="${clearFn}()">Clear</button>
    </div>
  </div>`;
}

// Called when the condition select changes
function condSelChange(selId) {
  const sel   = document.getElementById(selId);
  const lvlEl = document.getElementById(selId + '-level');
  const addBtn = document.getElementById(selId + '-add-btn');
  const val = sel.value;
  if (!val) {
    lvlEl.style.display = 'none';
    addBtn.disabled = true;
    return;
  }
  const parts = val.split('|');
  if (parts[1] === 'ranked') {
    const maxLevel = parseInt(parts[2]) || 4;
    lvlEl.max = maxLevel;
    lvlEl.value = Math.min(parseInt(lvlEl.value) || 1, maxLevel);
    lvlEl.style.display = '';
  } else {
    lvlEl.style.display = 'none';
  }
  addBtn.disabled = false;
}

// Called when the level input changes — just keep it in range
function condLevelChange(selId) {
  const sel    = document.getElementById(selId);
  const lvlEl  = document.getElementById(selId + '-level');
  const maxLevel = parseInt(sel.value.split('|')[2]) || 4;
  lvlEl.value = Math.max(1, Math.min(maxLevel, parseInt(lvlEl.value) || 1));
}

// Build the final condition name from the select + optional level input
function condBuildName(selId) {
  const sel  = document.getElementById(selId);
  const val  = sel.value;
  if (!val) return null;
  const parts = val.split('|');
  if (parts[1] === 'ranked') {
    const level = parseInt(document.getElementById(selId + '-level').value) || 1;
    return { name: parts[0] + ' ' + level, type: 'bad' };
  }
  return { name: parts[0], type: parts[1] };
}

function buildConditionSelect(id) {
  // already built via innerHTML; nothing extra needed
}
