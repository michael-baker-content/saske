// ════════════════════════════════════════════
// PANELS — Skills
// ════════════════════════════════════════════

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
    tipParts.push(mathTerm(attrVal, attrName));
    if (s.item_bonus) tipParts.push(mathTerm(s.item_bonus, 'item'));
    const baseTip  = s.name + ' = ' + tipParts.join(' ') + ' = ' + fmtMod(s.modifier);
    const skillPen = (condPenalties?.skills?.[s.name] || 0);
    const effectiveMod = s.modifier - skillPen;
    const mod      = (effectiveMod >= 0 ? '+' : '') + effectiveMod;
    const style    = skillPen > 0 ? ' style="color:var(--red-b)"' : '';
    const tip      = skillPen > 0 ? baseTip + ` − ${skillPen} (condition)` : baseTip;
    return '<div class="skill-row has-tooltip" data-tooltip="' + tip + '">'
         + '<div class="skill-name-wrap">'
         + '<span>' + s.name + '</span>'
         + '<span class="skill-prof-badge">' + s.proficiency + '</span>'
         + '</div>'
         + '<span class="skill-mod"' + style + '>' + mod + '</span>'
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

        <!-- Row 1: Targets -->
        <div class="med-section-label">Targets <span class="med-section-sub">(max 4, Ward Medic)</span></div>
        <div class="med-party-grid med-party-centered" id="med-party-grid"></div>
        <div id="med-warning" style="display:none;font-size:11px;color:var(--red-b);background:rgba(176,48,48,0.12);border:1px solid var(--red);border-radius:3px;padding:5px 8px;margin-top:4px"></div>

        <hr class="med-divider"/>

        <!-- Row 2: Type -->
        <div class="med-row med-row-tier">
          <span class="med-label">Type</span>
          <div class="med-tier-btns">
            <button class="med-tier-btn" data-action="battle" ontouchstart="" onclick="medSetAction('battle')">Battle Medicine ◆</button>
            <button class="med-tier-btn" data-action="treat" ontouchstart="" onclick="medSetAction('treat')">Treat Wounds</button>
          </div>
        </div>

        <!-- Row 3: Tier -->
        <div class="med-row med-row-tier">
          <span class="med-label">Tier</span>
          <div class="med-tier-btns" id="med-tier-btns">
            <button class="med-tier-btn" data-tier="expert"    ontouchstart="" onclick="medSetTier('expert')">Expert 20</button>
            <button class="med-tier-btn" data-tier="master"    ontouchstart="" onclick="medSetTier('master')">Master 30</button>
            <button class="med-tier-btn" data-tier="legendary" ontouchstart="" onclick="medSetTier('legendary')">Legendary 40</button>
          </div>
        </div>

        <!-- Row 4: Assurance -->
        <div class="med-row">
          <span class="med-label">Assurance</span>
          <div class="med-assurance-row">
            <div class="tog" id="med-assurance-tog" ontouchstart="" onclick="medToggleAssurance()"><div class="tog-knob"></div></div>
            <span class="med-assurance-note" id="med-assurance-note">Auto-result: 24</span>
          </div>
        </div>

        <!-- Row 5: d20 Roll -->
        <div class="med-row" id="med-roll-row">
          <span class="med-label">d20 Roll</span>
          <div class="med-d20-wrap">
            <input class="med-roll-input" type="number" id="med-d20" placeholder="—" min="1" max="20" oninput="syncButtonStates?.()"/>
            <button class="med-d20-clear" ontouchstart="" onclick="clearMedD20()" title="Clear roll">×</button>
          </div>
          <span class="med-roll-label">+</span>
          <span class="med-mod-display" id="med-mod-display">${bm.check_modifier}</span>
          <span class="med-roll-label" id="med-total-display" style="color:var(--text3)"></span>
        </div>

        <!-- Row 6: Healing dice (populated after calculate) -->
        <div id="med-dice-area" style="display:none">
          <div class="med-section-label" id="med-dice-label">Healing Dice</div>
          <div id="med-dice-grid" class="med-dice-cell-grid"></div>
        </div>

        <!-- Row 7: Apply + Confirm + Clear -->
        <div class="med-action-row">
          <button class="med-tier-btn" id="med-apply-btn" style="display:none" ontouchstart="" onclick="medApplyDice()">Apply</button>
          <button class="med-calc-btn med-calc-inline" id="med-confirm-btn" ontouchstart="" onclick="medCalculate()">Confirm</button>
          <button class="med-tier-btn med-clear-btn" id="med-clear-btn" ontouchstart="" onclick="medReset()" title="Clear and reset">Clear</button>
        </div>

        <!-- Row 8: Result -->
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
          <div class="medic-row"><span>Check</span><span class="medic-val">Medicine ${bm.check_modifier}</span></div>
          <div class="medic-row" style="border-bottom:none;padding-bottom:2px"><span class="tier-header">EXPERT DC 20</span></div>
          <div class="medic-row"><span>Success</span><span class="medic-val">2d8 + 10 + C.B.</span></div>
          <div class="medic-row"><span>Crit Success</span><span class="medic-val">4d8 + 10 + C.B.</span></div>
          <div class="medic-row" style="border-bottom:none;padding-bottom:2px;margin-top:6px"><span class="tier-header">MASTER DC 30</span></div>
          <div class="medic-row"><span>Success</span><span class="medic-val">2d8 + 30 + C.B.</span></div>
          <div class="medic-row"><span>Crit Success</span><span class="medic-val">4d8 + 30 + C.B.</span></div>
          <div class="medic-row" style="border-bottom:none;padding-bottom:2px;margin-top:6px"><span class="tier-header">LEGENDARY DC 40</span></div>
          <div class="medic-row"><span>Success</span><span class="medic-val">2d8 + 50 + C.B.</span></div>
          <div class="medic-row"><span>Crit Success</span><span class="medic-val">4d8 + 50 + C.B.</span></div>
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

      <div class="tc-section">
        <div class="tc-header">
          <span class="card-title" style="margin:0">Treat Condition</span>
          <span class="tc-header-sub">Clumsy · Enfeebled · Sickened</span>
        </div>
        <div class="tc-note">Medicine +${bm.check_modifier} · Counteract check vs condition source DC · ◆◆ requires healer's tools</div>
        <div class="tc-grid" id="treat-cond-grid"></div>
      </div>
    </div>
  </div>
  `;
  buildMedicineTool();
  buildBMTracker();
  syncBMTracker();
  syncPartyConditions();
}
