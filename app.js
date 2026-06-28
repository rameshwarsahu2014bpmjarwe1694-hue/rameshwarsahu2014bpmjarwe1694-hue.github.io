const QUESTIONS = [
    { cat: 'postal', q: 'Where is the headquarters of India Post?', a: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai'], correct: 0 },
    { cat: 'history', q: 'Who was the first President of India?', a: ['Nehru', 'Prasad', 'Azad', 'Patel'], correct: 1 }
];

const state = {
    cur: 0,
    pool: QUESTIONS,
    lang: 'en'
};

function renderCategoryCards() {
    const grid = document.getElementById('catGrid');
    grid.innerHTML = '<button class="cat-card" onclick="startQuiz()">Full Test (All Qs)</button>';
}

function startQuiz() {
    document.getElementById('view-home').classList.remove('active');
    document.getElementById('view-quiz').classList.add('active');
    renderQ();
}

function renderQ() {
    const q = state.pool[state.cur];
    document.getElementById('qContainer').innerHTML = `
        <h3>${q.q}</h3>
        ${q.a.map((opt, i) => `<p><input type="radio" name="opt" value="${i}"> ${opt}</p>`).join('')}
    `;
}

document.getElementById('nextBtn').addEventListener('click', () => {
    if (state.cur < state.pool.length - 1) {
        state.cur++;
        renderQ();
    } else {
        alert("Quiz Finished!");
    }
});

document.getElementById('quitBtn').addEventListener('click', () => location.reload());

// Initialize
renderCategoryCards();
