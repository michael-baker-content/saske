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
            <div class="stat-box has-tooltip" data-tooltip="AC = 10 base + ${profBonus(C.defenses.ac_proficiency, C.meta.level)} prof (${C.defenses.ac_proficiency}) + ${Math.min(C.attributes.dex, C.equipped_armor?.dex_cap ?? 99)} DEX${C.attributes.dex > (C.equipped_armor?.dex_cap ?? 99) ? ' (capped)' : ''} + ${C.equipped_armor?.ac_bonus ?? 0} item">
              <div class="stat-val" id="live-ac">${C.defenses.ac}</div>
              <div class="stat-label">AC</div>
              <div class="stat-stars">${profToStars(C.defenses.ac_proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="Perception = ${profBonus(C.perception.proficiency, C.meta.level)} prof (${C.perception.proficiency}) + ${C.attributes[C.perception.key_attribute]} WIS = ${C.perception.modifier}">
              <div class="stat-val" id="live-perc">+${C.perception.modifier}</div>
              <div class="stat-label">Perception</div>
              <div class="stat-stars">${profToStars(C.perception.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="Class DC = 10 base + ${profBonus(C.defenses.class_dc_proficiency, C.meta.level)} prof (${C.defenses.class_dc_proficiency}) + ${C.attributes[C.defenses.class_dc_key_attribute]} WIS = ${C.defenses.class_dc}">
              <div class="stat-val">${C.defenses.class_dc}</div>
              <div class="stat-label">Class DC</div>
              <div class="stat-stars">${profToStars(C.defenses.class_dc_proficiency)}</div>
            </div>
          </div>
        </div>
        <div class="stats-saves-group">
          <div class="card-title">Saving Throws</div>
          <div class="stat-grid">
            <div class="stat-box has-tooltip" data-tooltip="Fortitude = ${profBonus(sv.fortitude.proficiency, C.meta.level)} prof (${sv.fortitude.proficiency}) + ${C.attributes[sv.fortitude.key_attribute]} CON = ${sv.fortitude.modifier}">
              <div class="stat-val" id="live-fort">+${sv.fortitude.modifier}</div>
              <div class="stat-label">Fortitude</div>
              <div class="stat-stars">${profToStars(sv.fortitude.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="Reflex = ${profBonus(sv.reflex.proficiency, C.meta.level)} prof (${sv.reflex.proficiency}) + ${C.attributes[sv.reflex.key_attribute]} DEX = ${sv.reflex.modifier}">
              <div class="stat-val" id="live-reflex">+${sv.reflex.modifier}</div>
              <div class="stat-label">Reflex</div>
              <div class="stat-stars">${profToStars(sv.reflex.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip" data-tooltip="Will = ${profBonus(sv.will.proficiency, C.meta.level)} prof (${sv.will.proficiency}) + ${C.attributes[sv.will.key_attribute]} WIS = ${sv.will.modifier}">
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
        <button class="btn sm danger" id="prey-clear" onclick="clearPrey()" style="display:none">Clear</button>
      </div>
      <div class="row" style="margin-bottom:6px">
        <input class="text-in" type="text" id="prey-input" placeholder="Name your prey…"/>
        <button class="btn gold" onclick="setPrey()">Hunt ◆</button>
      </div>
      <div class="prey-hint">+2 Perception (Seek) · +2 Survival (Track)<span class="prey-hint-line">Precision Edge +1d8 on 1st hit vs Prey</span></div>
    </div>

    <div class="card">
      <div class="card-title">Actions This Turn</div>
      <div class="row" style="margin-bottom:8px">
        <div class="action-pip" id="a1" onclick="toggleAction('a1')">◆</div>
        <div class="action-pip" id="a2" onclick="toggleAction('a2')">◆</div>
        <div class="action-pip" id="a3" onclick="toggleAction('a3')">◆</div>
        <div class="action-pip react" id="r1" onclick="toggleAction('r1')">↺</div>
        <button class="btn sm" onclick="resetActions()" style="margin-left:auto">Reset Turn</button>
      </div>
      <div class="row">
        <div class="tog green" id="warden-tog" onclick="toggleWarden()"><div class="tog-knob"></div></div>
        <span class="tog-label">Warden's Boon active — ally gains Precision until their next turn</span>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Weapons</div>
      ${C.weapons.map((w,i) => `
      <div class="weapon-card clickable" onclick="openModal(${i},'player')">
        <div class="weapon-row">
          <div class="weapon-name">${w.name}</div>
          <span style="font-size:10px;color:var(--text3)">tap to roll ▸</span>
        </div>
        <div class="weapon-row" style="margin-top:3px">
          <span class="weapon-atk" id="live-weapon-atk-${i}">+${w.attack}</span>
          <span class="weapon-dmg">${w.damage}</span>
        </div>
        <div class="weapon-traits">${w.traits.join(' · ')}</div>
        ${w.note ? `<div class="weapon-note-${w.note_type || 'neutral'}">${w.note}</div>` : ''}
      </div>`).join('')}
    </div>

    ${buildConditionCard('cond-list','cond-select','addCondition','clearConditions','Conditions','card-full')}
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
    tipParts.push((attrVal >= 0 ? '+' : '') + attrVal + ' ' + attrName);
    if (bardingOn && bp !== 0) tipParts.push(bp + ' barding');
    const tip   = s.name + ' = ' + tipParts.join(' + ') + ' = ' + (effMod >= 0 ? '+' : '') + effMod;
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
      <div class="comp-hp-controls">
        <input class="hp-in" type="number" id="haki-amt" placeholder="Amount" min="1"/>
        <button class="strip-btn dmg" ontouchstart="" onclick="changeHakiHP(-1)">− Damage</button>
        <button class="strip-btn heal" ontouchstart="" onclick="changeHakiHP(1)">+ Heal</button>
        <button class="strip-btn tmp-toggle" id="haki-tmp-toggle" ontouchstart="" onclick="toggleTmpStrip('haki')">Temp</button>
        <button class="strip-btn" ontouchstart="" onclick="setHakiHP(${co.hp_max})">⟳ Rest</button>
      </div>
      <!-- Temp HP row (hidden by default) -->
      <div class="tmp-strip" id="haki-tmp-strip" style="display:none">
        <span class="tmp-label">Temp HP</span>
        <input class="hp-in" type="number" id="haki-tmp-amt" placeholder="0" min="0" value="0" style="width:46px"/>
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
                return 'AC = 10 base + ' + acProf + ' prof (' + co.ac_proficiency + ') + ' + effDex + ' DEX' + (at.dex > (bard?.dex_cap??99) ? ' (capped)' : '') + ' + ' + (bard?.ac_bonus??0) + ' item';
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
              data-tooltip="Perception = ${profBonus(co.perception.proficiency, C.meta.level)} prof (${co.perception.proficiency}) + ${fmtMod(at[co.perception.key_attribute])} WIS = ${fmtMod(co.perception.modifier)}">
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
              data-tooltip="Fortitude = ${(C.meta.level + (PROF_MAP[sv.fortitude.proficiency]||0))} prof (${sv.fortitude.proficiency}) + ${fmtMod(at.con)} CON = ${fmtMod(sv.fortitude.modifier)}">
              <div class="stat-val" id="haki-live-fort">${fmtMod(sv.fortitude.modifier)}</div>
              <div class="stat-label">Fortitude</div>
              <div class="stat-stars">${profToStars(sv.fortitude.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip"
              data-tooltip="Reflex = ${(C.meta.level + (PROF_MAP[sv.reflex.proficiency]||0))} prof (${sv.reflex.proficiency}) + ${fmtMod(at.dex)} DEX = ${fmtMod(sv.reflex.modifier)}">
              <div class="stat-val" id="haki-live-reflex">${fmtMod(sv.reflex.modifier)}</div>
              <div class="stat-label">Reflex</div>
              <div class="stat-stars">${profToStars(sv.reflex.proficiency)}</div>
            </div>
            <div class="stat-box has-tooltip"
              data-tooltip="Will = ${(C.meta.level + (PROF_MAP[sv.will.proficiency]||0))} prof (${sv.will.proficiency}) + ${fmtMod(at.wis)} WIS = ${fmtMod(sv.will.modifier)}">
              <div class="stat-val" id="haki-live-will">${fmtMod(sv.will.modifier)}</div>
              <div class="stat-label">Will</div>
              <div class="stat-stars">${profToStars(sv.will.proficiency)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Attacks + Skills ── -->
    <div class="panel-cols">

      <div class="card">
        <div class="card-title">Attacks</div>
        ${co.attacks.map((a,i) => `
        <div class="weapon-card clickable" onclick="openModal(${i},'companion')">
          <div class="weapon-row">
            <div class="weapon-name">${a.name}${a.traits?.length ? ' <span style="font-size:10px;color:var(--text3)">(' + a.traits.join(', ') + ')</span>' : ''}</div>
            <span style="font-size:10px;color:var(--text3)">tap to roll ▸</span>
          </div>
          <div class="weapon-row" style="margin-top:3px">
            <span class="weapon-atk" id="haki-live-atk-${i}">+${a.attack}</span>
            <span class="weapon-dmg">${a.damage}</span>
          </div>
        </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-title">Skills</div>
        <div class="skill-grid" id="haki-skill-grid">${skillsHtml}</div>
      </div>

    </div>

    <!-- ── Equipped Barding ── -->
    <div class="card" id="haki-barding-card">
      <div class="card-title">Equipped Barding</div>
      <div id="haki-armor-grid"></div>
    </div>

    <!-- ── Conditions + Special Abilities ── -->
    <div class="panel-cols">
      ${buildConditionCard('haki-cond-list','haki-cond-select','addHakiCondition','clearHakiConditions','Companion Conditions','','haki-cond-effects-summary')}

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

// ── SKILLS panel ──────────────────────────
function buildSkills() {
  const el = document.getElementById('p-skills');
  const bm = C.battle_medicine;
  const PROF_MAP = {Untrained:0, Trained:2, Expert:4, Master:6, Legendary:8};
  const skillsHtml = C.skills.map(s => {
    const attrVal  = C.attributes[s.key_attribute] ?? 0;
    const attrName = (s.key_attribute || '').toUpperCase();
    const pb       = PROF_MAP[s.proficiency] ?? 0;
    const profNum  = pb === 0 ? 0 : C.meta.level + pb;
    const tipParts = [];
    if (pb > 0) tipParts.push(profNum + ' prof (' + s.proficiency + ')');
    tipParts.push((attrVal >= 0 ? '+' : '') + attrVal + ' ' + attrName);
    if (s.item_bonus) tipParts.push('+' + s.item_bonus + ' item');
    const tip  = s.name + ' = ' + tipParts.join(' + ') + ' = ' + (s.modifier >= 0 ? '+' : '') + s.modifier;
    const mod  = (s.modifier >= 0 ? '+' : '') + s.modifier;
    return '<div class="skill-row has-tooltip" data-tooltip="' + tip + '">'
         + '<div class="skill-name-wrap">'
         + '<span>' + s.name + '</span>'
         + '<span class="skill-prof-badge">' + s.proficiency + '</span>'
         + '</div>'
         + '<span class="skill-mod">' + mod + '</span>'
         + '</div>';
  }).join('');

  el.innerHTML = `
  <div class="panel-cols">

    <div class="card card-full">
      <div class="card-title">Skills</div>
      <div class="skill-grid skill-grid-3col">${skillsHtml}</div>
    </div>

    <div class="card card-full">
      <div class="card-title">Medicine Tool</div>
      <div class="med-tool">
        <div style="font-size:10px;font-weight:700;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px">Targets — tap to select <span style="font-weight:400;text-transform:none;letter-spacing:0">(max 4, Ward Medic)</span></div>
        <div class="med-party-grid med-party-centered" id="med-party-grid"></div>
        <div id="med-warning" style="display:none;font-size:11px;color:var(--red-b);background:rgba(176,48,48,0.12);border:1px solid var(--red);border-radius:3px;padding:5px 8px;margin-top:6px"></div>
        <hr class="med-divider"/>
        <div class="med-row med-row-tier">
          <span class="med-label">Tier</span>
          <div class="med-tier-btns" id="med-tier-btns">
            <button class="med-tier-btn active" data-tier="expert"    onclick="medSetTier('expert')">Expert 20</button>
            <button class="med-tier-btn" data-tier="master"    onclick="medSetTier('master')">Master 30</button>
            <button class="med-tier-btn" data-tier="legendary" onclick="medSetTier('legendary')">Legendary 40</button>
          </div>
        </div>
        <div class="med-two-col">
          <div class="med-row">
            <span class="med-label">Assurance</span>
            <div class="med-assurance-row">
              <div class="tog" id="med-assurance-tog" onclick="medToggleAssurance()"><div class="tog-knob"></div></div>
              <span class="med-assurance-note" id="med-assurance-note">Auto-result: 24</span>
            </div>
          </div>
          <div class="med-row" id="med-roll-row">
            <span class="med-label">d20 Roll</span>
            <div class="med-d20-wrap">
              <input class="med-roll-input" type="number" id="med-d20" placeholder="—" min="1" max="20"/>
              <button class="med-d20-clear" onclick="clearMedD20()" title="Clear roll">×</button>
            </div>
            <span class="med-roll-label">+</span>
            <span class="med-mod-display" id="med-mod-display">+19</span>
            <span class="med-roll-label" id="med-total-display" style="color:var(--text3)"></span>
          </div>
        </div>
        <div class="med-dice-inputs" id="med-dice-area" style="display:none"></div>
        <div class="med-row med-row-tier">
          <span class="med-label">Action</span>
          <div class="med-tier-btns">
            <button class="med-tier-btn active" data-action="battle" onclick="medSetAction('battle')">Battle Medicine ◆</button>
            <button class="med-tier-btn" data-action="treat" onclick="medSetAction('treat')">Treat Wounds</button>
            <button class="med-calc-btn med-calc-inline" onclick="medCalculate()">Resolve</button>
          </div>
        </div>
        <div class="med-result-area" id="med-result-area">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="med-result-outcome" id="med-outcome-badge">—</span>
            <span style="font-size:11px;color:var(--text3)" id="med-roll-summary"></span>
          </div>
          <div class="med-target-results" id="med-target-results"></div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px" id="med-footer-note"></div>
        </div>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Battle Medicine Quick Ref</div>
      <div class="bm-quick-ref-grid">
        <div>
          <div class="medic-row"><span>Check</span><span class="medic-val">Medicine +${bm.check_modifier}</span></div>
          <div class="medic-row" style="border-bottom:none;padding-bottom:2px"><span style="font-size:10px;font-weight:700;color:var(--blue);letter-spacing:0.06em">EXPERT DC 20</span></div>
          <div class="medic-row"><span>Success</span><span class="medic-val">2d8+15 HP</span></div>
          <div class="medic-row"><span>Crit Success</span><span class="medic-val">4d8+15 HP</span></div>
          <div class="medic-row" style="border-bottom:none;padding-bottom:2px;margin-top:6px"><span style="font-size:10px;font-weight:700;color:var(--blue);letter-spacing:0.06em">MASTER DC 30</span></div>
          <div class="medic-row"><span>Success</span><span class="medic-val">2d8+40 HP</span></div>
          <div class="medic-row"><span>Crit Success</span><span class="medic-val">4d8+40 HP</span></div>
          <div class="medic-row"><span style="color:var(--text3);font-size:11px">+10 tier · +10 Medic Ded. · +8 Robust (self)</span></div>
        </div>
        <div>
          <div class="medic-row" style="border-top:1px solid var(--border);padding-top:6px"><span>Crit Failure</span><span class="medic-val" style="color:var(--red-b)">1d8 dmg</span></div>
          <div class="medic-row"><span>Cooldown</span><span class="medic-val" style="font-size:11px;color:var(--text2)">${bm.cooldown}</span></div>
          <div class="medic-row"><span>Ward Medic</span><span class="medic-val">up to ${bm.max_targets} targets</span></div>
          <div class="medic-row"><span>Continual Recovery</span><span class="medic-val" style="font-size:11px;color:var(--text2)">${bm.treat_wounds_time}</span></div>
          <div class="medic-row" style="border:none"><span style="color:var(--text3);font-size:11px">Assurance = 24. Meets DC 20; does not meet DC 30.</span></div>
        </div>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Battle Medicine Cooldowns</div>
      <div class="bm-tracker-toggle-row">
        <span style="font-size:11px;color:var(--text3)">Track members healed in last 60 min</span>
        <button class="bm-all-btn" onclick="bmTickAll()">−10 min (all)</button>
      </div>
      <div class="bm-tracker-grid" id="bm-tracker-grid"></div>
      <div class="bm-add-row" id="bm-add-row"></div>
    </div>
  </div>
  `;
  buildMedicineTool();
  buildBMTracker();
  syncBMTracker();
}

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
        <button class="btn" onclick="saveNotes()">Save</button>
        <button class="btn danger" onclick="clearNotes()">Clear</button>
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
          <button class="btn session-export-btn" onclick="exportSessionReport()">
            <span class="session-btn-icon">📋</span>
            <span class="session-btn-label">Copy Report</span>
            <span class="session-btn-sub">Markdown to clipboard</span>
          </button>
          <button class="btn session-reset-btn" onclick="confirmResetSession()">
            <span class="session-btn-icon">↺</span>
            <span class="session-btn-label">Reset Session</span>
            <span class="session-btn-sub">Revert to defaults</span>
          </button>
        </div>
        <div id="session-feedback" class="session-feedback" style="display:none"></div>
        <div id="session-confirm" class="session-confirm" style="display:none">
          <span class="session-confirm-msg">⚠ This will clear all session data including HP, conditions, notes, and inventory changes. Are you sure?</span>
          <div class="session-confirm-btns">
            <button class="btn danger" onclick="executeReset()">Yes, Reset</button>
            <button class="btn" onclick="cancelReset()">Cancel</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  `;
  document.getElementById('notes').addEventListener('input', () => { S.notes = document.getElementById('notes').value; saveState(); });
}

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
            <input class="inv-input" id="inv-new-name" type="text" placeholder="Item name"/>
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
        <button class="btn gold" onclick="invAddItem()" style="margin-top:8px;width:100%">+ Add Item</button>
      </div>
    </div>

    <div class="card card-full">
      <div class="card-title">Tracked Resources</div>
      <div id="inv-qty-counters"></div>
    </div>
  </div>
  `;
  syncInventory();
  syncArmor();

  // Enter on last input field triggers add
  ['inv-new-name','inv-new-bulk','inv-new-qty','inv-new-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') invAddItem(); });
  });
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
    <div class="armor-stats">
      <div class="armor-stat-group">
        <div class="armor-tile has-tooltip" data-tooltip="AC = 10 base + ${acProf} prof (${C.defenses.ac_proficiency}) + ${effDex} DEX${dex > arm.dex_cap ? ' (capped from +' + dex + ')' : ''} + ${arm.ac_bonus} item bonus">
          <div class="stat-val" style="font-size:20px">${computedAC}</div>
          <div class="stat-label">AC</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Item bonus to AC granted by this armor">
          <div class="stat-val" style="font-size:20px">+${arm.ac_bonus}</div>
          <div class="stat-label">Item Bonus</div>
        </div>
        <div class="armor-tile has-tooltip" data-tooltip="Maximum DEX bonus that can be applied to AC${dex > arm.dex_cap ? '. Your DEX +' + dex + ' is capped at +' + arm.dex_cap : '. Your DEX +' + dex + ' fits within cap'}">
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

  // ── Inventory list ──
  const listEl = document.getElementById('inv-list');
  if (listEl) {
    if (!S.inventory.length) {
      listEl.innerHTML = '<div class="inv-empty">No items in inventory</div>';
    } else {
      listEl.innerHTML = S.inventory.map((item, idx) => `
        <div class="inv-row inv-row-edit">
          <div class="inv-row-main">
            <span class="inv-item-name">${item.name}${item.quantity != null ? ` <span class="inv-qty-badge">×${item.quantity - item.used}</span><span style="font-size:10px;color:var(--text3)"> of ${item.quantity}</span>` : ''}</span>
            ${item.notes ? `<span class="inv-item-notes">${item.notes}</span>` : ''}
          </div>
          <div class="inv-row-right">
            <span class="inv-bulk">${item.bulk}</span>
            <button class="inv-del-btn" onclick="invRemoveItem(${idx})" title="Remove item">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  // ── Tracked quantity counters (items with a quantity) ──
  const countersEl = document.getElementById('inv-qty-counters');
  if (countersEl) {
    const qtyItems = S.inventory.filter(i => i.quantity != null);
    if (!qtyItems.length) {
      countersEl.innerHTML = '<div style="font-size:12px;color:var(--text3);font-style:italic;padding:4px 0">No quantity-tracked items</div>';
    } else {
      countersEl.innerHTML = qtyItems.map(item => {
        const idx = S.inventory.indexOf(item);
        const remaining = item.quantity - item.used;
        return `<div class="counter-row">
          <div>
            <span>${item.name}</span>
            <span style="font-size:10px;color:var(--text3)"> (${remaining} of ${item.quantity} remaining)</span>
          </div>
          <div class="counter-controls">
            <button class="strip-btn" ontouchstart="" onclick="invUseItem(${idx}, 1)">− Use</button>
            <button class="strip-btn heal" ontouchstart="" onclick="invUseItem(${idx}, -1)">+ Return</button>
            <button class="strip-btn" ontouchstart="" onclick="invResetItem(${idx})" style="font-size:10px">Reset</button>
          </div>
        </div>`;
      }).join('');
    }
  }
}

function invAddItem() {
  const name  = document.getElementById('inv-new-name')?.value.trim();
  const bulk  = document.getElementById('inv-new-bulk')?.value.trim();
  const qtyRaw = document.getElementById('inv-new-qty')?.value.trim();
  const notes = document.getElementById('inv-new-notes')?.value.trim();

  if (!name) { document.getElementById('inv-new-name').focus(); return; }
  if (!bulk) { document.getElementById('inv-new-bulk').focus(); return; }

  const quantity = qtyRaw ? parseInt(qtyRaw) : null;
  S.inventory.push({ name, bulk, quantity, notes: notes || '', used: 0 });
  saveState();

  // Clear inputs
  ['inv-new-name','inv-new-bulk','inv-new-qty','inv-new-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('inv-new-name')?.focus();
  syncInventory();
}

function invRemoveItem(idx) {
  S.inventory.splice(idx, 1);
  saveState();
  syncInventory();
}

function invUseItem(idx, delta) {
  const item = S.inventory[idx];
  if (!item) return;
  item.used = Math.max(0, Math.min(item.quantity, item.used + delta));
  saveState();
  syncInventory();
}

function invResetItem(idx) {
  const item = S.inventory[idx];
  if (!item) return;
  item.used = 0;
  saveState();
  syncInventory();
}

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
      <button class="btn sm" onclick="${addFn}()">Add</button>
      <button class="btn sm danger" onclick="${clearFn}()">Clear</button>
    </div>
  </div>`;
}

function buildConditionSelect(id) {
  // already built via innerHTML; nothing extra needed
}
