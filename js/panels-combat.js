// ════════════════════════════════════════════
// PANELS — Combat + Companion
// ════════════════════════════════════════════

// ════════════════════════════════════════════
// UI PANELS — build* functions
// ════════════════════════════════════════════

function build() {
  // Header
  document.getElementById('h-name').textContent = C.meta.name;
  document.getElementById('h-sub').textContent  = C.meta.subtitle;
  document.getElementById('hp-max-lbl').textContent = '/' + C.defenses.hp_max;

  // Tabs
  const tabDefs = ['COMBAT','COMPANION','SKILLS','INVENTORY','INFO'];
  const tabsEl  = document.getElementById('tabs');
  tabDefs.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'tab' + (i === 0 ? ' active' : '');
    d.textContent = t;
    d.onclick = () => goTab(i);
    tabsEl.appendChild(d);
  });

  buildCombat();
  buildCompanion();
  buildSkills();
  buildInventory();
  buildInfo();
  initSwipe();
}

// ── COMBAT panel ──────────────────────────
function buildCombat() {
  const el = document.getElementById('p-combat');
  const sv = C.saving_throws;

  el.innerHTML = `
  <div class="panel-cols">
    <div class="card card-full stats-saves-card">
      <div class="stats-saves-grid">
        <div class="stats-saves-group">
          <div class="card-title">Core Stats</div>
          <div class="stat-grid">
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(dcTooltip('AC', C.defenses.ac, '10 base', [
              mathTerm(profBonus(C.defenses.ac_proficiency, C.meta.level), 'prof (' + C.defenses.ac_proficiency + ')'),
              mathTerm(Math.min(C.attributes.dex, C.equipped_armor?.dex_cap ?? 99), 'DEX' + (C.attributes.dex > (C.equipped_armor?.dex_cap ?? 99) ? ' (capped)' : '')),
              mathTerm(C.equipped_armor?.ac_bonus ?? 0, 'item')
            ]))}">
              <div class="stat-val" id="live-ac">${C.defenses.ac}</div>
              <div class="stat-label">AC</div>
              <div class="stat-stars">${profToStars(C.defenses.ac_proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(statTooltip('Perception', C.perception.modifier, profBonus(C.perception.proficiency, C.meta.level) + ' prof (' + C.perception.proficiency + ')', [
              mathTerm(C.attributes[C.perception.key_attribute], 'WIS')
            ]))}">
              <div class="stat-val" id="live-perc">+${C.perception.modifier}</div>
              <div class="stat-label">Perception</div>
              <div class="stat-stars">${profToStars(C.perception.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(dcTooltip('Class DC', C.defenses.class_dc, '10 base', [
              mathTerm(profBonus(C.defenses.class_dc_proficiency, C.meta.level), 'prof (' + C.defenses.class_dc_proficiency + ')'),
              mathTerm(C.attributes[C.defenses.class_dc_key_attribute], 'WIS')
            ]))}">
              <div class="stat-val">${C.defenses.class_dc}</div>
              <div class="stat-label">Class DC</div>
              <div class="stat-stars">${profToStars(C.defenses.class_dc_proficiency)}</div>
            </div>
          </div>
        </div>
        <div class="stats-saves-group">
          <div class="card-title">Saving Throws</div>
          <div class="stat-grid">
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(statTooltip('Fortitude', sv.fortitude.modifier, profBonus(sv.fortitude.proficiency, C.meta.level) + ' prof (' + sv.fortitude.proficiency + ')', [
              mathTerm(C.attributes[sv.fortitude.key_attribute], 'CON')
            ]))}">
              <div class="stat-val" id="live-fort">+${sv.fortitude.modifier}</div>
              <div class="stat-label">Fortitude</div>
              <div class="stat-stars">${profToStars(sv.fortitude.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(statTooltip('Reflex', sv.reflex.modifier, profBonus(sv.reflex.proficiency, C.meta.level) + ' prof (' + sv.reflex.proficiency + ')', [
              mathTerm(C.attributes[sv.reflex.key_attribute], 'DEX')
            ]))}">
              <div class="stat-val" id="live-reflex">+${sv.reflex.modifier}</div>
              <div class="stat-label">Reflex</div>
              <div class="stat-stars">${profToStars(sv.reflex.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="${escapeAttr(statTooltip('Will', sv.will.modifier, profBonus(sv.will.proficiency, C.meta.level) + ' prof (' + sv.will.proficiency + ')', [
              mathTerm(C.attributes[sv.will.key_attribute], 'WIS')
            ]))}">
              <div class="stat-val" id="live-will">+${sv.will.modifier}</div>
              <div class="stat-label">Will</div>
              <div class="stat-stars">${profToStars(sv.will.proficiency)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Hunt Prey</div>
      <div class="prey-box" id="prey-box">
        <span id="prey-txt" class="prey-none">No prey designated</span>
        <button class="btn sm danger" id="prey-clear" ontouchstart="" onclick="clearPrey()" style="display:none">Clear</button>
      </div>
      <div class="row" style="margin-bottom:6px">
        <input class="text-in" type="text" id="prey-input" placeholder="Name your prey…" oninput="document.getElementById('prey-hunt-btn').disabled=!this.value.trim()"/>
        <button class="btn gold" id="prey-hunt-btn" ontouchstart="" onclick="setPrey()" disabled>Hunt ◆</button>
      </div>
      <div class="prey-hint">+2 Perception (Seek) · +2 Survival (Track)<span class="prey-hint-line">Precision Edge +1d8 on 1st hit vs Prey</span></div>
    </div>

    <div class="card">
      <div class="card-title">Actions This Turn</div>
      <div class="actions-card-main">
        <div class="action-pips" aria-label="Actions this turn">
          <div class="action-pip" id="a1" ontouchstart="" onclick="toggleAction('a1')" title="Action 1">◆</div>
          <div class="action-pip" id="a2" ontouchstart="" onclick="toggleAction('a2')" title="Action 2">◆</div>
          <div class="action-pip" id="a3" ontouchstart="" onclick="toggleAction('a3')" title="Action 3">◆</div>
          <div class="action-pip quickened" id="a4" ontouchstart="" onclick="toggleAction('a4')" title="Quickened action">◆</div>
          <div class="action-pip react" id="r1" ontouchstart="" onclick="toggleAction('r1')" title="Reaction">↺</div>
        </div>
        <button class="btn sm" id="reset-turn-btn" ontouchstart="" onclick="resetActions()">Reset Turn</button>
      </div>
      <div class="action-budget-note" id="action-budget-note"></div>
      <div class="row warden-row">
        <div class="tog green" id="warden-tog" ontouchstart="" onclick="toggleWarden()"><div class="tog-knob"></div></div>
        <span class="tog-label has-tooltip" data-tooltip="Warden's Boon active: ally gains Precision until their next turn">Warden's Boon active</span>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Weapons</div>
      ${C.weapons.map((w,i) => `
      <div class="weapon-card clickable has-tooltip" data-tooltip="${escapeAttr(attackTooltip(w, 'player'))}" ontouchstart="" onclick="openModal(${i},'player')">
        <div class="weapon-row">
          <div class="weapon-name">${w.name}</div>
          <span class="tap-hint">tap to roll ▸</span>
        </div>
        <div class="weapon-row" style="margin-top:3px">
          <span class="weapon-atk" id="live-weapon-atk-${i}">+${w.attack}</span>
          <span class="weapon-dmg">${w.damage_str || w.damage || ''}</span>
        </div>
        <div class="weapon-traits">${w.traits.join(' · ')}</div>
        ${invDescHtml(w.name)}
        ${w.note ? `<div class="weapon-note-${w.note_type || 'neutral'}">${w.note}</div>` : ''}
      </div>`).join('')}
    </div>

    ${buildConditionCard('cond-list','cond-select','addCondition','clearConditions','Conditions','card-full')}

    <div class="card card-full">
      <div class="card-title">Diseases</div>
      <div id="disease-list"></div>
      <div class="disease-add-row">
        <input class="text-in" id="disease-name-input" type="text" placeholder="Disease name…" oninput="document.getElementById('disease-add-btn').disabled=!this.value.trim()"/>
        <button class="btn gold" id="disease-add-btn" ontouchstart="" onclick="diseaseAdd()" disabled>Add</button>
      </div>
    </div>
  </div>
  `;

  document.getElementById('prey-input').addEventListener('keydown', e => { if (e.key==='Enter') setPrey(); });
  buildConditionSelect('cond-select');
}

// ── COMPANION panel ───────────────────────
function buildCompanion() {
  const el = document.getElementById('p-companion');
  const co = C.companion;
  const sv = co.saving_throws;
  const at = co.attributes;
  // Build skills HTML separately to avoid nested template literal issues
  const PROF_MAP = {Untrained:0, Trained:2, Expert:4, Master:6, Legendary:8};
  const bardingOn = S.haki_barding;
  const skillsHtml = co.skills.map(s => {
    const attrVal  = co.attributes[s.key_attribute] ?? 0;
    const attrName = (s.key_attribute || '').toUpperCase();
    const pb       = PROF_MAP[s.proficiency] ?? 0;
    const profNum  = pb === 0 ? 0 : C.meta.level + pb;
    const bp       = s.barding_penalty ?? 0;
    const effMod   = s.modifier + (bardingOn ? bp : 0);
    const tipParts = [];
    if (pb > 0) tipParts.push(profNum + ' prof (' + s.proficiency + ')');
    tipParts.push(mathTerm(attrVal, attrName));
    if (bardingOn && bp !== 0) tipParts.push(mathTerm(bp, 'barding'));
    const tip   = s.name + ' = ' + tipParts.join(' ') + ' = ' + fmtMod(effMod);
    const mod   = (effMod >= 0 ? '+' : '') + effMod;
    const style = (bardingOn && bp !== 0) ? ' style="color:var(--red-b)"' : '';
    return '<div class="skill-row has-tooltip" data-tooltip="' + tip + '">'
         + '<div class="skill-name-wrap"><span>' + s.name + '</span>'
         + '<span class="skill-prof-badge">' + s.proficiency + (bp !== 0 ? ' · barding' : '') + '</span></div>'
         + '<span class="skill-mod"' + style + '>' + mod + '</span></div>';
  }).join('');

  el.innerHTML = `

    <!-- ── Identity strip ── -->
    <div class="comp-header card">
      <div class="comp-identity">
        <div class="comp-avatar">
          <img src="haki.png" alt="Haki" width="64" height="64"/>
        </div>
        <div class="comp-info">
          <div class="comp-name">${co.name}</div>
          <div class="comp-sub">Mature ${co.type} · Level ${C.meta.level}</div>
          <div class="hp-bar-row" style="margin-top:4px">
            <div class="hp-bar-wrap">
              <div class="hp-bar-track">
                <div class="hp-bar-seg" id="haki-bar-normal"></div>
                <div class="hp-bar-seg hp-bar-temp" id="haki-bar-temp"></div>
              </div>
            </div>
            <div class="hp-nums"><span class="cur" id="haki-cur">—</span>/<span id="haki-max-lbl">${co.hp_max}</span></div>
          </div>
        </div>
      </div>
      <!-- HP controls -->
      <div class="hp-strip">
        <input class="hp-in" type="number" id="haki-amt" placeholder="Amt" min="1"/>
        <button class="strip-btn dmg" id="haki-amt-dmg" ontouchstart="" onclick="changeHakiHP(-1)">− Dmg</button>
        <button class="strip-btn heal" id="haki-amt-heal" ontouchstart="" onclick="changeHakiHP(1)">+ Heal</button>
        <button class="strip-btn tmp-toggle" id="haki-tmp-toggle" ontouchstart="" onclick="toggleTmpStrip('haki')">+ Temp</button>
        <button class="strip-btn" id="haki-rest" ontouchstart="" onclick="setHakiHP(${co.hp_max})">⟳ Rest</button>
      </div>
      <!-- Temp HP row (hidden by default) -->
      <div class="tmp-strip" id="haki-tmp-strip" style="display:none">
        <span class="tmp-label">Temp</span>
        <input class="hp-in" type="number" id="haki-tmp-amt" placeholder="0" min="0" value="0"/>
        <button class="strip-btn tmp-set" ontouchstart="" onclick="setHakiTmpHP()">Set</button>
        <button class="strip-btn tmp-clr" ontouchstart="" onclick="clearHakiTmpHP()">Clear</button>
        <span class="tmp-current" id="haki-tmp-cur" style="margin-left:auto"></span>
      </div>
    </div>

    <!-- ── Core Stats + Saving Throws ── -->
    <div class="card stats-saves-card">
      <div class="stats-saves-grid">
        <div class="stats-saves-group">
          <div class="card-title">Core Stats</div>
          <div class="stat-grid">
            <div class="stat-box has-tooltip"
              data-tooltip="${(()=>{
                const bard = co.equipped_barding;
                const acProf = profBonus(co.ac_proficiency, C.meta.level);
                const effDex = bard ? Math.min(at.dex, bard.dex_cap) : at.dex;
                return escapeAttr(dcTooltip('AC', 10 + acProf + effDex + (bard?.ac_bonus??0), '10 base', [
                  mathTerm(acProf, 'prof (' + co.ac_proficiency + ')'),
                  mathTerm(effDex, 'DEX' + (at.dex > (bard?.dex_cap??99) ? ' (capped)' : '')),
                  mathTerm(bard?.ac_bonus??0, 'item')
                ]));
              })()}">
              <div class="stat-val" id="haki-live-ac">${(()=>{
                const bard = co.equipped_barding;
                const acProf = profBonus(co.ac_proficiency, C.meta.level);
                const effDex = bard ? Math.min(at.dex, bard.dex_cap) : at.dex;
                return 10 + acProf + effDex + (bard?.ac_bonus??0);
              })()}</div>
              <div class="stat-label">AC</div>
              <div class="stat-stars">${profToStars(co.ac_proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip"
              data-tooltip="${escapeAttr(statTooltip('Perception', co.perception.modifier, profBonus(co.perception.proficiency, C.meta.level) + ' prof (' + co.perception.proficiency + ')', [
                mathTerm(at[co.perception.key_attribute], 'WIS')
              ]))}">
              <div class="stat-val" id="haki-live-perc">${fmtMod(co.perception.modifier)}</div>
              <div class="stat-label">Perception</div>
              <div class="stat-stars">${profToStars(co.perception.proficiency)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);gap:2px;padding:0">
                ${['str','dex','con','int','wis','cha'].map(k=>`
                <div class="stat-box" style="padding:2px 1px;border:none;background:transparent">
                  <div class="stat-val" style="font-size:12px">${fmtMod(at[k])}</div>
                  <div class="stat-label" style="font-size:8px">${k.toUpperCase()}</div>
                </div>`).join('')}
              </div>
              <div class="stat-label" style="margin-top:2px">Abilities</div>
            </div>
          </div>
        </div>
        <div class="stats-saves-group">
          <div class="card-title">Saving Throws</div>
          <div class="stat-grid">
            <div class="stat-box has-tooltip"
              data-tooltip="${escapeAttr(statTooltip('Fortitude', sv.fortitude.modifier, (C.meta.level + (PROF_MAP[sv.fortitude.proficiency]||0)) + ' prof (' + sv.fortitude.proficiency + ')', [
                mathTerm(at.con, 'CON')
              ]))}">
              <div class="stat-val" id="haki-live-fort">${fmtMod(sv.fortitude.modifier)}</div>
              <div class="stat-label">Fortitude</div>
              <div class="stat-stars">${profToStars(sv.fortitude.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip"
              data-tooltip="${escapeAttr(statTooltip('Reflex', sv.reflex.modifier, (C.meta.level + (PROF_MAP[sv.reflex.proficiency]||0)) + ' prof (' + sv.reflex.proficiency + ')', [
                mathTerm(at.dex, 'DEX')
              ]))}">
              <div class="stat-val" id="haki-live-reflex">${fmtMod(sv.reflex.modifier)}</div>
              <div class="stat-label">Reflex</div>
              <div class="stat-stars">${profToStars(sv.reflex.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip"
              data-tooltip="${escapeAttr(statTooltip('Will', sv.will.modifier, (C.meta.level + (PROF_MAP[sv.will.proficiency]||0)) + ' prof (' + sv.will.proficiency + ')', [
                mathTerm(at.wis, 'WIS')
              ]))}">
              <div class="stat-val" id="haki-live-will">${fmtMod(sv.will.modifier)}</div>
              <div class="stat-label">Will</div>
              <div class="stat-stars">${profToStars(sv.will.proficiency)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Attacks + Equipped Barding ── -->
    <div class="panel-cols">

      <div class="card">
        <div class="card-title">Attacks</div>
        ${co.attacks.map((a,i) => `
        <div class="weapon-card clickable has-tooltip" data-tooltip="${escapeAttr(attackTooltip(a, 'companion'))}" ontouchstart="" onclick="openModal(${i},'companion')">
          <div class="weapon-row">
            <div class="weapon-name">${a.name}${a.traits?.length ? ' <span style="font-size:10px;color:var(--text3)">(' + a.traits.join(', ') + ')</span>' : ''}</div>
            <span class="tap-hint">tap to roll ▸</span>
          </div>
          <div class="weapon-row" style="margin-top:3px">
            <span class="weapon-atk" id="haki-live-atk-${i}">+${a.attack}</span>
            <span class="weapon-dmg">${a.damage_str || a.damage || ''}</span>
          </div>
        </div>`).join('')}
      </div>

      <div class="card" id="haki-barding-card">
        <div class="card-title">Equipped Barding</div>
        <div id="haki-armor-grid"></div>
      </div>

    </div>

    <!-- ── Conditions + Diseases ── -->
    <div class="panel-cols">

      ${buildConditionCard('haki-cond-list','haki-cond-select','addHakiCondition','clearHakiConditions','Companion Conditions','','haki-cond-effects-summary')}

      <div class="card">
        <div class="card-title">Companion Diseases</div>
        <div id="haki-disease-list"></div>
        <div class="disease-add-row">
          <input class="text-in" id="haki-disease-name-input" type="text" placeholder="Disease name…" oninput="document.getElementById('haki-disease-add-btn').disabled=!this.value.trim()"/>
          <button class="btn gold" id="haki-disease-add-btn" ontouchstart="" onclick="hakiDiseaseAdd()" disabled>Add</button>
        </div>
      </div>

    </div>

    <!-- ── Skills + Special Abilities ── -->
    <div class="panel-cols">

      <div class="card">
        <div class="card-title">Skills</div>
        <div class="skill-grid" id="haki-skill-grid">${skillsHtml}</div>
      </div>

      <div class="card">
        <div class="card-title">Special Abilities</div>
        ${co.abilities.map(a => `
        <div class="ability-block">
          <div class="ability-name">${a.name}</div>
          <div class="ability-desc">${a.description}</div>
        </div>`).join('')}
      </div>

    </div>

  `;

  buildConditionSelect('haki-cond-select');
  syncHakiBardingCard();
}
