(() => {
  'use strict';
  const ids = ['borrowed-lantern', 'paper-door', 'painted-skin', 'nie-xiaoqian', 'cricket'];
  const catalogElement = document.getElementById('taleShelfCatalog');
  const resume = document.getElementById('taleShelfResume');
  const resumeLink = document.getElementById('taleShelfResumeLink');
  const resumeTitle = document.getElementById('taleShelfResumeTitle');
  const resumeDetail = document.getElementById('taleShelfResumeDetail');
  const storageNote = document.getElementById('taleShelfStorageNote');
  if (!catalogElement || !resume || !resumeLink || !resumeTitle || !resumeDetail || !storageNote) return;
  let volumes;
  try {
    volumes = JSON.parse(catalogElement.textContent);
    if (!Array.isArray(volumes) || volumes.length !== ids.length || volumes.some((volume, index) => !volume || volume.id !== ids[index] || !Array.isArray(volume.stages) || volume.stages.length !== 3 || !Array.isArray(volume.endings) || volume.endings.length !== 2)) return;
  } catch (_) { return; }
  const keys = ids.map(id => `changan:tale:${id}:v1`);
  const stages = ['一', '二', '三'];
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function knownList(value, allowed) {
    return Array.isArray(value) && value.length <= allowed.length && new Set(value).size === value.length && value.every(id => typeof id === 'string' && allowed.includes(id));
  }
  function readRecord(raw, volume) {
    if (raw === null) return { kind: 'empty' };
    try {
      if (typeof raw !== 'string' || raw.length > 60000) throw Error('save-size');
      const data = JSON.parse(raw);
      if (!object(data) || data.version !== 1 || data.storyId !== volume.id || typeof data.started !== 'boolean' || !Number.isInteger(data.stageIndex) || data.stageIndex < 0 || data.stageIndex > 2 || !knownList(data.clues, volume.clues) || !object(data.dialogues) || !knownList(data.seenEndings, volume.endings) || !knownList(data.revealed, volume.characters) || !Array.isArray(data.lamps) || data.lamps.length > volume.solution.length || !data.lamps.every((id, index) => id === volume.solution[index]) || data.ending !== null && !volume.endings.includes(data.ending)) throw Error('save-shape');
      for (const [stageId, choice] of Object.entries(data.dialogues)) {
        const stage = volume.stages.find(item => item.id === stageId);
        if (!stage || typeof choice !== 'string' || !stage.choices.includes(choice)) throw Error('save-dialogue');
      }
      const complete = stage => stage.clues.every(id => data.clues.includes(id)) && (!stage.required || Object.prototype.hasOwnProperty.call(data.dialogues, stage.id));
      if (volume.stages.slice(0, data.stageIndex).some(stage => !complete(stage))) throw Error('save-stage');
      const allowedStages = volume.stages.slice(0, data.stageIndex + 1);
      if (data.clues.some(id => !allowedStages.some(stage => stage.clues.includes(id))) || Object.keys(data.dialogues).some(id => !allowedStages.some(stage => stage.id === id))) throw Error('save-future');
      if (data.lamps.length && (data.stageIndex !== 2 || !complete(volume.stages[2]))) throw Error('save-puzzle');
      if (data.ending !== null && (data.stageIndex !== 2 || !complete(volume.stages[2]) || data.lamps.length !== volume.solution.length || !data.seenEndings.includes(data.ending))) throw Error('save-ending');
      if (!data.started && (data.stageIndex || data.clues.length || Object.keys(data.dialogues).length || data.lamps.length || data.ending !== null)) throw Error('save-not-started');
      const timestamp = typeof data.updatedAt === 'string' ? Date.parse(data.updatedAt) : NaN;
      if (data.started && (!Number.isFinite(timestamp) || timestamp <= 0 || new Date(timestamp).toISOString() !== data.updatedAt)) throw Error('save-time');
      return { kind: data.started ? data.ending ? 'finished' : 'unfinished' : 'empty', stageIndex: data.stageIndex, clueCount: data.clues.length, seenEndings: data.seenEndings.length, timestamp: Number.isFinite(timestamp) ? timestamp : 0 };
    } catch (_) { return { kind: 'invalid' }; }
  }
  function refresh() {
    let storageAvailable = true;
    const records = volumes.map((volume, index) => {
      try { return readRecord(localStorage.getItem(keys[index]), volume); }
      catch (_) { storageAvailable = false; return { kind: 'unavailable' }; }
    });
    let latest = -1;
    volumes.forEach((volume, index) => {
      const card = document.querySelector(`[data-tale="${volume.id}"]`);
      if (!card) return;
      const status = card.querySelector('[data-tale-status]');
      const action = card.querySelector('[data-tale-action]');
      if (!status || !action) return;
      const record = records[index];
      const title = record.kind === 'unfinished' ? `第${stages[record.stageIndex]}幕 · 线索 ${record.clueCount} / 3` : record.kind === 'finished' ? `已收卷 · 已读结尾 ${record.seenEndings} / 2` : record.kind === 'invalid' ? '记录待核对 · 可打开此卷' : record.kind === 'unavailable' ? '本机进度暂不可读' : '未启卷';
      const label = record.kind === 'unfinished' ? '接着此卷' : record.kind === 'finished' ? '回看此卷' : '翻开此卷';
      status.textContent = title;
      action.textContent = label;
      card.dataset.progress = record.kind;
      card.setAttribute('aria-label', `${volume.title}，${title}，${label}`);
      if (record.kind === 'unfinished' && (latest < 0 || record.timestamp > records[latest].timestamp)) latest = index;
    });
    resume.hidden = latest < 0;
    if (latest >= 0) {
      const volume = volumes[latest], record = records[latest];
      resumeTitle.textContent = `《${volume.title}》`;
      resumeDetail.textContent = `上次走到第${stages[record.stageIndex]}幕 · ${volume.stages[record.stageIndex].title.replace(/^[一二三]\s*[·・]\s*/, '')}。线索已记下 ${record.clueCount} / 3 件，回来可接着这一幕。`;
      resumeLink.href = `/tales/${volume.id}.html`;
      resumeLink.setAttribute('aria-label', `接着上次走，继续${volume.title}第${stages[record.stageIndex]}幕`);
    }
    storageNote.hidden = storageAvailable;
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if (event.key === null || keys.includes(event.key)) refresh(); });
  refresh();
})();
