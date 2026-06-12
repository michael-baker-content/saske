// ════════════════════════════════════════════
// PANELS — Inventory
// ════════════════════════════════════════════

// ── INVENTORY panel ───────────────────────
function buildInventory() {
  const el = document.getElementById('p-inventory');
  el.innerHTML = `
  <div class="panel-cols">
    <div class="card card-full">
      <div class="card-title">Equipped Armor</div>
      <div class="armor-grid" id="armor-grid"></div>
    </div>

    <div class="card card-full">
      <div class="card-title">Inventory</div>
      <div id="inv-list"></div>
      <div class="inv-add-form" id="inv-add-form">
        <div class="inv-add-title">Add Item</div>
        <div class="inv-add-fields">
          <div class="inv-field-group inv-field-name">
            <label class="inv-field-label">Name *</label>
            <input class="inv-input" id="inv-new-name" type="text" placeholder="Item name" oninput="document.getElementById('inv-add-btn').disabled=!this.value.trim()"/>
          </div>
          <div class="inv-field-group inv-field-desc" style="grid-column:1/-1">
            <label class="inv-field-label">Description</label>
            <input class="inv-input" id="inv-new-desc" type="text" placeholder="Brief description…"/>
          </div>
          <div class="inv-field-group inv-field-bulk">
            <label class="inv-field-label">Bulk *</label>
            <input class="inv-input" id="inv-new-bulk" type="text" placeholder="1 / L / —"/>
          </div>
          <div class="inv-field-group inv-field-qty">
            <label class="inv-field-label">Qty</label>
            <input class="inv-input" id="inv-new-qty" type="number" placeholder="—" min="1"/>
          </div>
          <div class="inv-field-group inv-field-notes">
            <label class="inv-field-label">Notes</label>
            <input class="inv-input" id="inv-new-notes" type="text" placeholder="Optional"/>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <div class="tog" id="inv-new-ammo-tog" ontouchstart="" onclick="toggleNewAmmo()"><div class="tog-knob"></div></div>
          <span class="inv-field-label" style="font-size:11px">Ammunition</span>
          <div id="inv-new-ammo-fields" style="display:none;align-items:center;gap:6px;margin-left:4px">
            <label class="inv-field-label">per bundle:</label>
            <input class="inv-input" id="inv-new-ammo-per" type="number" placeholder="10" min="1" style="width:54px"/>
          </div>
        </div>
        <button class="btn gold" id="inv-add-btn" ontouchstart="" onclick="invAddItem()" style="margin-top:8px;width:100%" disabled>+ Add Item</button>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Ammunition</div>
      <div id="inv-ammo-counters"></div>
    </div>
  </div>

  `;
  syncInventory();
  syncArmor();

  ['inv-new-name','inv-new-bulk','inv-new-qty','inv-new-desc','inv-new-notes','inv-new-ammo-per'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') invAddItem(); });
  });
}

// Track which item index is being edited
let invEditIdx = null;

function toggleNewAmmo() {
  const tog = document.getElementById('inv-new-ammo-tog');
  const fields = document.getElementById('inv-new-ammo-fields');
  if (!tog || !fields) return;
  const on = tog.classList.toggle('on');
  fields.style.display = on ? 'flex' : 'none';
}

function invOpenModal(idx) {
  invEditIdx = idx;
  const item = S.inventory[idx];
  if (!item) return;
  document.getElementById('inv-edit-name').value  = item.name;
  document.getElementById('inv-edit-bulk').value  = item.bulk;
  document.getElementById('inv-edit-qty').value   = item.quantity ?? '';
  document.getElementById('inv-edit-desc').value  = item.description || '';
  document.getElementById('inv-edit-notes').value = item.notes || '';
  const ammoTog    = document.getElementById('inv-edit-ammo-tog');
  const ammoFields = document.getElementById('inv-edit-ammo-fields');
  if (item.ammo) {
    ammoTog.classList.add('on');
    ammoFields.style.display = 'flex';
    document.getElementById('inv-edit-ammo-per').value = item.ammoPerBundle ?? 1;
  } else {
    ammoTog.classList.remove('on');
    ammoFields.style.display = 'none';
    document.getElementById('inv-edit-ammo-per').value = '';
  }
  document.getElementById('inv-modal-backdrop').style.display = 'flex';
}

function toggleEditAmmo() {
  const tog = document.getElementById('inv-edit-ammo-tog');
  const fields = document.getElementById('inv-edit-ammo-fields');
  if (!tog || !fields) return;
  const on = tog.classList.toggle('on');
  fields.style.display = on ? 'flex' : 'none';
}

function invSaveEdit() {
  if (invEditIdx === null) return;
  const item = S.inventory[invEditIdx];
  if (!item) return;
  item.name     = document.getElementById('inv-edit-name').value.trim() || item.name;
  item.bulk     = document.getElementById('inv-edit-bulk').value.trim() || item.bulk;
  const qtyRaw  = document.getElementById('inv-edit-qty').value.trim();
  item.quantity = qtyRaw ? parseInt(qtyRaw) : null;
  item.description = document.getElementById('inv-edit-desc').value.trim();
  item.notes    = document.getElementById('inv-edit-notes').value.trim();
  const isAmmo  = document.getElementById('inv-edit-ammo-tog').classList.contains('on');
  item.ammo     = isAmmo;
  if (isAmmo) {
    const perRaw = document.getElementById('inv-edit-ammo-per').value.trim();
    item.ammoPerBundle = perRaw ? parseInt(perRaw) : 1;
    // Reset used count if ammoPerBundle changed
    if (item.used > (item.quantity ?? 0) * item.ammoPerBundle) item.used = 0;
  } else {
    item.ammoPerBundle = undefined;
    item.used = 0;
  }
  commit(() => {}, [syncInventory]);
  invCloseModalDirect();
}

function invDeleteEdit() {
  if (invEditIdx === null) return;
  commit(() => { S.inventory.splice(invEditIdx, 1); }, [syncInventory]);
  invCloseModalDirect();
}

function invCloseModal(e) {
  if (e.target.id === 'inv-modal-backdrop') invCloseModalDirect();
}
function invCloseModalDirect() {
  document.getElementById('inv-modal-backdrop').style.display = 'none';
  invEditIdx = null;
}

// ── Proficiency rank → numeric bonus ──────────────────────────────

// ── Compute and display the equipped armor card ───────────────────
// AC formula: 10 + proficiency bonus + min(dex mod, dex cap) + armor AC bonus
function syncArmor() {
  const armorEl = document.getElementById('armor-grid');
  if (!armorEl || !C.equipped_armor) return;

  const arm   = C.equipped_armor;
  const level = C.meta.level;
  const dex   = C.attributes.dex;
  const acProf = profBonus(C.defenses.ac_proficiency, level);
  const effDex = Math.min(dex, arm.dex_cap);
  const computedAC = 10 + acProf + effDex + arm.ac_bonus;

  armorEl.innerHTML = `
    <div class="armor-name">${arm.name}</div>
    ${invDescHtml(arm.name)}
    <div class="armor-stats">
      <div class="armor-stat-group">
        <div class="armor-tile has-tooltip" data-tooltip="${escapeAttr(dcTooltip('AC', computedAC, '10 base', [
          mathTerm(acProf, 'prof (' + C.defenses.ac_proficiency + ')'),
          mathTerm(effDex, 'DEX' + (dex > arm.dex_cap ? ' (capped)' : '')),
          mathTerm(arm.ac_bonus, 'item')
        ]))}">
          <div class="stat-val" style="font-size:20px">${computedAC}</div>
          <div class="stat-label">AC</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Item bonus to AC granted by this armor">
          <div class="stat-val" style="font-size:20px">+${arm.ac_bonus}</div>
          <div class="stat-label">Item Bonus</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Maximum DEX bonus that can be applied to AC${dex > arm.dex_cap ? '. Your DEX ' + dex + ' is capped at ' + arm.dex_cap : '. Your DEX ' + dex + ' fits within cap'}">
          <div class="stat-val" style="font-size:20px${dex > arm.dex_cap ? ';color:var(--amber)' : ''}">+${arm.dex_cap}</div>
          <div class="stat-label">Dex Cap</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Penalty to Strength and Dexterity-based skill checks${arm.check_penalty === 0 ? ' (none)' : ''}">
          <div class="stat-val" style="font-size:20px;${arm.check_penalty < 0 ? 'color:var(--red-b)' : ''}">${arm.check_penalty}</div>
          <div class="stat-label">Check Pen.</div>
        </div>
      </div>
    </div>
    <div class="armor-proficiency">
      Armor proficiency: ${profToStars(C.defenses.ac_proficiency)}
      <span style="font-size:10px;color:var(--text3);margin-left:4px">${C.defenses.ac_proficiency} (+${acProf})</span>
    </div>
  `;
}

function syncInventory() {
  if (!S.inventory) return;

  // ── Inventory table ──────────────────────────────────────────────
  const listEl = document.getElementById('inv-list');
  if (listEl) {
    if (!S.inventory.length) {
      listEl.innerHTML = '<div class="inv-empty">No items in inventory</div>';
    } else {
      let rows = S.inventory.map((item, idx) => {
        const qty   = item.quantity ?? null;
        const qtyDisplay = qty != null ? String(qty) : '—';
        const bulk  = calcBulk(item.bulk, qty ?? 1);
        const ammoTag = item.ammo ? '<span class="inv-ammo-tag">ammo</span>' : '';
        const itemName = escapeHtml(item.name);
        const itemNotes = escapeHtml(item.notes || '');
        const itemTooltip = escapeAttr(item.description || item.name);
        return '<tr class="inv-tr">'
             + '<td class="inv-td inv-td-name">'
             +   '<button class="inv-name-btn has-tooltip" data-tooltip="' + itemTooltip + '" ontouchstart="" onclick="invOpenModal(' + idx + ')">' + itemName + '</button>'
             +   ammoTag
             +   (item.notes ? '<div class="inv-item-notes">' + itemNotes + '</div>' : '')
             + '</td>'
             + '<td class="inv-td inv-td-qty">' + qtyDisplay + '</td>'
             + '<td class="inv-td inv-td-bulk">' + bulk + '</td>'
             + '</tr>';
      }).join('');

      listEl.innerHTML = '<table class="inv-table">'
        + '<thead><tr>'
        + '<th class="inv-th inv-th-name">Name</th>'
        + '<th class="inv-th inv-th-qty">Qty</th>'
        + '<th class="inv-th inv-th-bulk">Bulk</th>'
        + '</tr></thead>'
        + '<tbody>' + rows + '</tbody>'
        + '</table>';
    }
  }

  // ── Ammunition counters ──
  const ammoEl = document.getElementById('inv-ammo-counters');
  if (ammoEl) {
    const ammoItems = S.inventory.filter(i => i.ammo && i.quantity != null);
    if (!ammoItems.length) {
      ammoEl.innerHTML = '<div style="font-size:12px;color:var(--text3);font-style:italic;padding:4px 0">No ammunition tracked</div>';
    } else {
      ammoEl.innerHTML = ammoItems.map(item => {
        const idx        = S.inventory.indexOf(item);
        const perBundle  = item.ammoPerBundle ?? 1;
        const totalShots = item.quantity * perBundle;
        const usedShots  = item.used ?? 0;
        const remaining  = totalShots - usedShots;
        const atMax      = usedShots === 0;
        const atZero     = remaining === 0;
        const itemName   = escapeHtml(item.name);
        return '<div class="counter-row">'
             + '<div>'
             + '<span>' + itemName + '</span>'
             + '<span style="font-size:10px;color:var(--text3)"> ' + remaining + ' / ' + totalShots + ' (' + item.quantity + ' bundles × ' + perBundle + ')</span>'
             + '</div>'
             + '<div class="counter-controls">'
             + '<button class="strip-btn" ontouchstart="" onclick="invUseItem(' + idx + ', 1)"' + (atZero ? ' disabled' : '') + '>− Use</button>'
             + '<button class="strip-btn heal" ontouchstart="" onclick="invUseItem(' + idx + ', -1)"' + (atMax ? ' disabled' : '') + '>+ Return</button>'
             + '<button class="strip-btn" ontouchstart="" onclick="invResetItem(' + idx + ')"' + (atMax ? ' disabled' : '') + '>Reset</button>'
             + '</div>'
             + '</div>';
      }).join('');
    }
  }
}

function invAddItem() {
  const name   = document.getElementById('inv-new-name')?.value.trim();
  const bulk   = document.getElementById('inv-new-bulk')?.value.trim();
  const qtyRaw = document.getElementById('inv-new-qty')?.value.trim();
  const desc   = document.getElementById('inv-new-desc')?.value.trim();
  const notes  = document.getElementById('inv-new-notes')?.value.trim();
  const isAmmo = document.getElementById('inv-new-ammo-tog')?.classList.contains('on');
  const perRaw = document.getElementById('inv-new-ammo-per')?.value.trim();

  if (!name) { document.getElementById('inv-new-name').focus(); return; }
  if (!bulk) { document.getElementById('inv-new-bulk').focus(); return; }

  const quantity = qtyRaw ? parseInt(qtyRaw) : null;
  const item = { name, bulk, quantity, description: desc || '', notes: notes || '', used: 0, ammo: isAmmo };
  if (isAmmo) item.ammoPerBundle = perRaw ? parseInt(perRaw) : 1;
  commit(() => { S.inventory.push(item); }, [syncInventory]);

  ['inv-new-name','inv-new-bulk','inv-new-qty','inv-new-desc','inv-new-notes','inv-new-ammo-per'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Reset ammo toggle
  const ammoTog = document.getElementById('inv-new-ammo-tog');
  const ammoFields = document.getElementById('inv-new-ammo-fields');
  if (ammoTog) ammoTog.classList.remove('on');
  if (ammoFields) ammoFields.style.display = 'none';
  document.getElementById('inv-new-name')?.focus();
}

function invRemoveItem(idx) {
  commit(() => { S.inventory.splice(idx, 1); }, [syncInventory]);
}

function invUseItem(idx, delta) {
  const item = S.inventory[idx];
  if (!item) return;
  const maxUsed = item.ammo
    ? (item.quantity ?? 0) * (item.ammoPerBundle ?? 1)
    : (item.quantity ?? 0);
  commit(() => { item.used = Math.max(0, Math.min(maxUsed, (item.used ?? 0) + delta)); }, [syncInventory]);
}

function invResetItem(idx) {
  const item = S.inventory[idx];
  if (!item) return;
  commit(() => { item.used = 0; }, [syncInventory]);
}
