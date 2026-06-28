/* ============ GDS GK 500 — App logic ============ */
(function(){
  'use strict';

  // ---------- State ----------
  const state = {
    lang: localStorage.getItem('gk500_lang') || 'en', // 'en' | 'hi'
    mode: 'practice', // 'practice' | 'exam'
    category: 'all',
    pool: [],          // current quiz questions
    cur: 0,
    answers: {},       // qIndex -> selected option index (or null for skip)
    startTime: 0,
    timerSecs: 0,
    timerInterval: null,
    reviewed: false,
  };

  const CAT_META = {
    postal:       { name:'India Post & Postal',     hi:'डाक विभाग',         icon:'fa-envelope-open-text', color:'#b8351a' },
    history:      { name:'History',                  hi:'इतिहास',             icon:'fa-landmark-dome',      color:'#8a2410' },
    geography:    { name:'Geography',                hi:'भूगोल',              icon:'fa-mountain-sun',       color:'#14493a' },
    polity:       { name:'Polity & Constitution',   hi:'राजनीति',            icon:'fa-scale-balanced',     color:'#0f3a6b' },
    science:      { name:'Science & Tech',          hi:'विज्ञान',            icon:'fa-flask',              color:'#7a1f4a' },
    economy:      { name:'Economy',                  hi:'अर्थव्यवस्था',        icon:'fa-indian-rupee-sign',  color:'#c98a2b' },
    currentaffairs:{name:'Current Affairs',         hi:'समसामयिकी',          icon:'fa-newspaper',          color:'#2a6b8a' },
    misc:         { name:'Sports, Awards & Misc',   hi:'खेल, पुरस्कार',     icon:'fa-trophy',             color:'#4a3a30' }
  };

  // ---------- Data check ----------
  const QUESTIONS = window.QUESTIONS || [];
  if(!QUESTIONS.length){
    console.error('No questions loaded');
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    renderCategoryCards();
    bindEvents();
    updateStats();
  });

  function updateStats(){
    document.getElementById('stat-total').textContent = QUESTIONS.length;
    const cats = new Set(QUESTIONS.map(q => q.cat));
    document.getElementById('stat-cats').textContent = cats.size;
  }

  // ---------- Category cards ----------
  function renderCategoryCards(){
    const grid = document.getElementById('catGrid');
    grid.innerHTML = '';

    // "All" card first
    const allCard = document.createElement('button');
    allCard.className = 'cat-card all-set';
    allCard.setAttribute('data-testid','cat-all');
    allCard.innerHTML = `
      <div class="cicon" style="background:#b8351a"><i class="fa-solid fa-stars fa-layer-group"></i></div>
      <h3>Full 500 Set</h3>
      <p>All categories combined — the complete practice bank.</p>
      <div class="cmeta"><span>Start full test</span><span class="ctag">${QUESTIONS.length} Q</span></div>`;
    allCard.addEventListener('click', () => startQuiz('all','practice'));
    grid.appendChild(allCard);

    // Each category
    Object.entries(CAT_META).forEach(([key, meta]) => {
      const count = QUESTIONS.filter(q => q.cat === key).length;
      if(!count) return;
      const card = document.createElement('button');
      card.className = 'cat-card';
      card.setAttribute('data-testid','cat-'+key);
      card.innerHTML = `
        <div class="cicon" style="background:${meta.color}"><i class="fa-solid ${meta.icon}"></i></div>
        <h3>${meta.name}</h3>
        <p>${meta.hi}</p>
        <div class="cmeta"><span>Practice</span><span class="ctag">${count} Q</span></div>`;
      card.addEventListener('click', () => startQuiz(key,'practice'));
      grid.appendChild(card);
    });
  }

  // ---------- Events ----------
  function bindEvents(){
    document.getElementById('startPracticeBtn').addEventListener('click', () => startQuiz('all','practice'));
    document.getElementById('startExamBtn').addEventListener('click', () => startQuiz('all','exam'));
    document.getElementById('jumpCatBtn').addEventListener('click', () => {
      document.getElementById('view-categories-anchor').scrollIntoView({behavior:'smooth'});
    });

    document.querySelectorAll('[data-nav]').forEach(b => {
      b.addEventListener('click', () => {
        const key = b.dataset.nav;
        showView('home');
        if(key === 'categories') setTimeout(() => document.getElementById('view-categories-anchor').scrollIntoView({behavior:'smooth'}), 30);
        else if(key === 'about') setTimeout(() => document.querySelector('.about-sec').scrollIntoView({behavior:'smooth'}), 30);
        else window.scrollTo({top:0,behavior:'smooth'});
      });
    });

    document.getElementById('langToggle').addEventListener('click', toggleLang);

    // Quiz controls
    document.getElementById('quitBtn').addEventListener('click', () => {
      if(confirm('Quit the current quiz? Progress will be lost.')){
        stopTimer();
        showView('home');
      }
    });
    document.getElementById('prevBtn').addEventListener('click', () => navQ(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navQ(1));
    document.getElementById('skipBtn').addEventListener('click', () => {
      state.answers[state.cur] = null;
      navQ(1);
    });
    document.getElementById('submitBtn').addEventListener('click', submitQuiz);

    // Result
    document.getElementById('retryBtn').addEventListener('click', () => startQuiz(state.category, state.mode));
    document.getElementById('homeBtn').addEventListener('click', () => showView('home'));
    document.getElementById('reviewBtn').addEventListener('click', toggleReview);

    // keyboard
    document.addEventListener('keydown', (e) => {
      if(!document.getElementById('view-quiz').classList.contains('active')) return;
      if(e.key === 'ArrowRight') navQ(1);
      else if(e.key === 'ArrowLeft') navQ(-1);
      else if(['1','2','3','4'].includes(e.key)){
        const idx = parseInt(e.key,10) - 1;
        const btns = document.querySelectorAll('.opt');
        if(btns[idx]) btns[idx].click();
      }
    });
  }

  // ---------- Language ----------
  function toggleLang(){
    state.lang = state.lang === 'en' ? 'hi' : 'en';
    localStorage.setItem('gk500_lang', state.lang);
    applyLang();
    if(document.getElementById('view-quiz').classList.contains('active')) renderQ();
  }
  function applyLang(){
    document.body.classList.toggle('lang-hi', state.lang === 'hi');
    document.getElementById('langLabel').textContent = state.lang === 'en' ? 'हिं/EN' : 'EN/हिं';
  }

  // ---------- View switch ----------
  function showView(key){
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + key).classList.add('active');
    window.scrollTo({top:0, behavior:'instant'});
  }

  // ---------- Quiz lifecycle ----------
  function startQuiz(category, mode){
    state.category = category;
    state.mode = mode;
    state.cur = 0;
    state.answers = {};
    state.reviewed = false;

    let pool = category === 'all'
      ? QUESTIONS.slice()
      : QUESTIONS.filter(q => q.cat === category);

    if(mode === 'exam'){
      // pick 50 random
      pool = shuffle(pool).slice(0, Math.min(50, pool.length));
      state.timerSecs = 30 * 60;
    } else {
      state.timerSecs = 0;
    }

    state.pool = pool;

    // Update UI chips
    document.getElementById('quizCat').textContent = category === 'all' ? 'All Categories' : (CAT_META[category]?.name || category);
    document.getElementById('quizMode').textContent = mode === 'exam' ? 'Exam · 30m' : 'Practice';
    const timerChip = document.getElementById('quizTimer');
    if(mode === 'exam'){
      timerChip.hidden = false;
      startTimer();
    } else {
      timerChip.hidden = true;
      stopTimer();
    }

    renderPalette();
    renderQ();
    showView('quiz');
  }

  // ---------- Timer ----------
  function startTimer(){
    stopTimer();
    updateTimerUI();
    state.timerInterval = setInterval(() => {
      state.timerSecs--;
      if(state.timerSecs <= 0){
        state.timerSecs = 0;
        stopTimer();
        updateTimerUI();
        alert('Time up! Submitting now.');
        submitQuiz();
        return;
      }
      updateTimerUI();
    }, 1000);
  }
  function stopTimer(){ if(state.timerInterval){ clearInterval(state.timerInterval); state.timerInterval = null; } }
  function updateTimerUI(){
    const s = state.timerSecs;
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    document.getElementById('timerTxt').textContent = `${mm}:${ss}`;
    document.getElementById('quizTimer').classList.toggle('warn', s < 60);
  }

  // ---------- Render single question ----------
  function renderQ(){
    const q = state.pool[state.cur];
    if(!q){ return; }

    document.getElementById('qNumLabel').textContent = `Q${state.cur+1}`;
    document.getElementById('qCatLabel').textContent = (CAT_META[q.cat]?.name || q.cat);
    document.getElementById('qText').textContent = q.q;
    document.getElementById('qTextAlt').textContent = q.qh || '';

    // Options
    const box = document.getElementById('optionsBox');
    box.innerHTML = '';
    const letters = ['A','B','C','D'];
    q.opts.forEach((optText, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt';
      btn.setAttribute('data-testid','option-'+i);
      const hi = (q.opth && q.opth[i]) || '';
      btn.innerHTML = `
        <span class="key">${letters[i]}</span>
        <span class="optcontent">
          <span>${escapeHtml(optText)}</span>
          <span class="ohi">${escapeHtml(hi)}</span>
        </span>`;
      btn.addEventListener('click', () => selectOpt(i));
      box.appendChild(btn);
    });

    // If already answered (practice mode shows immediate feedback)
    if(state.answers[state.cur] !== undefined){
      markSelected(state.answers[state.cur]);
      if(state.mode === 'practice') revealAnswer();
    } else {
      hideExplain();
    }

    // Nav/footer
    document.getElementById('prevBtn').disabled = state.cur === 0;
    const isLast = state.cur === state.pool.length - 1;
    document.getElementById('nextBtn').hidden = isLast;
    document.getElementById('submitBtn').hidden = !isLast;

    // Progress
    document.getElementById('qProgTxt').textContent = `${state.cur+1} / ${state.pool.length}`;
    document.getElementById('qBarFill').style.width = `${((state.cur+1)/state.pool.length)*100}%`;

    updatePalette();
  }

  function selectOpt(i){
    // In exam mode allow changing until submit. In practice, lock after reveal.
    if(state.mode === 'practice' && state.answers[state.cur] !== undefined && state.answers[state.cur] !== null) return;
    state.answers[state.cur] = i;
    markSelected(i);
    if(state.mode === 'practice') revealAnswer();
    updatePalette();
  }

  function markSelected(i){
    document.querySelectorAll('.opt').forEach((b,idx) => {
      b.classList.toggle('sel', idx === i);
    });
  }

  function revealAnswer(){
    const q = state.pool[state.cur];
    const chosen = state.answers[state.cur];
    document.querySelectorAll('.opt').forEach((b,idx) => {
      b.disabled = true;
      b.classList.remove('sel');
      if(idx === q.a) b.classList.add('correct');
      else if(idx === chosen) b.classList.add('wrong');
    });
    showExplain(q);
  }

  function showExplain(q){
    const box = document.getElementById('explainBox');
    const txt = document.getElementById('explainTxt');
    const expl = state.lang === 'hi' ? (q.exph || q.exp) : (q.exp || q.exph || '');
    txt.textContent = expl || '—';
    box.hidden = false;
  }
  function hideExplain(){
    document.getElementById('explainBox').hidden = true;
  }

  function navQ(delta){
    const nxt = state.cur + delta;
    if(nxt < 0 || nxt >= state.pool.length) return;
    state.cur = nxt;
    renderQ();
  }

  // ---------- Palette ----------
  function renderPalette(){
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = '';
    state.pool.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'pbtn';
      b.textContent = i+1;
      b.setAttribute('data-testid','palette-'+i);
      b.addEventListener('click', () => { state.cur = i; renderQ(); });
      grid.appendChild(b);
    });
    updatePalette();
  }
  function updatePalette(){
    const btns = document.querySelectorAll('.pbtn');
    let answered = 0;
    btns.forEach((b,i) => {
      b.classList.remove('cur','ok','bad','skip');
      if(i === state.cur) b.classList.add('cur');
      const a = state.answers[i];
      if(a !== undefined){
        if(a === null){ b.classList.add('skip'); }
        else {
          answered++;
          if(state.mode === 'practice'){
            if(a === state.pool[i].a) b.classList.add('ok');
            else b.classList.add('bad');
          } else {
            b.classList.add('ok'); // just mark attempted
          }
        }
      }
    });
    document.getElementById('paletteScore').textContent = `Answered: ${answered} / ${state.pool.length}`;
  }

  // ---------- Submit / Result ----------
  function submitQuiz(){
    stopTimer();
    let correct = 0, wrong = 0, skip = 0;
    state.pool.forEach((q, i) => {
      const a = state.answers[i];
      if(a === undefined || a === null) skip++;
      else if(a === q.a) correct++;
      else wrong++;
    });
    const pct = Math.round((correct / state.pool.length) * 100);

    document.getElementById('scCorrect').textContent = correct;
    document.getElementById('scWrong').textContent = wrong;
    document.getElementById('scSkip').textContent = skip;
    document.getElementById('scPct').textContent = pct + '%';

    const badge = document.getElementById('resultBadge');
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSub');
    if(pct >= 70){
      badge.classList.remove('bad');
      badge.innerHTML = '<i class="fa-solid fa-trophy"></i>';
      title.textContent = 'Bahut badhiya!';
      sub.textContent = `You scored ${pct}% — ready for the real paper.`;
    } else if(pct >= 40){
      badge.classList.remove('bad');
      badge.innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
      title.textContent = 'Keep going!';
      sub.textContent = `You scored ${pct}% — revise weak areas and try again.`;
    } else {
      badge.classList.add('bad');
      badge.innerHTML = '<i class="fa-solid fa-book-open"></i>';
      title.textContent = 'Time to revise';
      sub.textContent = `You scored ${pct}% — go through explanations and retry.`;
    }

    renderReview();
    document.getElementById('reviewList').hidden = true;
    state.reviewed = false;
    showView('result');
  }

  function toggleReview(){
    const list = document.getElementById('reviewList');
    state.reviewed = !state.reviewed;
    list.hidden = !state.reviewed;
    document.getElementById('reviewBtn').innerHTML = state.reviewed
      ? '<i class="fa-solid fa-eye-slash"></i> Hide Review'
      : '<i class="fa-solid fa-eye"></i> Review Answers';
    if(state.reviewed) list.scrollIntoView({behavior:'smooth'});
  }

  function renderReview(){
    const list = document.getElementById('reviewList');
    list.innerHTML = '';
    const letters = ['A','B','C','D'];
    state.pool.forEach((q, i) => {
      const a = state.answers[i];
      const item = document.createElement('div');
      item.className = 'review-item';
      let givenLabel;
      if(a === undefined || a === null){
        givenLabel = `<span class="given skip">Skipped</span>`;
      } else if(a === q.a){
        givenLabel = `<span class="correct">${letters[a]}. ${escapeHtml(q.opts[a])} ✓</span>`;
      } else {
        givenLabel = `<span class="given bad">${letters[a]}. ${escapeHtml(q.opts[a])} ✗</span>`;
      }
      const expl = state.lang === 'hi' ? (q.exph || q.exp) : (q.exp || q.exph || '');
      item.innerHTML = `
        <p class="rq">Q${i+1}. ${escapeHtml(q.q)}</p>
        ${q.qh ? `<p class="rqh">${escapeHtml(q.qh)}</p>` : ''}
        <div class="rans">
          <div><span class="lbl">Your answer:</span> ${givenLabel}</div>
          <div><span class="lbl">Correct:</span> <span class="correct">${letters[q.a]}. ${escapeHtml(q.opts[q.a])}</span></div>
        </div>
        ${expl ? `<div class="rexp">${escapeHtml(expl)}</div>` : ''}`;
      list.appendChild(item);
    });
  }

  // ---------- Utils ----------
  function shuffle(arr){
    const a = arr.slice();
    for(let i = a.length-1; i > 0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }
  function escapeHtml(s){
    if(s == null) return '';
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

})();
