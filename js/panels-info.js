// ════════════════════════════════════════════
// PANELS — Info
// ════════════════════════════════════════════

// ── INFO panel ────────────────────────────
function buildInfo() {
  const el = document.getElementById('p-info');
  const m  = C.meta;
  const at = C.attributes;
  const feats = C.feats;

  // group feats by type
  const fTypes = [...new Set(feats.map(f=>f.type))];

  el.innerHTML = `
  <div class="panel-cols">
    <div class="card card-full">
      <div class="card-title">Session Notes</div>
      <textarea class="note-area" id="notes" placeholder="Track encounter details, resources spent, important moments…"></textarea>
      <div class="row" style="margin-top:8px">
        <button class="btn" ontouchstart="" onclick="saveNotes()">Save</button>
        <button class="btn danger" ontouchstart="" onclick="clearNotes()">Clear</button>
        <span class="toast" id="notes-toast">Saved ✓</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Character Info</div>
      <div class="info-row"><span>Ancestry</span><span class="info-val">${m.ancestry} (${m.heritage})</span></div>
      <div class="info-row"><span>Background</span><span class="info-val">${m.background}</span></div>
      <div class="info-row"><span>Class / Level</span><span class="info-val">${m.class} ${m.level}</span></div>
      <div class="info-row"><span>Size</span><span class="info-val">${m.size}</span></div>
      <div style="margin-top:8px;font-size:10px;color:var(--text3);letter-spacing:0.5px">LANGUAGES</div>
      <div class="tag-list">${m.languages.map(l=>`<span class="tag">${l}</span>`).join('')}</div>
    </div>

    <div class="card">
      <div class="card-title">Ability Modifiers</div>
      <div class="stat-grid">
        ${['str','dex','con','int','wis','cha'].map(k=>`
        <div class="stat-box">
          <div class="stat-val">${at[k] >= 0 ? '+' : ''}${at[k]}</div>
          <div class="stat-label">${k.toUpperCase()}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Feats</div>
      <div class="feats-flex">
        ${fTypes.map(type=>`
        <div class="feat-group">
          <div class="feat-group-title">${type}</div>
          ${feats.filter(f=>f.type===type).map(f=>`
          <div class="feat-row">
            <span>${f.name}${f.note?`<span class="feat-note">${f.note}</span>`:''}</span>
            <span class="feat-type">Lvl ${f.level||'—'}</span>
          </div>`).join('')}
        </div>`).join('')}
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Session</div>
      <div class="session-controls">
        <div class="session-btn-group">
          <button class="btn session-export-btn" ontouchstart="" onclick="exportSessionReport()">
            <span class="session-btn-icon">📋</span>
            <span class="session-btn-label">Copy Report</span>
            <span class="session-btn-sub">Markdown to clipboard</span>
          </button>
          <button class="btn session-reset-btn" ontouchstart="" onclick="confirmResetSession()">
            <span class="session-btn-icon">↺</span>
            <span class="session-btn-label">Reset Session</span>
            <span class="session-btn-sub">Revert to defaults</span>
          </button>
        </div>
        <div id="session-feedback" class="session-feedback" style="display:none"></div>
        <div id="session-confirm" class="session-confirm" style="display:none">
          <span class="session-confirm-msg">⚠ This will clear all session data including HP, conditions, notes, and inventory changes. Are you sure?</span>
          <div class="session-confirm-btns">
            <button class="btn danger" ontouchstart="" onclick="executeReset()">Yes, Reset</button>
            <button class="btn" ontouchstart="" onclick="cancelReset()">Cancel</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  `;
  document.getElementById('notes').addEventListener('input', () => { S.notes = document.getElementById('notes').value; saveState(); });
}

