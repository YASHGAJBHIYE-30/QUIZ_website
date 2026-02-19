/**
 * =============================================
 * QuizGlass – Glassmorphism MCQ Quiz
 * script.js
 * =============================================
 */

/* =============================================
   DEFAULT QUESTIONS
   Pre-filled sample quiz so the form is ready
   out of the box. Teachers can edit these.
   ============================================= */
const DEFAULT_QUESTIONS = [
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1
  },
  {
    question: 'What is the chemical symbol for water?',
    options: ['O2', 'CO2', 'H2O', 'HO'],
    correctIndex: 2
  },
  {
    question: 'How many continents are there on Earth?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2
  },
  {
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Michelangelo', 'Leonardo da Vinci'],
    correctIndex: 3
  },
  {
    question: 'What is the speed of light (approx.) in km/s?',
    options: ['150,000 km/s', '300,000 km/s', '450,000 km/s', '500,000 km/s'],
    correctIndex: 1
  }
];

/* =============================================
   STATE
   ============================================= */
let quizData = [];          // Array of { question, options, correctIndex }
let studentAnswers = [];    // Index of selected option per question (-1 = none)
let currentQ = 0;           // Current question index (student view)
let shuffleEnabled = false; // Shuffle questions before student attempt

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Inject SVG gradient for score ring
  injectSVGDefs();

  // Build the 5 question blocks in the teacher form
  buildTeacherForm();

  // Pre-fill the form with default questions
  prefillForm();

  // Set up radio-option click behaviour
  attachRadioOptions();

  // Form submit → Save Quiz
  document.getElementById('quizBuilderForm').addEventListener('submit', saveQuiz);

  // Keyboard shortcut: Ctrl+S → Save Quiz
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveQuiz(e); }
    // Arrow keys for student navigation
    if (!document.getElementById('studentSection').classList.contains('hidden')) {
      if (e.key === 'ArrowRight') nextQuestion();
      if (e.key === 'ArrowLeft') prevQuestion();
    }
  });

  // Shuffle toggle
  document.getElementById('shuffleToggle').addEventListener('change', function () {
    shuffleEnabled = this.checked;
  });

  // Dark / Light glass theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-glass');
  });

  // GSAP entrance animation for header logo
  gsap.from('.logo', { duration: 0.8, y: -20, opacity: 0, ease: 'power3.out', delay: 0.3 });
});

/* =============================================
   INJECT SVG GRADIENT DEFS
   Needed for the circular score ring to use a
   gradient stroke via SVG <defs>.
   ============================================= */
function injectSVGDefs() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = `
    <defs>
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#a78bfa"/>
        <stop offset="100%" stop-color="#22d3ee"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(svg);
}

/* =============================================
   BUILD TEACHER FORM
   Dynamically render 5 question blocks.
   ============================================= */
function buildTeacherForm() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const letters = ['A', 'B', 'C', 'D'];
    const optionInputs = letters.map(l => `
      <div class="option-row">
        <span class="option-label">${l}</span>
        <input class="glass-input" type="text"
               id="q${i}_opt${l}" name="q${i}_opt${l}"
               placeholder="Option ${l}" autocomplete="off" />
      </div>`).join('');

    const radioButtons = letters.map((l, idx) => `
      <label class="radio-option" data-q="${i}" data-idx="${idx}">
        <input type="radio" name="correct${i}" value="${idx}" />
        ${l}
      </label>`).join('');

    container.insertAdjacentHTML('beforeend', `
      <div class="question-block animate__animated animate__fadeInUp"
           style="animation-delay:${i * 0.07}s">
        <div class="q-header">
          <span class="q-num">Q${i + 1}</span>
          <label for="q${i}_text">Question ${i + 1}</label>
        </div>
        <input class="glass-input" type="text"
               id="q${i}_text" name="q${i}_text"
               placeholder="Enter your question here…" autocomplete="off" />
        <div class="options-builder">${optionInputs}</div>
        <div class="correct-wrap">
          <span><i class="fa-solid fa-circle-check"></i> Correct Answer:</span>
          <div class="radio-group" id="rg${i}">${radioButtons}</div>
        </div>
      </div>`);
  }

  // Attach radio-option click after DOM insertion
  attachRadioOptions();
}

/* =============================================
   PREFILL FORM
   Fills in all inputs and selects the correct
   answer pills using DEFAULT_QUESTIONS data.
   ============================================= */
function prefillForm() {
  const letters = ['A', 'B', 'C', 'D'];

  DEFAULT_QUESTIONS.forEach((q, i) => {
    // Set question text
    const qInput = document.getElementById(`q${i}_text`);
    if (qInput) qInput.value = q.question;

    // Set each option
    letters.forEach((l, idx) => {
      const optInput = document.getElementById(`q${i}_opt${l}`);
      if (optInput) optInput.value = q.options[idx];
    });

    // Mark the correct answer pill as selected
    const correctPill = document.querySelector(
      `.radio-option[data-q="${i}"][data-idx="${q.correctIndex}"]`
    );
    if (correctPill) {
      // Deselect any previously selected siblings
      document.querySelectorAll(`.radio-option[data-q="${i}"]`)
        .forEach(el => el.classList.remove('selected'));
      correctPill.classList.add('selected');
      const radio = correctPill.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
  });
}

/* =============================================
   ATTACH RADIO OPTION CLICKS
   Makes the pill-shaped radio buttons work as
   styled toggles while keeping a hidden <input>.
   ============================================= */
function attachRadioOptions() {
  document.querySelectorAll('.radio-option').forEach(label => {
    label.addEventListener('click', function () {
      const q = this.dataset.q;
      // Deselect siblings
      document.querySelectorAll(`.radio-option[data-q="${q}"]`).forEach(el => el.classList.remove('selected'));
      this.classList.add('selected');
      // Trigger hidden radio
      this.querySelector('input[type="radio"]').checked = true;
    });
  });
}

/* =============================================
   SAVE QUIZ (Teacher)
   Validates inputs and stores quiz data.
   ============================================= */
function saveQuiz(e) {
  if (e && e.preventDefault) e.preventDefault();

  const data = [];
  let errorMsg = '';

  for (let i = 0; i < 5; i++) {
    const question = document.getElementById(`q${i}_text`).value.trim();
    const letters = ['A', 'B', 'C', 'D'];
    const options = letters.map(l => document.getElementById(`q${i}_opt${l}`).value.trim());
    const radioEl = document.querySelector(`input[name="correct${i}"]:checked`);

    // --- Validation ---
    if (!question) { errorMsg = `Question ${i + 1} text is empty.`; break; }
    if (options.some(o => !o)) { errorMsg = `All 4 options for Q${i + 1} are required.`; break; }
    if (!radioEl) { errorMsg = `Please select the correct answer for Q${i + 1}.`; break; }

    data.push({ question, options, correctIndex: parseInt(radioEl.value) });
  }

  if (errorMsg) {
    // SweetAlert2 error toast
    Swal.fire({
      icon: 'warning',
      title: 'Incomplete Quiz',
      text: errorMsg,
      background: 'rgba(20,10,50,0.95)',
      color: '#f0f4ff',
      confirmButtonColor: '#7c3aed',
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: { popup: 'swal-glass' }
    });
    return;
  }

  // Store data (optionally shuffled)
  quizData = shuffleEnabled ? shuffleArray([...data]) : data;
  studentAnswers = new Array(5).fill(-1);
  currentQ = 0;

  // Lock teacher form
  document.getElementById('teacherSection').classList.add('quiz-locked');

  // SweetAlert2 success
  Swal.fire({
    icon: 'success',
    title: 'Quiz Saved!',
    text: 'Students can now take the quiz below.',
    timer: 1800,
    timerProgressBar: true,
    showConfirmButton: false,
    background: 'rgba(20,10,50,0.95)',
    color: '#f0f4ff',
    backdrop: 'rgba(0,0,0,0.5)',
  }).then(() => {
    showStudentSection();
  });
}

/* =============================================
   SHOW STUDENT SECTION
   Animate in the student quiz card.
   ============================================= */
function showStudentSection() {
  const sec = document.getElementById('studentSection');
  sec.classList.remove('hidden');
  sec.classList.add('animate__fadeInUp');

  // GSAP scroll to student section
  gsap.to(window, { duration: 0.6, scrollTo: sec, ease: 'power2.inOut' });

  buildProgressDots();
  renderQuestion(0);
}

/* =============================================
   BUILD PROGRESS DOTS
   Creates 5 dots representing each question.
   ============================================= */
function buildProgressDots() {
  const wrap = document.getElementById('progressDots');
  wrap.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.id = `dot${i}`;
    wrap.appendChild(dot);
  }
}

/* =============================================
   RENDER QUESTION
   Displays the question at index `idx` with
   animated transitions.
   ============================================= */
function renderQuestion(idx) {
  currentQ = idx;
  const q = quizData[idx];
  const letters = ['A', 'B', 'C', 'D'];

  document.getElementById('questionNumber').textContent = `Question ${idx + 1}`;
  document.getElementById('questionText').textContent = q.question;
  document.getElementById('progressText').textContent = `Question ${idx + 1} of 5`;

  // Options
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

  // GSAP animate card in
  gsap.fromTo('#questionCard',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
  );

  // Update dots
  updateDots(idx);

  // Navigation buttons
  document.getElementById('prevBtn').classList.toggle('hidden', idx === 0);
  const isLast = idx === 4;
  document.getElementById('nextBtn').classList.toggle('hidden', isLast);
  document.getElementById('submitBtn').classList.toggle('hidden', !isLast);
}

/* =============================================
   SELECT OPTION
   Records the student's choice and highlights it.
   ============================================= */
function selectOption(qIdx, optIdx) {
  studentAnswers[qIdx] = optIdx;

  // Update UI
  document.querySelectorAll('.option-card').forEach((card, i) => {
    card.classList.toggle('selected', i === optIdx);
  });

  // Mark dot as answered
  const dot = document.getElementById(`dot${qIdx}`);
  if (dot) dot.classList.add('answered');
}

/* =============================================
   UPDATE DOTS
   Reflect active / answered states.
   ============================================= */
function updateDots(activeIdx) {
  for (let i = 0; i < 5; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (!dot) continue;
    dot.classList.toggle('active', i === activeIdx);
    if (studentAnswers[i] !== -1) dot.classList.add('answered');
  }
}

/* =============================================
   NEXT QUESTION
   Moves forward; blocks if unanswered.
   ============================================= */
function nextQuestion() {
  if (studentAnswers[currentQ] === -1) {
    Swal.fire({
      icon: 'info',
      title: 'Please answer the question',
      text: 'Select an option before moving on.',
      timer: 1800,
      showConfirmButton: false,
      background: 'rgba(20,10,50,0.95)',
      color: '#f0f4ff',
    });
    // Shake the options grid
    gsap.fromTo('#questionCard', { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)', clearProps: 'x' });
    return;
  }
  if (currentQ < 4) {
    gsap.fromTo('#questionCard', { opacity: 1, x: 0 }, {
      opacity: 0, x: -30, duration: 0.22, ease: 'power1.in',
      onComplete: () => renderQuestion(currentQ + 1)
    });
  }
}

/* =============================================
   PREV QUESTION
   ============================================= */
function prevQuestion() {
  if (currentQ > 0) {
    gsap.fromTo('#questionCard', { opacity: 1, x: 0 }, {
      opacity: 0, x: 30, duration: 0.22, ease: 'power1.in',
      onComplete: () => renderQuestion(currentQ - 1)
    });
  }
}

/* =============================================
   SUBMIT QUIZ
   Validates all answered, then shows results.
   ============================================= */
function submitQuiz() {
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
  quizData.forEach((q, i) => { if (studentAnswers[i] === q.correctIndex) score++; });

  showResults(score);
}

/* =============================================
   SHOW RESULTS
   ============================================= */
function showResults(score) {
  // Hide student section
  document.getElementById('studentSection').classList.add('hidden');

  const resultSec = document.getElementById('resultSection');
  resultSec.classList.remove('hidden');
  resultSec.classList.add('animate__fadeInUp');

  gsap.to(window, { duration: 0.6, scrollTo: resultSec, ease: 'power2.inOut' });

  // Score reveal with GSAP counter
  const pct = Math.round((score / 5) * 100);
  document.getElementById('scorePct').textContent = `${pct}%`;
  document.getElementById('scoreMsg').textContent = getScoreMessage(score);

  // Animate the score number
  gsap.to({ val: 0 }, {
    val: score, duration: 1.2, ease: 'power2.out',
    onUpdate: function () {
      document.getElementById('scoreNum').textContent = Math.round(this.targets()[0].val);
    }
  });

  // Animate the score ring
  const circumference = 327; // 2 * π * 52
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(() => {
    document.getElementById('ringProgress').style.strokeDashoffset = offset;
  }, 100);

  // Build answers review
  buildAnswersReview();

  // 🎉 Full score confetti
  if (score === 5) {
    setTimeout(fireConfetti, 800);
  }
}

/* =============================================
   BUILD ANSWERS REVIEW
   Shows each question with correct/incorrect
   option highlighting.
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
      : `<i class="fa-solid fa-circle-xmark" style="color:var(--error)"></i>`;

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
   Returns encouraging feedback based on score.
   ============================================= */
function getScoreMessage(score) {
  if (score === 5) return '🎉 Perfect Score! Outstanding!';
  if (score === 4) return '🌟 Excellent! Almost perfect!';
  if (score === 3) return '👍 Good job! Keep practising!';
  if (score === 2) return '📚 Not bad – review and retry!';
  return '💪 Keep going – you\'ll get there!';
}

/* =============================================
   FIRE CONFETTI
   Uses canvas-confetti for full score celebration.
   ============================================= */
function fireConfetti() {
  const duration = 2800;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#a855f7', '#22d3ee', '#fbbf24', '#f472b6'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#a855f7', '#22d3ee', '#fbbf24', '#f472b6'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/* =============================================
   RETAKE QUIZ
   Resets student answers and starts quiz again.
   ============================================= */
function retakeQuiz() {
  studentAnswers = new Array(5).fill(-1);
  currentQ = 0;

  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('resultSection').classList.remove('animate__fadeInUp');

  // Reset ring
  document.getElementById('ringProgress').style.strokeDashoffset = 327;

  showStudentSection();
}

/* =============================================
   EDIT QUIZ
   Unlocks teacher form so questions can be changed.
   ============================================= */
function editQuiz() {
  // Reset everything
  quizData = [];
  studentAnswers = [];
  currentQ = 0;

  // Hide result and student sections
  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('studentSection').classList.add('hidden');
  document.getElementById('ringProgress').style.strokeDashoffset = 327;

  // Unlock teacher form
  document.getElementById('teacherSection').classList.remove('quiz-locked');

  gsap.to(window, { duration: 0.5, scrollTo: { y: 0 }, ease: 'power2.inOut' });
}

/* =============================================
   SHUFFLE ARRAY (Fisher-Yates)
   ============================================= */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* =============================================
   GSAP ScrollTo plugin polyfill
   Uses native scrollIntoView as fallback if
   GSAP's ScrollTo plugin is not loaded.
   ============================================= */
if (!gsap.plugins?.scrollTo) {
  // Minimal polyfill: override gsap.to when scrollTo target is detected
  const _gsapTo = gsap.to.bind(gsap);
  gsap.to = function (target, vars) {
    if (target === window && vars.scrollTo) {
      const el = vars.scrollTo;
      if (el instanceof Element) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (typeof el === 'number') {
        window.scrollTo({ top: el, behavior: 'smooth' });
      }
      delete vars.scrollTo;
      if (!Object.keys(vars).filter(k => !['duration', 'ease', 'onComplete', 'onUpdate'].includes(k)).length) return;
    }
    return _gsapTo(target, vars);
  };
}
