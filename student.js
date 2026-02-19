/**
 * =============================================
 * QuizGlass – student.js
 * Loads the published quiz from localStorage
 * and handles the student quiz-taking experience.
 * Correct answers are NEVER displayed until
 * after submission.
 * =============================================
 */

/* =============================================
   STATE
   ============================================= */
let quizData = [];   // Loaded from localStorage (includes correctIndex for scoring only)
let studentAnswers = [];  // Student's selected option per question (-1 = unanswered)
let currentQ = 0;   // Current question index

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    injectSVGDefs();

    // Load quiz from localStorage
    const stored = localStorage.getItem('quizglass_quiz');

    if (!stored) {
        // No quiz published → show empty state
        document.getElementById('noQuizSection').classList.remove('hidden');
        return;
    }

    quizData = JSON.parse(stored);
    studentAnswers = new Array(quizData.length).fill(-1);

    // Show quiz section
    showStudentSection();

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        const quizVisible = !document.getElementById('studentSection').classList.contains('hidden');
        if (!quizVisible) return;
        if (e.key === 'ArrowRight') nextQuestion();
        if (e.key === 'ArrowLeft') prevQuestion();
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light-glass');
    });
});

/* =============================================
   INJECT SVG DEFS
   Gradient for the score ring.
   ============================================= */
function injectSVGDefs() {
    // Already inlined in student.html SVG — nothing extra needed
}

/* =============================================
   SHOW STUDENT SECTION
   Reveals and animates the quiz interface.
   ============================================= */
function showStudentSection() {
    const sec = document.getElementById('studentSection');
    sec.classList.remove('hidden');
    sec.classList.add('animate__fadeInUp');

    buildProgressDots();
    renderQuestion(0);

    gsap.from('.glass-card', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
}

/* =============================================
   BUILD PROGRESS DOTS
   One dot per question.
   ============================================= */
function buildProgressDots() {
    const wrap = document.getElementById('progressDots');
    wrap.innerHTML = '';
    quizData.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.id = `dot${i}`;
        wrap.appendChild(dot);
    });
}

/* =============================================
   RENDER QUESTION
   Displays one question at a time. Correct
   answers are NOT shown here — only after submit.
   ============================================= */
function renderQuestion(idx) {
    currentQ = idx;
    const q = quizData[idx];
    const letters = ['A', 'B', 'C', 'D'];

    document.getElementById('questionNumber').textContent = `Question ${idx + 1}`;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('progressText').textContent = `Question ${idx + 1} of ${quizData.length}`;

    // Render option cards — NO indication of which is correct
    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = '';
    q.options.forEach((opt, i) => {
        const card = document.createElement('div');
        card.className = 'option-card' + (studentAnswers[idx] === i ? ' selected' : '');
        card.dataset.idx = i;
        card.innerHTML = `
      <span class="option-badge">${letters[i]}</span>
      <span class="option-text">${opt}</span>`;
        card.addEventListener('click', () => selectOption(idx, i));
        grid.appendChild(card);
    });

    // GSAP card entrance
    gsap.fromTo('#questionCard',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    updateDots(idx);

    // Show/hide navigation buttons
    document.getElementById('prevBtn').classList.toggle('hidden', idx === 0);
    const isLast = idx === quizData.length - 1;
    document.getElementById('nextBtn').classList.toggle('hidden', isLast);
    document.getElementById('submitBtn').classList.toggle('hidden', !isLast);
}

/* =============================================
   SELECT OPTION
   Records the student's answer and highlights chosen card.
   ============================================= */
function selectOption(qIdx, optIdx) {
    studentAnswers[qIdx] = optIdx;

    document.querySelectorAll('.option-card').forEach((card, i) => {
        card.classList.toggle('selected', i === optIdx);
    });

    // Mark dot as answered
    const dot = document.getElementById(`dot${qIdx}`);
    if (dot) dot.classList.add('answered');
}

/* =============================================
   UPDATE DOTS
   ============================================= */
function updateDots(activeIdx) {
    for (let i = 0; i < quizData.length; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (!dot) continue;
        dot.classList.toggle('active', i === activeIdx);
        if (studentAnswers[i] !== -1) dot.classList.add('answered');
    }
}

/* =============================================
   NEXT QUESTION
   Blocks progress if current question unanswered.
   ============================================= */
function nextQuestion() {
    if (studentAnswers[currentQ] === -1) {
        Swal.fire({
            icon: 'info',
            title: 'Select an answer first',
            text: 'Please choose an option before moving on.',
            timer: 1800,
            showConfirmButton: false,
            background: 'rgba(20,10,50,0.95)',
            color: '#f0f4ff',
        });
        // Shake effect
        gsap.fromTo('#questionCard',
            { x: -8 },
            { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)', clearProps: 'x' }
        );
        return;
    }
    if (currentQ < quizData.length - 1) {
        gsap.fromTo('#questionCard',
            { opacity: 1, x: 0 },
            {
                opacity: 0, x: -30, duration: 0.22, ease: 'power1.in',
                onComplete: () => renderQuestion(currentQ + 1)
            }
        );
    }
}

/* =============================================
   PREV QUESTION
   ============================================= */
function prevQuestion() {
    if (currentQ > 0) {
        gsap.fromTo('#questionCard',
            { opacity: 1, x: 0 },
            {
                opacity: 0, x: 30, duration: 0.22, ease: 'power1.in',
                onComplete: () => renderQuestion(currentQ - 1)
            }
        );
    }
}

/* =============================================
   SUBMIT QUIZ
   Checks all answered, calculates score,
   then reveals results. Correct answers are
   only shown HERE, after submission.
   ============================================= */
function submitQuiz() {
    // Check for unanswered questions
    const unanswered = studentAnswers.findIndex(a => a === -1);
    if (unanswered !== -1) {
        Swal.fire({
            icon: 'warning',
            title: `Q${unanswered + 1} Not Answered`,
            text: 'Please answer all questions before submitting.',
            background: 'rgba(20,10,50,0.95)',
            color: '#f0f4ff',
            confirmButtonColor: '#7c3aed',
        });
        renderQuestion(unanswered);
        return;
    }

    // Calculate score
    let score = 0;
    quizData.forEach((q, i) => {
        if (studentAnswers[i] === q.correctIndex) score++;
    });

    showResults(score);
}

/* =============================================
   SHOW RESULTS
   Reveals score ring, counter, and answer review.
   Only now are correct answers made visible.
   ============================================= */
function showResults(score) {
    document.getElementById('studentSection').classList.add('hidden');

    const resultSec = document.getElementById('resultSection');
    resultSec.classList.remove('hidden');
    resultSec.classList.add('animate__fadeInUp');

    // Smooth scroll to result
    resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const pct = Math.round((score / quizData.length) * 100);
    document.getElementById('scorePct').textContent = `${pct}%`;
    document.getElementById('scoreMsg').textContent = getScoreMessage(score);

    // GSAP animated score counter
    gsap.to({ val: 0 }, {
        val: score, duration: 1.2, ease: 'power2.out',
        onUpdate: function () {
            document.getElementById('scoreNum').textContent = Math.round(this.targets()[0].val);
        }
    });

    // Animate ring progress
    const circumference = 327;
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
        document.getElementById('ringProgress').style.strokeDashoffset = offset;
    }, 100);

    // Build answer review with correct/incorrect highlighting
    buildAnswersReview();

    // 🎉 Confetti on perfect score
    if (score === quizData.length) {
        setTimeout(fireConfetti, 800);
    }
}

/* =============================================
   BUILD ANSWERS REVIEW
   Shows each question, the student's choice,
   and highlights correct (green) / wrong (red).
   ============================================= */
function buildAnswersReview() {
    const letters = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('answersReview');
    container.innerHTML = '';

    quizData.forEach((q, i) => {
        const userIdx = studentAnswers[i];
        const correct = q.correctIndex;
        const isCorrect = userIdx === correct;

        const optPills = q.options.map((opt, idx) => {
            let cls = 'r-option';
            if (idx === correct) cls += ' r-correct';
            else if (idx === userIdx && !isCorrect) cls += ' r-incorrect';
            return `<span class="${cls}">${letters[idx]}: ${opt}</span>`;
        }).join('');

        const statusIcon = isCorrect
            ? `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i>`
            : `<i class="fa-solid fa-circle-xmark"  style="color:var(--error)"></i>`;

        container.insertAdjacentHTML('beforeend', `
      <div class="review-item animate__animated animate__fadeInUp"
           style="animation-delay:${i * 0.08}s">
        <div class="r-question">
          <span class="r-num">Q${i + 1} ${statusIcon}</span>
          ${q.question}
        </div>
        <div class="review-answers">${optPills}</div>
      </div>`);
    });
}

/* =============================================
   SCORE MESSAGE
   ============================================= */
function getScoreMessage(score) {
    const total = quizData.length;
    if (score === total) return '🎉 Perfect Score! Outstanding!';
    if (score >= total * 0.8) return '🌟 Excellent! Almost perfect!';
    if (score >= total * 0.6) return '👍 Good job! Keep practising!';
    if (score >= total * 0.4) return '📚 Not bad – review and retry!';
    return '💪 Keep going – you\'ll get there!';
}

/* =============================================
   RETAKE QUIZ
   Resets answers and restarts (same questions,
   no correct answers shown until submit again).
   ============================================= */
function retakeQuiz() {
    studentAnswers = new Array(quizData.length).fill(-1);
    currentQ = 0;

    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('animate__fadeInUp');
    document.getElementById('ringProgress').style.strokeDashoffset = 327;

    showStudentSection();
}

/* =============================================
   FIRE CONFETTI (perfect score)
   ============================================= */
function fireConfetti() {
    const duration = 2800;
    const end = Date.now() + duration;
    const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#a855f7', '#22d3ee', '#fbbf24', '#f472b6'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#a855f7', '#22d3ee', '#fbbf24', '#f472b6'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
}
