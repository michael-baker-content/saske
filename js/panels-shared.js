// ════════════════════════════════════════════
// PANELS — Shared helpers (condition card)
// ════════════════════════════════════════════

// ── Condition card helper ─────────────────
function buildConditionCard(listId, selId, addFn, clearFn, title='Conditions', extraClass='', summaryId='') {
  const summaryHtml = (listId === 'cond-list' || summaryId)
    ? `<div id="${summaryId || 'cond-effects-summary'}" class="cond-effects-summary" style="display:none"></div>`
    : '';
  return `
  <div class="card ${extraClass}">
    <div class="card-title">${title}</div>
    <div class="cond-list" id="${listId}"><span class="cond-none">No active conditions</span></div>
    ${summaryHtml}
    <div class="row">
      <select class="cond-select" id="${selId}">
        <option value="">Add condition…</option>
        <optgroup label="Negative">
          ${C.conditions_list.negative.map(c=>`<option value="${c}|bad">${c}</option>`).join('')}
        </optgroup>
        <optgroup label="Positive">
          ${C.conditions_list.positive.map(c=>`<option value="${c}|good">${c}</option>`).join('')}
        </optgroup>
      </select>
      <button class="btn sm" ontouchstart="" onclick="${addFn}()">Add</button>
      <button class="btn sm danger" ontouchstart="" onclick="${clearFn}()">Clear</button>
    </div>
  </div>`;
}

function buildConditionSelect(id) {
  // already built via innerHTML; nothing extra needed
}
