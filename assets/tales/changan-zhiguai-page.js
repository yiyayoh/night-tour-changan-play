(() => {
  'use strict';
  const taleConfig = window.CHANGAN_TALE_CONFIG || {};
  const STORY_ID = taleConfig.id || 'borrowed-lantern';
  const isHuapi = STORY_ID === 'painted-skin';
  const STORAGE_KEY = taleConfig.storageKey || `changan:tale:${STORY_ID}:v1`;
  const STORY_URL = taleConfig.storyUrl || '/night-tour-changan-play/assets/tales/borrowed-lantern.json';
  const returnUrl = taleConfig.returnUrl || '/night-tour-changan-play/?tale-return=borrowed-lantern';
  const finalStageId = taleConfig.finalStageId || 'boat';
  const puzzleTargetId = taleConfig.puzzleTargetId || 'three-lights';
  const puzzleSolution = taleConfig.puzzleSolution || ['bridge', 'boat', 'shore'];
  const puzzleMode = taleConfig.puzzleMode || 'ordered';
  const puzzleRounds = taleConfig.puzzleRounds || [];
  const $ = id => document.getElementById(id);
  const frame = $('taleScene');
  const dialogs = Array.from(document.querySelectorAll('dialog'));
  const portraits = taleConfig.portraits || { 'shen-dengniang': '/night-tour-changan-play/assets/tales/shen-dengniang.png', 'pei-zhao': '/night-tour-changan-play/assets/tales/pei-zhao.png' };
  const safeStagePoints = taleConfig.safeStagePoints || { bridge: { x: 0, z: 224, yaw: 0, pitch: .045 }, shoreside: { x: 18, z: 224, yaw: 0, pitch: .045 }, boat: { x: 40, z: 230, yaw: 0, pitch: .045 } };
  let story = null;
  let state = null;
  let live = false;
  let ready = false;
  let scene = { ready: false, nearby: [] };
  let lastSignature = '';
  let lastSavedPlayer = 0;
  let storageAvailable = true;
  let saveMessage = '';
  let pollTimer = null;
  let guidedTarget = '';
  let guideFeedback = '';
  const dialogOpeners = new WeakMap();
  let modalOnClose = null;
  let loadFailed = false;
  let storyLoading = false;
  let sceneReloading = false;
  let sceneFramePending = false;
  let sceneWaitTimer = null;
  let lastSceneReadyAt = Date.now();
  const sound = { wanted: false, context: null, output: null, blocked: false, generation: 0 };

  function wording(key, fallback) {
    return taleConfig.text && typeof taleConfig.text[key] === 'string' ? taleConfig.text[key] : fallback;
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }
  function renderSound() {
    const playing = sound.wanted && sound.context && sound.context.state === 'running';
    const label = sound.wanted ? playing ? wording('audioOff', '收起水声') : '点此续听' : wording('audioOn', '听水声');
    $('toggleTaleAudio').textContent = label;
    $('openingTaleAudio').textContent = sound.wanted ? playing ? wording('audioOff', '收起水声') : wording('audioResume', '点此续听水声') : wording('audioOpening', '听一段水声');
    [$('toggleTaleAudio'), $('openingTaleAudio')].forEach(element => element.setAttribute('aria-pressed', String(Boolean(playing))));
  }
  function createSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('audio-unavailable');
    const context = new AudioContext();
    const output = context.createGain();
    const doorSound = taleConfig.sound === 'door';
    const paperSound = taleConfig.sound === 'paper';
    output.gain.value = doorSound ? .22 : paperSound ? .2 : .26;
    output.connect(context.destination);
    const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = noise.getChannelData(0);
    let brown = 0;
    for (let index = 0; index < samples.length; index++) {
      brown = (brown + (Math.random() * 2 - 1) * .035) / 1.035;
      samples[index] = brown * 3.8;
    }
    const source = context.createBufferSource();
    source.buffer = noise; source.loop = true;
    const wind = context.createBiquadFilter();
    wind.type = 'lowpass'; wind.frequency.value = doorSound ? 190 : paperSound ? 260 : 370; wind.Q.value = .45;
    const windGain = context.createGain(); windGain.gain.value = .19;
    source.connect(wind); wind.connect(windGain); windGain.connect(output);
    const water = context.createBiquadFilter();
    water.type = 'bandpass'; water.frequency.value = doorSound ? 470 : paperSound ? 1800 : 1100; water.Q.value = doorSound ? 2.1 : paperSound ? .9 : .65;
    const waterGain = context.createGain(); waterGain.gain.value = doorSound ? .045 : paperSound ? .055 : .12;
    source.connect(water); water.connect(waterGain); waterGain.connect(output);
    source.start();
    sound.context = context; sound.output = output;
    context.addEventListener('statechange', renderSound);
  }
  async function toggleSound() {
    const playing = sound.wanted && sound.context && sound.context.state === 'running';
    if (playing) {
      sound.wanted = false; sound.generation += 1;
      try { await sound.context.suspend(); } catch (_) {}
      renderSound(); return;
    }
    sound.wanted = true; sound.blocked = false;
    const generation = ++sound.generation;
    try {
      if (!sound.context || sound.context.state === 'closed') createSound();
      await sound.context.resume();
      if (generation !== sound.generation || !sound.wanted || document.hidden) await sound.context.suspend();
    } catch (_) {
      sound.blocked = true;
      setSceneStatus(wording('audioUnavailable', '这台浏览器暂未响起水声，故事仍可完整游玩。可再点一次续听。'));
    }
    renderSound();
  }
  function suspendSound() {
    sound.generation += 1;
    if (sound.context && sound.context.state === 'running') sound.context.suspend().catch(() => {});
    renderSound();
  }
  async function resumeChosenSound() {
    if (!sound.wanted || !sound.context || document.hidden || sound.context.state === 'closed') return;
    const generation = ++sound.generation;
    try {
      await sound.context.resume();
      if (generation !== sound.generation || !sound.wanted || document.hidden) await sound.context.suspend();
    } catch (_) { sound.blocked = true; }
    renderSound();
  }
  function ringBell() {
    const context = sound.context;
    if (!sound.wanted || !context || context.state !== 'running' || document.hidden) return;
    const bell = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const doorSound = taleConfig.sound === 'door';
    const paperSound = taleConfig.sound === 'paper';
    bell.type = doorSound || paperSound ? 'triangle' : 'sine'; bell.frequency.setValueAtTime(doorSound ? 176 : paperSound ? 392 : 659.25, now);
    if (doorSound) bell.frequency.exponentialRampToValueAtTime(64, now + .19);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(doorSound ? .055 : paperSound ? .035 : .07, now + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + (doorSound ? .24 : paperSound ? .5 : 1.5));
    bell.connect(gain); gain.connect(sound.output);
    bell.start(now); bell.stop(now + (doorSound ? .28 : paperSound ? .55 : 1.6));
    bell.addEventListener('ended', () => { bell.disconnect(); gain.disconnect(); }, { once: true });
  }
  function button(label, callback, className = '') {
    const element = node('button', className, label);
    element.type = 'button';
    element.addEventListener('click', callback);
    return element;
  }
  function paragraphs(container, values) {
    const lines = Array.isArray(values) ? values : values ? [values] : [];
    lines.forEach(value => container.append(node('p', '', value)));
  }
  function currentStage() { return story.stages[state.stageIndex]; }
  function clueById(id) { return story.clues.find(item => item.id === id); }
  function characterById(id) { return story.characters.find(item => item.id === id); }
  function allClues(stage) { return stage.clueIds.every(id => state.clues.includes(id)); }
  function dialogueDone(stage) { return !stage.dialogue || stage.dialogue.required === false || Boolean(state.dialogues[stage.id]); }
  function stageComplete(stage) { return allClues(stage) && dialogueDone(stage); }
  function puzzleSolved() { return state.lamps.join('|') === story.puzzle.solution.join('|'); }
  function childCall(name, ...args) {
    try {
      const fn = frame.contentWindow && frame.contentWindow[name];
      return typeof fn === 'function' ? fn(...args) : undefined;
    } catch (_) { return undefined; }
  }
  function isModalOpen() { return dialogs.some(dialog => dialog.open); }
  function pauseScene() { childCall('changanTaleScenePause', !live || document.hidden || isModalOpen()); }
  function payload(includePlayer = false) {
    const result = { stage: currentStage().id, clues: state.clues.slice(), lamps: state.lamps.slice(), ending: state.ending };
    if (isHuapi) result.investigation = { observations: state.huapiInvestigation.observations.slice(), compared: state.huapiInvestigation.compared };
    if (includePlayer && state.player) result.player = state.player;
    return result;
  }
  function syncScene(restorePlayer = false) { if (ready && live && story) childCall('changanTaleSceneSet', payload(restorePlayer)); }
  function setSceneStatus(message) { $('sceneStatus').textContent = message; }
  function setSaveMessage(message) { saveMessage = message; $('saveStatus').textContent = message; }
  function freshState(previous = null) {
    const next = { version: 1, storyId: STORY_ID, started: false, stageIndex: 0, clues: [], dialogues: {}, lamps: [], ending: null, seenEndings: previous ? previous.seenEndings.slice() : [], revealed: previous ? previous.revealed.slice() : [], player: null, updatedAt: '' };
    if (isHuapi) next.huapiInvestigation = { version: 1, observations: [], compared: false };
    return next;
  }
  function safePlayer(value) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.z) || Math.abs(value.x) > 1000 || Math.abs(value.z) > 1000) return null;
    const result = { x: value.x, z: value.z };
    if (Number.isFinite(value.yaw)) result.yaw = value.yaw;
    if (Number.isFinite(value.pitch)) result.pitch = value.pitch;
    return result;
  }
  function readState() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {
      storageAvailable = false;
      setSaveMessage('本机暂时不能保存，仍可完整游玩；请在离开前走完这一夜。');
      return freshState();
    }
    if (!raw) return freshState();
    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || data.storyId !== story.id || typeof data.started !== 'boolean' || !Number.isInteger(data.stageIndex) || data.stageIndex < 0 || data.stageIndex >= story.stages.length || !Array.isArray(data.clues) || !data.dialogues || typeof data.dialogues !== 'object' || Array.isArray(data.dialogues) || !Array.isArray(data.lamps)) throw new Error('save-shape');
      const next = freshState();
      next.started = data.started;
      next.stageIndex = data.stageIndex;
      next.clues = [...new Set(data.clues.filter(id => story.clues.some(clue => clue.id === id)))];
      story.stages.forEach(stage => {
        if (stage.dialogue && stage.dialogue.choices.some(choice => choice.id === data.dialogues[stage.id])) next.dialogues[stage.id] = data.dialogues[stage.id];
      });
      next.seenEndings = Array.isArray(data.seenEndings) ? [...new Set(data.seenEndings.filter(id => story.endings.some(ending => ending.id === id)))] : [];
      next.revealed = Array.isArray(data.revealed) ? [...new Set(data.revealed.filter(id => story.characters.some(person => person.id === id)))] : [];
      const validPrefix = data.lamps.length <= story.puzzle.solution.length && data.lamps.every((id, index) => id === story.puzzle.solution[index]);
      next.lamps = validPrefix ? data.lamps.slice() : [];
      next.player = safePlayer(data.player);
      let rolledBack = false;
      for (let index = 0; index < next.stageIndex; index++) {
        const stage = story.stages[index];
        const complete = stage.clueIds.every(id => next.clues.includes(id)) && (!stage.dialogue || stage.dialogue.required === false || Boolean(next.dialogues[stage.id]));
        if (!complete) { next.stageIndex = index; next.player = null; rolledBack = true; break; }
      }
      const allowedStages = story.stages.slice(0, next.stageIndex + 1).map(stage => stage.id);
      next.clues = next.clues.filter(id => allowedStages.includes(clueById(id).stageId));
      Object.keys(next.dialogues).forEach(id => { if (!allowedStages.includes(id)) delete next.dialogues[id]; });
      const finalStage = story.stages[story.stages.length - 1];
      const finalComplete = finalStage.clueIds.every(id => next.clues.includes(id)) && (!finalStage.dialogue || finalStage.dialogue.required === false || Boolean(next.dialogues[finalStage.id]));
      if (next.stageIndex < story.stages.length - 1 || !story.puzzle.requiresClues.every(id => next.clues.includes(id)) || !finalComplete) next.lamps = [];
      next.ending = next.lamps.join('|') === story.puzzle.solution.join('|') && story.endings.some(ending => ending.id === data.ending) ? data.ending : null;
      if (isHuapi) {
        // Existing v1 evidence is authoritative: never retract a completed
        // chapter or ending merely because the new investigation did not exist.
        if (next.clues.includes('peeling-screen')) next.huapiInvestigation = { version: 1, observations: ['ink', 'shadow'], compared: true };
        else if (next.started && next.stageIndex >= 1 && data.huapiInvestigation && data.huapiInvestigation.version === 1 && Array.isArray(data.huapiInvestigation.observations)) {
          next.huapiInvestigation.observations = ['ink', 'shadow'].filter(id => data.huapiInvestigation.observations.includes(id));
          // A bare compared flag never manufactures evidence. Re-open the
          // comparison if the actual clue was not saved with it.
        }
      }
      if (rolledBack) setSaveMessage('上次记录有一处未写全，已从最近完整的一幕接起。');
      else if (next.started) setSaveMessage(next.ending ? '这一夜已经收束，可回看结尾，或另起一夜。' : `本机留着「${story.stages[next.stageIndex].title}」，可接着走。`);
      return next;
    } catch (_) {
      setSaveMessage(wording('saveCorrupt', '旧记录未能读全，这次可重新提灯；城中原有进度不受影响。'));
      return freshState();
    }
  }
  function save() {
    if (!state) return;
    state.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined' && window.ChanganLanternWalk) window.ChanganLanternWalk.rememberTale(state);
    if (!storageAvailable) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {
      storageAvailable = false;
      setSaveMessage(wording('saveUnavailable', '本机暂时不能保存，当前故事仍可继续；离开或刷新后可能需要重新提灯。'));
      if (live) setSceneStatus('本机未能保存，当前故事仍可继续。');
    }
  }
  function noteReveal(stageId, reason = 'dialogue') {
    story.characters.forEach(person => {
      const unlock = person.card.unlockPuzzle ? reason === 'puzzle' : person.card.unlockStage === stageId;
      if (unlock && !state.revealed.includes(person.id)) state.revealed.push(person.id);
    });
  }
  function modal(dialogId, opener) {
    const dialog = $(dialogId);
    if (!dialog.open) {
      dialogOpeners.set(dialog, opener || document.activeElement);
      dialog.showModal();
    }
    pauseScene();
    const title = dialog.querySelector('[tabindex="-1"]');
    if (title) title.focus({ preventScroll: true });
  }
  function closeDialog(dialogId) { const dialog = $(dialogId); if (dialog.open) dialog.close(); }
  function closeAll() { dialogs.forEach(dialog => { if (dialog.open) dialog.close(); }); }
  function focusScene() {
    if (!live || isModalOpen()) return;
    pauseScene();
    try { frame.contentWindow.focus(); frame.focus(); } catch (_) { frame.focus(); }
  }
  function showReading(kind, title, lines, actions, options = {}) {
    const dialog = $('readingDialog');
    if (dialog.open) { modalOnClose = null; dialog.close(); }
    $('readingKind').textContent = kind;
    $('readingTitle').textContent = title;
    $('readingBody').replaceChildren();
    paragraphs($('readingBody'), lines);
    if (options.quote) $('readingBody').append(node('blockquote', '', options.quote));
    $('readingActions').replaceChildren();
    actions.forEach(action => {
      if (action.href) {
        const link = node('a', 'reading-link text-button', action.label);
        link.href = action.href;
        if (action.run) link.addEventListener('click', action.run);
        $('readingActions').append(link);
      } else $('readingActions').append(button(action.label, action.run, action.primary ? 'primary' : action.secondary ? 'text-button' : ''));
    });
    if (options.note) $('readingBody').append(node('p', 'dialog-note', options.note));
    modalOnClose = options.onClose || null;
    modal('readingDialog', options.opener);
  }
  function nearby(targetId) {
    if (!ready || !live || !targetId) return false;
    return Array.isArray(scene.nearby) && scene.nearby.some(item => typeof item === 'string' ? item === targetId : item && item.id === targetId);
  }
  function guide(targetId) {
    if (!ready || !live) { setSceneStatus(wording('sceneWaiting', '曲江夜色尚在展开，请稍候片刻。')); return; }
    const result = childCall('changanTaleSceneGuide', targetId);
    if (result === false || result && result.ok === false) {
      guideFeedback = wording('guideUnavailable', '这段灯路暂未接通，可沿岸靠近标记。');
      setSceneStatus(guideFeedback);
      return;
    }
    guidedTarget = targetId;
    guideFeedback = wording('guideWalking', '循脚下灯路亲自走近；电脑用 W A S D，手机推左下摇杆。');
    setSceneStatus(guideFeedback);
    focusScene();
  }
  function huapiView(id) { return story.investigation.views.find(view => view.id === id); }
  function huapiWindow() { return isHuapi && story && state && live && currentStage().id === 'window'; }
  function huapiObserved(id) { return state.huapiInvestigation.observations.includes(id); }
  function huapiNearWindow() {
    return nearby('peeling-screen') || Boolean(scene.investigation && Array.isArray(scene.investigation.views) && scene.investigation.views.some(view => view.near));
  }
  function recordHuapiObservation(id) {
    if (!huapiObserved(id)) { state.huapiInvestigation.observations.push(id); save(); syncScene(); ringBell(); }
  }
  function observeHuapi(id, opener) {
    if (!huapiWindow() || !ready || !['ink', 'shadow'].includes(id)) return;
    const view = huapiView(id);
    if (huapiObserved(id)) {
      showReading('窗下察证 · 已记下所见', view.title, [view.description], [{ label: '合上所见，继续察看', primary: true, run: () => closeDialog('readingDialog') }], { opener });
      return;
    }
    const result = childCall('changanTaleSceneInvestigate', id);
    const current = childCall('changanTaleSceneState'); if (current && current.ready) scene = current;
    if (!result || !result.ok || result.observation !== id) {
      if (result && result.reason === 'facing') {
        setSceneStatus('已到观察处。稍转视线，看向窗内画面；也可点「文字察看」核对同样的所见。');
        focusScene();
      } else guide(view.targetId);
      renderActions();
      return;
    }
    recordHuapiObservation(id); renderActions();
    showReading('窗下察证 · 先记所见', view.title, [view.description], [{ label: state.huapiInvestigation.observations.length === 2 ? '两处已记，合上比对' : '记下这一处，再换位置', primary: true, run: () => closeDialog('readingDialog') }], { opener, note: '观察本身还不是结论。两处看清后，再比对它们能说明什么。' });
  }
  function textHuapiObservations(opener) {
    if (!huapiWindow()) return;
    if (!huapiNearWindow()) {
      closeDialog('readingDialog'); guide('huapi-view-ink');
      setSceneStatus('先循引路到窗前；到达后可用文字核对同样的两处所见。');
      return;
    }
    const details = story.investigation.views.map(view => `${view.title}：${view.description}`);
    showReading('窗下察证 · 文字察看', '沿文字核对两处所见', details, [{ label: '两处已核对，开始比对', primary: true, run: () => {
      if (!huapiWindow() || !huapiNearWindow()) { closeDialog('readingDialog'); guide('huapi-view-ink'); return; }
      recordHuapiObservation('ink'); recordHuapiObservation('shadow'); renderActions(); openHuapiComparison(opener);
    } }, { label: '先回到窗外', run: () => closeDialog('readingDialog') }], { opener, note: '与现场观察为同等路径，仍须完成同一道证据比对。不依声音、颜色或精确转向。此处描述与察证玩法为本作互动设计。' });
    $('readingActions').children[0].id = 'huapiRecordTextObservations';
  }
  function openHuapiComparison(opener, feedback = '') {
    if (!huapiWindow() || state.huapiInvestigation.observations.length !== 2) return;
    if (state.clues.includes('peeling-screen')) {
      const clue = clueById('peeling-screen');
      showReading('两处所见 · 已比对', clue.title, [clue.inspection], [{ label: '合上线索，继续行走', primary: true, run: () => closeDialog('readingDialog') }], { opener, note: clue.hint });
      return;
    }
    const investigation = story.investigation;
    showReading('两处所见 · 对照后再下判断', investigation.question, [...investigation.views.map(view => `${view.title}：${view.description}`), ...(feedback ? [feedback] : [])], investigation.choices.map(choice => ({ label: choice.label, run: () => {
      if (choice.id !== investigation.answer) {
        openHuapiComparison(opener, choice.feedback);
        const retry = $('huapiCompareAnswer-' + choice.id); if (retry) retry.focus({ preventScroll: true });
        return;
      }
      state.huapiInvestigation.compared = true;
      if (!state.clues.includes('peeling-screen')) state.clues.push('peeling-screen');
      save(); syncScene(); renderActions(); ringBell();
      showReading('证据相照 · 已收入线索册', '屏上衣影接缝', [investigation.success], [{ label: '带着证据，去问画皮客', primary: true, run: () => { closeDialog('readingDialog'); guide('painted-guest'); } }], { opener, note: '下一步：靠近画皮客，用刚才的发现追问。人物问话仍可选择回应方式。' });
    } })), { opener, note: '不计时，不扣分。判断所见能支持什么，不凭容貌判断善恶。' });
    investigation.choices.forEach((choice, index) => { $('readingActions').children[index].id = 'huapiCompareAnswer-' + choice.id; });
  }
  function renderHuapiInvestigation(rows) {
    const investigation = state.huapiInvestigation;
    const item = node('section', 'action-row huapi-investigation'); item.id = 'huapiInvestigation';
    item.dataset.done = String(investigation.compared); item.dataset.next = String(!investigation.compared); item.dataset.targetId = 'peeling-screen';
    item.setAttribute('aria-label', '窗下两处观察与证据比对');
    const heading = node('div', 'huapi-investigation-heading');
    const title = node('div', 'action-name', `窗下察证 · ${investigation.observations.length}/2`);
    title.append(node('small', '', investigation.compared ? '两处已比对 · 可重看' : '换位观察，再作判断'));
    const text = button('文字察看', event => textHuapiObservations(event.currentTarget), 'text-button'); text.id = 'huapiTextObservation';
    heading.append(title, text);
    const tools = node('div', 'huapi-investigation-tools');
    story.investigation.views.forEach(view => {
      const viewState = scene.investigation && Array.isArray(scene.investigation.views) ? scene.investigation.views.find(item => item.id === view.id) : null;
      const done = huapiObserved(view.id);
      const label = done ? `${view.label} · 已记` : viewState && viewState.near ? viewState.facing ? `${view.label} · 观察` : `${view.label} · 看向窗内` : `${view.label} · 前往`;
      const control = button(label, event => observeHuapi(view.id, event.currentTarget));
      control.id = 'huapiObservation-' + view.id; control.setAttribute('aria-label', `${view.title}，${done ? '已记下，可重看' : viewState && viewState.near ? '已到观察处，朝窗内察看' : '前往观察处'}`);
      tools.append(control);
    });
    const compare = button(investigation.compared ? '重看证据' : '比对所见', event => openHuapiComparison(event.currentTarget));
    compare.id = 'huapiCompare'; compare.disabled = investigation.observations.length !== 2;
    tools.append(compare); item.append(heading, tools); rows.append(item);
  }
  function inspect(clueId, opener) {
    const clue = clueById(clueId);
    if (huapiWindow() && clueId === 'peeling-screen' && !state.clues.includes(clueId)) {
      setSceneStatus('这处窗影须换两个位置看清，再比对所见；也可直接用「文字察看」核对。');
      const next = story.investigation.views.find(view => !huapiObserved(view.id));
      if (next) guide(next.targetId); else openHuapiComparison(opener);
      renderActions(); return;
    }
    if (!clue || clue.stageId !== currentStage().id || !nearby(clue.targetId || clue.id)) { if (clue) guide(clue.targetId || clue.id); return; }
    if (!state.clues.includes(clue.id)) { state.clues.push(clue.id); save(); syncScene(); ringBell(); }
    renderActions();
    showReading('实地拾遗 · 已收入线索册', clue.title, [clue.inspection], [{ label: '记下线索，接着走', primary: true, run: () => closeDialog('readingDialog') }], { note: clue.hint, opener });
  }
  function speak(opener) {
    const stage = currentStage();
    const dialogue = stage.dialogue;
    if (!dialogue) return;
    if (!nearby(dialogue.targetId || dialogue.speakerId)) { guide(dialogue.targetId || dialogue.speakerId); return; }
    const person = characterById(dialogue.speakerId);
    if (huapiWindow() && !state.clues.includes('peeling-screen') && !state.dialogues[stage.id]) {
      showReading('窗下初问 · 尚无证据', person.name, [story.investigation.evasion], [{ label: '先去窗下查证', primary: true, run: () => { closeDialog('readingDialog'); inspect('peeling-screen'); } }, { label: '改以文字察看', run: () => textHuapiObservations(opener) }], { opener, note: '这次敷衍不记为本幕对谈。看清两处所见并比对之后，再带着证据追问。' });
      return;
    }
    const evidenceLines = huapiWindow() && state.clues.includes('peeling-screen') ? [story.investigation.accusation] : [];
    const chosen = dialogue.choices.find(choice => choice.id === state.dialogues[stage.id]);
    if (chosen) {
      showReading(wording('dialogueRecorded', '灯下对谈 · 已记下回应'), person.name, [...evidenceLines, dialogue.prompt, chosen.reply], [{ label: '接着走', primary: true, run: () => closeDialog('readingDialog') }], { opener });
      return;
    }
    showReading(wording('dialogueKind', '灯下对谈'), person.name, [...evidenceLines, dialogue.prompt], dialogue.choices.map(choice => ({ label: choice.label, run: () => {
      state.dialogues[stage.id] = choice.id;
      noteReveal(stage.id);
      save(); syncScene(); renderActions();
      showReading(wording('dialogueReply', '灯下回音'), person.name, [choice.reply], [{ label: '记下这句话', primary: true, run: () => closeDialog('readingDialog') }], { note: '你的回应会留在这一夜的结尾。' });
    } })), { opener });
  }
  function encounter(encounterId, opener) {
    const visit = (currentStage().encounters || []).find(item => item.id === encounterId);
    if (!visit) return;
    if (!nearby(visit.targetId)) { guide(visit.targetId); return; }
    showReading(wording('encounterKind', '窗前旁听 · 不计入本幕必做'), visit.title, visit.lines, [{ label: '听罢，回到行走', primary: true, run: () => closeDialog('readingDialog') }], { opener, note: visit.note || '这段旁听不影响本幕完成，可自由选择是否停步。' });
  }
  function stageRecap() {
    if (!story || !live) return;
    const stage = currentStage();
    const lines = state.stageIndex === 0 ? [...story.atmosphere.opening, ...stage.narration] : stage.narration;
    showReading(wording('stageKind', '曲江夜行 · 原创志怪'), stage.title, lines, [{ label: '亲自走近，寻人查看', primary: true, run: () => { closeDialog('readingDialog'); focusScene(); } }], { note: stage.objective });
  }
  function enterCurrentStage(restorePlayer = false) {
    if (!story || !ready || !live) return;
    childCall('changanTaleSceneEnter', currentStage().id);
    if (!restorePlayer) state.player = null;
    syncScene(restorePlayer);
    scene = childCall('changanTaleSceneState') || { ready: true, nearby: [] };
    guidedTarget = ''; guideFeedback = '';
    lastSignature = '';
    renderActions();
    pauseScene();
  }
  function advanceStage() {
    const stage = currentStage();
    if (!stageComplete(stage) || state.stageIndex >= story.stages.length - 1) return;
    showReading(wording('advanceKind', '循灯前行'), stage.nextAction || wording('nextPlace', '走向下一段水岸'), [stage.transition || wording('transition', '灯影向前，你沿岸接着走。')], [{ label: '走入下一幕', primary: true, run: () => {
      closeDialog('readingDialog');
      state.stageIndex += 1; state.player = null; save();
      enterCurrentStage(false);
      stageRecap();
    } }]);
  }
  function openPuzzle(opener) {
    const targetId = story.puzzle.targetId || puzzleTargetId;
    if (!stageComplete(currentStage())) return;
    if (!nearby(targetId)) { guide(targetId); return; }
    $('puzzleInstruction').textContent = story.puzzle.instruction;
    $('puzzleTitle').textContent = story.puzzle.title;
    $('puzzleHelpText').replaceChildren();
    paragraphs($('puzzleHelpText'), story.puzzle.hints);
    renderLamps();
    modal('puzzleDialog', opener);
  }
  function renderLamps(feedback = '') {
    if (puzzleMode !== 'ordered') { renderRoundPuzzle(feedback); return; }
    const progress = $('lampProgress');
    progress.tabIndex = -1;
    progress.setAttribute('role', 'group');
    progress.setAttribute('aria-label', '三步谜题进度');
    progress.replaceChildren();
    story.puzzle.solution.forEach((_, index) => {
      const selected = story.puzzle.lamps.find(lamp => lamp.id === state.lamps[index]);
      const slot = node('div', `lamp-slot${selected ? ' lit' : ''}`);
      slot.append(node('span', '', selected ? selected.label : wording('puzzleEmptySlot', '待点亮')), node('small', '', `第${['一', '二', '三'][index]}${wording('puzzleUnit', '盏')}`));
      progress.append(slot);
    });
    $('lampChoices').replaceChildren();
    story.puzzle.lamps.forEach(lamp => {
      const choice = button(`${lamp.label} · ${lamp.shape}`, () => {
        if (puzzleSolved()) return;
        if (lamp.id !== story.puzzle.solution[state.lamps.length]) {
          state.lamps = []; save(); syncScene(); renderLamps(story.puzzle.wrong);
          if (typeof progress.focus === 'function') progress.focus({ preventScroll: true });
          return;
        }
        state.lamps.push(lamp.id);
        if (puzzleSolved()) { noteReveal(finalStageId, 'puzzle'); ringBell(); }
        save(); syncScene(); renderActions();
        renderLamps(puzzleSolved() ? story.puzzle.success : wording('puzzleProgress', '{label}已明。再照下一段来路。').replace('{label}', lamp.label));
        if (typeof progress.focus === 'function') progress.focus({ preventScroll: true });
      });
      choice.disabled = puzzleSolved() || state.lamps.includes(lamp.id);
      choice.setAttribute('aria-label', `${lamp.label}，${lamp.shape}，${lamp.description}`);
      $('lampChoices').append(choice);
    });
    $('puzzleFeedback').textContent = feedback || (puzzleSolved() ? story.puzzle.success : wording('puzzleInitial', '点错可以重来，不扣分，也不催促。'));
    $('finishLamps').hidden = !puzzleSolved();
    $('resetLamps').hidden = puzzleSolved();
  }
  function answerPuzzleRound(choiceId) {
    if (puzzleMode === 'ordered' || puzzleSolved() || currentStage().id !== finalStageId || !stageComplete(currentStage())) return false;
    const round = puzzleRounds[state.lamps.length];
    if (!round || !round.choices.some(choice => choice.id === choiceId)) return false;
    if (choiceId !== round.answer) {
      renderRoundPuzzle(`${round.hint} 已完成的部分保留，可再想一想。`);
      return false;
    }
    state.lamps.push(choiceId);
    if (puzzleSolved()) { noteReveal(finalStageId, 'puzzle'); ringBell(); }
    save(); syncScene(); renderActions();
    renderRoundPuzzle(puzzleSolved() ? story.puzzle.success : round.success);
    return true;
  }
  function renderRoundPuzzle(feedback = '') {
    const solved = puzzleSolved();
    const roundIndex = state.lamps.length;
    const current = puzzleRounds[roundIndex];
    $('puzzleDialog').setAttribute('data-puzzle-mode', puzzleMode);
    const progress = $('lampProgress');
    progress.replaceChildren();
    progress.setAttribute('aria-label', puzzleMode === 'cricket' ? '辨虫与斗虫进度' : '寻址与安置进度');
    puzzleRounds.forEach((round, index) => {
      const completed = index < roundIndex;
      const slot = node('div', `round-step${completed ? ' complete' : index === roundIndex ? ' current' : ''}`);
      if (index === roundIndex) slot.setAttribute('aria-current', 'step');
      slot.append(node('span', 'round-step-number', completed ? '✓' : String(index + 1)), node('span', '', round.title), node('small', '', completed ? '已完成' : index === roundIndex ? '当前' : '随后'));
      progress.append(slot);
    });
    const choices = $('lampChoices');
    choices.replaceChildren();
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-labelledby', 'puzzleRoundTitle');
    if (puzzleMode === 'cricket') {
      const arena = node('div', 'cricket-arena');
      arena.setAttribute('data-progress', String(roundIndex));
      arena.setAttribute('role', 'img');
      arena.setAttribute('aria-label', solved ? '辨虫与两次读势已完成，斗虫台停下，等待你的选择。' : roundIndex === 0 ? '草笼旁的虫形图示。依线索描述辨认下方候选，不必着急开斗。' : `斗虫台，第${roundIndex}次读势。看清下方描述再出手，没有倒计时。`);
      const left = node('span', 'cricket-figure cricket-player');
      const right = node('span', 'cricket-figure cricket-opponent');
      [left, right].forEach(figure => { figure.setAttribute('aria-hidden', 'true'); figure.append(node('i', 'cricket-leg'), node('i', 'cricket-feeler')); });
      arena.append(left, node('span', 'cricket-arena-line'), right);
      const caption = node('p', 'cricket-arena-caption', solved ? '合上草笼 · 此后由你收束' : roundIndex === 0 ? '先认清虫，再入斗场' : '停步读势 · 不计时，可重试');
      choices.append(arena, caption);
    }
    const heading = node('h3', 'puzzle-round-title', solved ? wording('puzzleCompleteTitle', puzzleMode === 'cricket' ? '虫已辨，斗已罢' : '三处已辨，归路已明') : current.title);
    heading.id = 'puzzleRoundTitle'; heading.tabIndex = -1;
    choices.append(heading);
    if (!solved) {
      choices.append(node('p', 'puzzle-round-prompt', current.prompt));
      const options = node('div', 'puzzle-round-options');
      current.choices.forEach(option => {
        const choice = button('', () => {
          answerPuzzleRound(option.id);
          const title = $('puzzleRoundTitle');
          if (title && typeof title.focus === 'function') title.focus({ preventScroll: true });
        }, 'puzzle-round-choice');
        choice.setAttribute('data-choice-id', option.id);
        choice.append(node('span', 'puzzle-option-label', option.label));
        if (option.detail) choice.append(node('small', '', option.detail));
        options.append(choice);
      });
      choices.append(options);
    }
    $('puzzleFeedback').setAttribute('aria-live', 'polite');
    $('puzzleFeedback').setAttribute('aria-atomic', 'true');
    $('puzzleFeedback').textContent = feedback || (solved ? story.puzzle.success : wording('puzzleInitial', '读过线索再选；选错仍可重试，已完成的部分会保留。'));
    $('finishLamps').hidden = !solved;
    $('resetLamps').hidden = solved || state.lamps.length === 0;
    $('resetLamps').textContent = wording('puzzleReset', '从第一步重新推敲');
  }
  function resetPuzzle() {
    if (puzzleSolved()) return;
    state.lamps = []; save(); syncScene();
    renderLamps(puzzleMode === 'ordered' ? '次序已清空，随时重看三件实物的线索。' : wording('puzzleResetFeedback', '已回到第一步；实地收集的线索与对谈仍保留。'));
    if (puzzleMode !== 'ordered') {
      const title = $('puzzleRoundTitle');
      if (title && typeof title.focus === 'function') title.focus({ preventScroll: true });
    } else if (typeof $('lampProgress').focus === 'function') $('lampProgress').focus({ preventScroll: true });
  }
  function effects() {
    const result = {};
    story.stages.forEach(stage => {
      if (!stage.dialogue) return;
      const choice = stage.dialogue.choices.find(item => item.id === state.dialogues[stage.id]);
      if (choice && choice.effect) Object.assign(result, choice.effect);
    });
    return result;
  }
  function chooseEnding() {
    if (!puzzleSolved() || !stageComplete(currentStage())) return;
    if (!state.ending && !nearby(story.puzzle.targetId || puzzleTargetId)) { guide(story.puzzle.targetId || puzzleTargetId); return; }
    const stage = story.stages[story.stages.length - 1];
    showReading(wording('endingKind', '三灯已明 · 今夜由你收束'), stage.nextAction || wording('endingDecision', '决定纸灯的去处'), [...(stage.afterPuzzle || []), stage.endingPrompt], story.endings.map(ending => ({ label: ending.choiceLabel, run: () => {
      state.ending = ending.id;
      if (!state.seenEndings.includes(ending.id)) state.seenEndings.push(ending.id);
      noteReveal(finalStageId); save(); syncScene(); renderActions(); showEnding();
    } })), { note: wording('endingNote', '两种收束都可选择，没有正误，也不需先解锁另一种。') });
  }
  function showEnding() {
    const ending = story.endings.find(item => item.id === state.ending);
    if (!ending) return;
    const choiceEffects = effects();
    const echoes = Object.entries(ending.choiceEchoes || {}).map(([key, variants]) => variants[choiceEffects[key]]).filter(Boolean);
    const person = ending.dialogue && characterById(ending.dialogue.speakerId);
    showReading('异闻收卷 · 已留在本机', ending.title, [...ending.narration, ...echoes, person ? `${person.name}：${ending.dialogue.text}` : ''], [{ label: wording('endingReturnScene', '回到水岸，看看这一夜'), primary: true, run: () => { closeDialog('readingDialog'); focusScene(); } }, { label: '另起一夜，读另一种收束', run: confirmRestart }, { label: wording('returnLabel', '返回曲江'), secondary: true, run: () => { leaveTale(); location.href = returnUrl; } }, { label: '返回五卷书架', href: '/night-tour-changan-play/tales/', run: () => leaveTale() }], { note: story.contentNote });
  }
  function renderActions() {
    if (!story || !state) return;
    const huapiFocusId = huapiWindow() && document.activeElement && /^huapi(?:Observation-|TextObservation$|Compare$)/.test(document.activeElement.id || '') ? document.activeElement.id : null;
    $('clueCount').textContent = String(state.clues.length);
    $('stageHud').hidden = !live;
    $('actionDock').hidden = !live;
    $('focusScene').hidden = !live;
    $('toggleTaleAudio').hidden = !live;
    if (!live) { layoutScene(); return; }
    const stage = currentStage();
    $('stageNumber').textContent = `第${['一', '二', '三'][state.stageIndex]}幕 / 三幕`;
    $('stageTitle').textContent = stage.title.replace(/^[一二三]\s*[·・]\s*/, '');
    $('stageObjective').textContent = state.ending ? '这一夜已收束。人物卡与线索仍可回看。' : stage.objective;
    const rows = $('actionRows');
    if (isHuapi) { rows.dataset.huapiWindow = String(huapiWindow()); $('actionDock').dataset.huapiWindow = String(huapiWindow()); }
    rows.replaceChildren();
    const pendingClue = stage.clueIds.map(clueById).find(clue => !state.clues.includes(clue.id));
    const pendingDialogue = stage.dialogue && stage.dialogue.required !== false && !state.dialogues[stage.id] ? stage.dialogue : null;
    const nextTarget = pendingClue ? pendingClue.targetId || pendingClue.id : pendingDialogue ? pendingDialogue.targetId || pendingDialogue.speakerId : stage.puzzleId && !puzzleSolved() ? story.puzzle.targetId || puzzleTargetId : '';
    function row(title, subtitle, targetId, done, onInspect, optional = false) {
      const close = nearby(targetId);
      const item = node('div', 'action-row');
      item.dataset.done = String(done);
      item.dataset.optional = String(optional);
      item.dataset.next = String(!state.ending && !done && !optional && targetId === nextTarget);
      item.dataset.targetId = targetId;
      const label = node('div', 'action-name', optional ? `选读 · ${title}` : title);
      label.append(node('small', '', done ? '已记下 · 可重看' : optional ? '不计入必做' : close ? '就在近处' : '须走近查看'));
      item.append(label, button(optional ? close ? `选读：${subtitle}` : '选读引路' : close ? subtitle : '前往', event => close ? onInspect(event.currentTarget) : guide(targetId)));
      rows.append(item);
    }
    if (!state.ending) {
      stage.clueIds.forEach(id => {
        const clue = clueById(id);
        if (huapiWindow() && id === 'peeling-screen') renderHuapiInvestigation(rows);
        else row(clue.title, '查看', clue.targetId || clue.id, state.clues.includes(id), opener => inspect(id, opener));
      });
      if (stage.dialogue) {
        const person = characterById(stage.dialogue.speakerId);
        row(person.name, huapiWindow() && state.clues.includes('peeling-screen') ? '带证追问' : '交谈', stage.dialogue.targetId || stage.dialogue.speakerId, Boolean(state.dialogues[stage.id]), speak, stage.dialogue.required === false);
      }
      (stage.encounters || []).forEach(visit => row(visit.title, visit.actionLabel || '听他辩白', visit.targetId, false, opener => encounter(visit.id, opener), true));
      if (stage.puzzleId && stageComplete(stage)) row(story.puzzle.title, puzzleSolved() ? wording('puzzleSolvedAction', '听完') : wording('puzzleAction', '点灯'), story.puzzle.targetId || puzzleTargetId, puzzleSolved(), opener => puzzleSolved() ? chooseEnding() : openPuzzle(opener));
    }
    const advance = $('stageAdvance');
    advance.replaceChildren();
    if (state.ending) {
      advance.append(node('p', '', `已读结尾：${story.endings.find(item => item.id === state.ending).title}`), button('回看结尾', showEnding), button('另起一夜', confirmRestart, 'primary'));
    } else if (stageComplete(stage) && state.stageIndex < story.stages.length - 1) {
      advance.append(node('p', '', '此处人话、实物均已记下。'), button(stage.nextAction || wording('advanceKind', '循灯前行'), advanceStage, 'primary'));
    }
    let nextHint;
    if (state.ending) nextHint = '此卷已收束，可回看结尾或从帮助返回书架。';
    else if (huapiWindow() && pendingClue && pendingClue.id === 'peeling-screen') {
      const nextView = story.investigation.views.find(view => !huapiObserved(view.id));
      nextHint = nextView ? `下一步：换位察看${nextView.label}（${state.huapiInvestigation.observations.length}/2）；也可文字察看。` : '下一步：比对两处所见，辨清它们共同说明什么。';
    }
    else if (pendingClue) nextHint = `下一步：${nearby(nextTarget) ? '查看' : '走近'}${pendingClue.title}。`;
    else if (pendingDialogue) nextHint = `下一步：${nearby(nextTarget) ? '交谈' : '走近'}${characterById(pendingDialogue.speakerId).name}。`;
    else if (state.stageIndex < story.stages.length - 1) nextHint = '下一步：进入下一幕，继续亲历。';
    else if (!puzzleSolved()) nextHint = `下一步：${nearby(nextTarget) ? '完成' : '走近'}${story.puzzle.title}。`;
    else nextHint = '下一步：回应这一夜，选择收束。';
    $('actionHint').textContent = nextHint;
    layoutScene();
    if (huapiFocusId) { const focused = $(huapiFocusId); if (focused && !focused.disabled) focused.focus({ preventScroll: true }); }
  }
  function layoutScene() {
    const dock = $('actionDock');
    const space = dock.hidden ? 0 : Math.ceil(dock.getBoundingClientRect().height + 22);
    $('taleExperience').style.setProperty('--action-space', `${space}px`);
  }
  function showClues() {
    if (!story) return;
    const list = $('cluesList');
    list.replaceChildren();
    const clues = story.clues.filter(clue => state.clues.includes(clue.id));
    if (!clues.length) list.append(node('p', 'empty-note', wording('emptyClues', '册页还空着。走近桥栏、岸边或泊舟，亲手查看一件物事，再回来翻阅。')));
    clues.forEach(clue => {
      const paper = node('article', 'clue-paper');
      paper.append(node('h3', '', clue.title), node('p', '', clue.inspection), node('small', '', clue.hint));
      list.append(paper);
    });
    $('puzzleHints').hidden = !story.puzzle.requiresClues.every(id => state.clues.includes(id));
    $('puzzleHintText').replaceChildren();
    if (!$('puzzleHints').hidden) paragraphs($('puzzleHintText'), story.puzzle.hints);
    modal('cluesDialog', $('openClues'));
  }
  function showPeople() {
    if (!story) return;
    const list = $('peopleList');
    list.replaceChildren();
    story.characters.forEach(person => {
      const cover = button('', () => showCharacter(person.id), 'person-cover');
      cover.setAttribute('aria-label', `展开${person.name}的独立角色卡`);
      const image = node('img'); image.src = portraits[person.id]; image.alt = `${person.name}原创意象画像`; image.width = 450; image.height = 600; image.loading = 'lazy';
      const label = node('span', '', person.name); label.append(node('small', '', person.role));
      cover.append(image, label); list.append(cover);
    });
    modal('peopleDialog', $('openPeople'));
  }
  function showCharacter(id) {
    const person = characterById(id);
    if (!person) return;
    const body = $('characterBody'); body.replaceChildren();
    const layout = node('div', 'character-layout');
    const image = node('img', 'character-portrait'); image.src = portraits[person.id]; image.alt = `${person.name}原创意象画像`; image.width = 600; image.height = 900;
    const writing = node('div', 'character-writing');
    writing.append(node('p', 'eyebrow', wording('characterEyebrow', '借灯人 · 独立角色卡')));
    const title = node('h2', '', person.name); title.id = 'characterTitle'; title.tabIndex = -1;
    writing.append(title, node('p', 'character-role', `${person.role} · ${person.age}`), node('p', 'character-role', person.card.public));
    const definitions = node('dl');
    definitions.append(node('dt', '', '代表之物'), node('dd', '', person.object), node('dt', '', '性情'), node('dd', '', person.card.temperament), node('dt', '', '衣饰意象'), node('dd', '', person.appearance));
    writing.append(definitions, node('p', 'character-quote', `“${person.firstLine.replace(/^“|”$/g, '')}”`));
    const revealed = state.revealed.includes(person.id);
    const layer = node('section', `identity-layer${revealed ? '' : ' locked'}`);
    layer.append(node('h3', '', revealed ? person.card.hiddenLabel || '已亲闻的身世' : wording('hiddenCharacterLabel', '尚在灯影里')), node('p', '', revealed ? person.card.hiddenLayer : story.ui.lockedCardLabel));
    writing.append(layer, node('p', 'character-note', wording('characterNote', '人物、面容与衣饰均为本篇原创艺术想象，不对应历史人物。')));
    layout.append(image, writing); body.append(layout);
    modal('characterDialog');
  }
  function showWalkHelp() {
    showReading(wording('helpKind', '曲江夜行 · 操作'), wording('helpTitle', '脚下循灯，眼前辨物'), ['电脑：W A S D 或方向键行走，点一下三维画面，再移动鼠标便可 360° 自由环顾，空格轻跃。小圆点固定在画面中央，对准人物或物件后可点击，也可走近按 E。Esc 先释放鼠标，便可点行动卡或翻书；再按一次会展开帮助。若浏览器暂不支持，仍可在画面里移动鼠标环顾。手机：推左下摇杆行走，在右侧空白画面连续滑动环顾，点「跳跃」轻跃。', wording('helpGuide', '先点行动卡的「前往」，循地面灯路亲自走近。到达人物或物件附近，按钮会变成「交谈」或「查看」。页面不会替你自动走路。'), '人物册与线索册随时可开；读册时行走暂停。合上后，点「回到行走」或点三维画面继续。每幕拾物、相谈后，底部会出现下一幕。', wording('helpAudio', '画面右侧「听水声」可轻启本篇的合成风水声与单音铃，默认关闭。声音不承担谜题信息，静音也能走完故事。'), wording('helpReturn', '若闲游走远，可点下方「回到本幕岸边」，回到当前故事的安全落脚处；已收线索与对谈保留。'), wording('helpExit', '故事不计时，也没有失败扣分。右上「返回曲江」可暂别；本机能保存时，刷新或回来可接着这一幕。')], [{ label: '明白了，亲自走走', primary: true, run: () => { closeDialog('readingDialog'); focusScene(); } }, { label: wording('returnToStageLabel', '回到本幕岸边'), run: () => { closeDialog('readingDialog'); returnToStageEdge(); focusScene(); } }, { label: '返回五卷书架', href: '/night-tour-changan-play/tales/', run: () => leaveTale() }], { note: saveMessage || story.ui.saveNote });
  }
  function leaveTale() {
    if (state && live) {
      const current = childCall('changanTaleSceneState');
      state.player = safePlayer(current && current.player) || safePlayer(scene.player) || state.player;
      save();
    }
    childCall('changanTaleScenePause', true);
  }
  function returnToStageEdge() {
    if (!live || !ready || !story) return;
    const point = { ...safeStagePoints[currentStage().id] };
    const result = childCall('changanTaleSceneSet', { ...payload(), player: point });
    if (result === false || result && result.ok === false) { setSceneStatus(wording('returnUnavailable', '岸边暂未接好，请稍候再试。')); return; }
    state.player = point; save();
    scene = childCall('changanTaleSceneState') || scene;
    guidedTarget = ''; guideFeedback = ''; lastSignature = '';
    renderActions(); setSceneStatus(wording('returnedToStage', '已回到本幕岸边，线索与对谈仍在。'));
  }
  function confirmRestart() {
    if (!story || !ready) return;
    showReading('另起一夜', wording('restartTitle', '重新提起这盏灯？'), [wording('restartDescription', '本篇当前的线索、对谈与点灯次序将从桥头重新开始。已经看过的结局与揭开的角色卡仍留在本机。城中其他任务与存档不受影响。')], [{ label: wording('restartAction', '另起一夜，从桥头开始'), primary: true, run: () => {
      state = freshState(state); state.started = true; state.player = { ...safeStagePoints[story.stages[0].id] }; live = true; closeAll(); save();
      $('opening').hidden = true; enterCurrentStage(true); stageRecap();
    } }, { label: '留在这一夜', secondary: true, run: () => closeDialog('readingDialog') }]);
  }
  function begin() {
    if (!ready || !story) return;
    const resume = state.started;
    state.started = true; live = true;
    $('opening').hidden = true; save(); enterCurrentStage(resume);
    if (state.ending) showEnding(); else stageRecap();
  }
  function sceneRecoveryPanel() {
    let panel = $('sceneRecovery');
    if (!panel) {
      panel = node('section', 'scene-recovery');
      panel.id = 'sceneRecovery';
      panel.setAttribute('aria-label', '梦景恢复');
      const message = node('p'); message.id = 'sceneRecoveryMessage';
      const retry = button('重新展开梦景', retryScene); retry.id = 'retryTaleScene';
      panel.append(message, retry);
      panel.hidden = true;
      $('taleExperience').append(panel);
    }
    return panel;
  }
  function showSceneRecovery(message) {
    if (state && live) { state.player = safePlayer(scene.player) || state.player; save(); }
    ready = false; sceneReloading = false;
    const panel = sceneRecoveryPanel();
    $('sceneRecoveryMessage').textContent = message;
    $('retryTaleScene').disabled = false;
    $('retryTaleScene').textContent = '重新展开梦景';
    panel.hidden = false;
    if (story && !loadFailed) $('beginTale').disabled = true;
    setSceneStatus('梦景暂未接通，已留下本幕记录，可重新展开。');
    pauseScene();
  }
  function watchSceneReady() {
    if (sceneWaitTimer !== null) clearTimeout(sceneWaitTimer);
    sceneWaitTimer = setTimeout(() => {
      sceneWaitTimer = null;
      if (!ready) showSceneRecovery('梦景久候未至。可单独重试画面，本机线索、问话与其他卷的记录均保留。');
    }, 25000);
  }
  function retryScene() {
    if (sceneReloading) return;
    if (state && live) { state.player = safePlayer(scene.player) || state.player; save(); }
    childCall('changanTaleScenePause', true);
    ready = false; sceneReloading = true; sceneFramePending = true;
    scene = { ready: false, nearby: [] };
    lastSignature = ''; guidedTarget = ''; guideFeedback = '';
    lastSceneReadyAt = Date.now();
    const panel = sceneRecoveryPanel(); panel.hidden = false;
    $('sceneRecoveryMessage').textContent = '正在重新展开梦景；本幕进度仍在，请稍候。';
    $('retryTaleScene').disabled = true;
    $('retryTaleScene').textContent = '正在展开……';
    if (story && !loadFailed) $('beginTale').disabled = true;
    watchSceneReady();
    frame.src = frame.getAttribute('src');
  }
  function markReady() {
    if (ready || sceneFramePending) return;
    ready = true;
    sceneReloading = false;
    lastSceneReadyAt = Date.now();
    if (sceneWaitTimer !== null) { clearTimeout(sceneWaitTimer); sceneWaitTimer = null; }
    const panel = $('sceneRecovery'); if (panel) panel.hidden = true;
    if (story) {
      $('beginTale').disabled = false;
      $('beginTale').textContent = state.started ? state.ending ? '回看这一夜' : story.ui.resumeLabel : story.ui.startLabel;
      $('restartTale').hidden = !state.started;
      setSceneStatus('');
      if (live) enterCurrentStage(true);
    }
    pauseScene();
  }
  function poll() {
    if (document.hidden) return;
    const next = sceneFramePending ? null : childCall('changanTaleSceneState');
    if (next && next.ready) { scene = next; lastSceneReadyAt = Date.now(); markReady(); }
    else if (ready && live && Date.now() - lastSceneReadyAt > 8000) showSceneRecovery('这一幕的画面暂时中断。可重新展开梦景，接着当前线索与问话继续。');
    if (!story || !live || !ready) return;
    const signature = JSON.stringify([scene.nearby || [], currentStage().id, state.clues, state.dialogues, state.lamps, state.ending, isHuapi ? scene.investigation && scene.investigation.views : null, isHuapi ? state.huapiInvestigation : null]);
    if (signature !== lastSignature) {
      lastSignature = signature;
      renderActions();
      if (guidedTarget && nearby(guidedTarget)) { setSceneStatus(wording('guideArrived', '已到灯下，停步查看。')); guidedTarget = ''; guideFeedback = ''; }
    }
    const now = Date.now();
    if (now - lastSavedPlayer > 2500 && !isModalOpen()) {
      const player = safePlayer(scene.player);
      if (player && (!state.player || Math.hypot(player.x - state.player.x, player.z - state.player.z) > .4)) { state.player = player; save(); }
      lastSavedPlayer = now;
    }
  }
  function stopPolling() { if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null; } }
  function startPolling() { if (pollTimer === null) pollTimer = setInterval(poll, 450); poll(); }
  function validateStory(data) {
    if (!data || data.id !== STORY_ID || !Array.isArray(data.stages) || data.stages.length !== 3 || !Array.isArray(data.clues) || !Array.isArray(data.characters) || data.characters.length !== (taleConfig.expectedCharacters || 2) || !data.puzzle || !Array.isArray(data.puzzle.solution) || data.puzzle.solution.join('|') !== puzzleSolution.join('|') || !Array.isArray(data.endings) || data.endings.length !== 2) throw new Error('story-shape');
    if (!['ordered', 'choice', 'cricket'].includes(puzzleMode)) throw new Error('story-puzzle-mode');
    if (puzzleMode !== 'ordered') {
      if (typeof data.puzzle.success !== 'string' || !data.puzzle.success.trim()) throw new Error('story-puzzle-feedback');
      if (puzzleRounds.length !== 3 || new Set(puzzleRounds.map(round => round.id)).size !== 3 || puzzleRounds.map(round => round.answer).join('|') !== puzzleSolution.join('|') || data.stages[2].id !== finalStageId) throw new Error('story-puzzle-rounds');
      puzzleRounds.forEach(round => {
        if (!round.id || !round.title || !round.prompt || !round.hint || !round.success || !Array.isArray(round.choices) || round.choices.length < 2 || round.choices.length > 4 || new Set(round.choices.map(choice => choice.id)).size !== round.choices.length || !round.choices.some(choice => choice.id === round.answer) || round.choices.some(choice => !choice.id || !choice.label || choice.detail !== undefined && typeof choice.detail !== 'string')) throw new Error('story-puzzle-options');
      });
    }
    data.stages.forEach(stage => {
      if (!stage.id || !Array.isArray(stage.clueIds) || !stage.clueIds.every(id => data.clues.some(clue => clue.id === id)) || stage.dialogue && (!Array.isArray(stage.dialogue.choices) || !stage.dialogue.choices.length || !data.characters.some(person => person.id === stage.dialogue.speakerId))) throw new Error('story-links');
      if (stage.encounters && (!Array.isArray(stage.encounters) || stage.encounters.some(visit => !visit.id || !visit.targetId || !visit.title || !Array.isArray(visit.lines) || visit.lines.some(line => typeof line !== 'string')))) throw new Error('story-encounters');
    });
    data.characters.forEach(person => { if (!portraits[person.id] || !person.card) throw new Error('story-characters'); });
    if (isHuapi) {
      const detail = data.investigation;
      if (!detail || detail.version !== 1 || !Array.isArray(detail.views) || detail.views.length !== 2 || detail.views.map(view => view.id).join('|') !== 'ink|shadow' || detail.views.some(view => !view.targetId || !view.title || !view.label || !view.description) || !detail.question || !Array.isArray(detail.choices) || detail.choices.length !== 3 || !detail.choices.some(choice => choice.id === detail.answer) || detail.choices.some(choice => !choice.id || !choice.label || !choice.feedback) || !detail.success || !detail.evasion || !detail.accusation) throw new Error('story-investigation');
    }
    return data;
  }
  async function loadStory() {
    if (storyLoading) return;
    storyLoading = true;
    $('beginTale').disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(STORY_URL, { credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error('story-fetch');
      story = validateStory(await response.json());
      state = readState(); loadFailed = false;
      if (typeof window !== 'undefined' && window.ChanganLanternWalk) window.ChanganLanternWalk.rememberTale(state);
      $('beginTale').textContent = ready ? state.started ? state.ending ? '回看这一夜' : story.ui.resumeLabel : story.ui.startLabel : '夜色正在展开……';
      $('beginTale').disabled = !ready;
      $('restartTale').textContent = story.ui.restartLabel;
      $('restartTale').hidden = !state.started;
      if (!saveMessage) setSaveMessage(story.ui.saveNote);
      $('puzzleInstruction').textContent = story.puzzle.instruction;
      $('openClues').disabled = false; $('openPeople').disabled = false;
      if ($('openingWalkHelp')) $('openingWalkHelp').disabled = false;
      renderActions();
      if (ready) { setSceneStatus(''); pauseScene(); }
    } catch (_) {
      loadFailed = true;
      $('beginTale').disabled = false;
      $('beginTale').textContent = '重新展开故事';
      setSaveMessage('故事书页暂未打开，请再试一次；已有本机记录仍保留。');
    } finally { clearTimeout(timeout); storyLoading = false; }
  }

  $('openClues').disabled = true;
  $('openPeople').disabled = true;
  $('beginTale').addEventListener('click', () => loadFailed ? loadStory() : begin());
  $('restartTale').addEventListener('click', confirmRestart);
  $('openClues').addEventListener('click', showClues);
  $('openPeople').addEventListener('click', showPeople);
  $('openRecap').addEventListener('click', stageRecap);
  $('openWalkHelp').addEventListener('click', showWalkHelp);
  if ($('openingWalkHelp')) $('openingWalkHelp').addEventListener('click', showWalkHelp);
  $('focusScene').addEventListener('click', focusScene);
  $('toggleTaleAudio').addEventListener('click', toggleSound);
  $('openingTaleAudio').addEventListener('click', toggleSound);
  if ($('openSource')) $('openSource').addEventListener('click', event => modal('sourceDialog', event.currentTarget));
  if ($('openingSource')) $('openingSource').addEventListener('click', event => modal('sourceDialog', event.currentTarget));
  $('resetLamps').addEventListener('click', resetPuzzle);
  $('finishLamps').addEventListener('click', () => { closeDialog('puzzleDialog'); chooseEnding(); });
  $('returnCity').addEventListener('click', leaveTale);
  document.querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', () => closeDialog(element.dataset.close)));
  dialogs.forEach(dialog => dialog.addEventListener('close', () => {
    pauseScene();
    if (dialog.id === 'readingDialog' && modalOnClose) { const callback = modalOnClose; modalOnClose = null; callback(); }
    if (!isModalOpen()) {
      const target = dialogOpeners.get(dialog);
      dialogOpeners.delete(dialog);
      if (document.activeElement === frame) return;
      if (target && target.isConnected && !target.disabled && target !== frame && target.offsetParent !== null) target.focus({ preventScroll: true });
      else if (live) $('focusScene').focus({ preventScroll: true });
    }
  }));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'changan-tale-ready' && !sceneFramePending) { const next = childCall('changanTaleSceneState'); if (next && next.ready) { scene = next; markReady(); } pauseScene(); }
    if (event.data.type === 'changan-tale-pause' && live && !isModalOpen()) showWalkHelp();
    if (event.data.type === 'changan-tale-interact' && live && !isModalOpen()) {
      const current = childCall('changanTaleSceneState');
      if (current && current.ready) scene = current;
      const targetId = typeof event.data.targetId === 'string' ? event.data.targetId : null;
      if (targetId !== null) {
        const observation = huapiWindow() && story.investigation.views.find(view => view.targetId === targetId);
        if (observation) { observeHuapi(observation.id); return; }
        const clickedClue = currentStage().clueIds.find(id => (clueById(id).targetId || id) === targetId);
        if (clickedClue && nearby(targetId)) inspect(clickedClue);
        else if (currentStage().dialogue && (currentStage().dialogue.targetId || currentStage().dialogue.speakerId) === targetId && nearby(targetId)) speak();
        else if ((currentStage().encounters || []).some(visit => visit.targetId === targetId) && nearby(targetId)) encounter(currentStage().encounters.find(visit => visit.targetId === targetId).id);
        else if (currentStage().puzzleId && stageComplete(currentStage()) && targetId === (story.puzzle.targetId || puzzleTargetId) && nearby(targetId)) puzzleSolved() ? chooseEnding() : openPuzzle();
        return;
      }
      const observation = huapiWindow() && !state.clues.includes('peeling-screen') && story.investigation.views.find(view => !huapiObserved(view.id) && scene.investigation && Array.isArray(scene.investigation.views) && scene.investigation.views.some(item => item.id === view.id && item.near));
      if (observation) { observeHuapi(observation.id); return; }
      const firstNearby = currentStage().clueIds.find(id => nearby(clueById(id).targetId || id) && !state.clues.includes(id));
      if (firstNearby) inspect(firstNearby);
      else if (currentStage().dialogue && nearby(currentStage().dialogue.targetId || currentStage().dialogue.speakerId)) speak();
      else if (currentStage().puzzleId && stageComplete(currentStage()) && nearby(story.puzzle.targetId || puzzleTargetId)) puzzleSolved() ? chooseEnding() : openPuzzle();
    }
  });
  document.addEventListener('visibilitychange', () => {
    pauseScene();
    if (document.hidden) { if (state && live) { state.player = safePlayer(scene.player) || state.player; save(); } suspendSound(); stopPolling(); }
    else { startPolling(); resumeChosenSound(); }
  });
  window.addEventListener('pagehide', () => { if (state && live) { state.player = safePlayer(scene.player) || state.player; save(); } childCall('changanTaleScenePause', true); suspendSound(); stopPolling(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { startPolling(); pauseScene(); resumeChosenSound(); } });
  window.addEventListener('resize', layoutScene);
  frame.addEventListener('load', () => { sceneFramePending = false; poll(); });
  frame.addEventListener('error', () => showSceneRecovery('梦景未能载入。可重新展开画面，本机记录仍保留。'));
  if (typeof ResizeObserver === 'function') new ResizeObserver(layoutScene).observe($('actionDock'));
  watchSceneReady();
  window.changanTalePageState = () => story && state ? { ready, live, stage: currentStage().id, clues: state.clues.slice(), dialogues: { ...state.dialogues }, lamps: state.lamps.slice(), ending: state.ending, seenEndings: state.seenEndings.slice(), revealed: state.revealed.slice(), ...(isHuapi ? { investigation: { version: 1, observations: state.huapiInvestigation.observations.slice(), compared: state.huapiInvestigation.compared } } : {}), storageAvailable, nearby: Array.isArray(scene.nearby) ? scene.nearby.slice() : [], paused: isModalOpen() || document.hidden, sound: { wanted: sound.wanted, state: sound.context ? sound.context.state : 'uncreated' } } : { ready, live, loading: true };
  startPolling();
  loadStory();
})();
