/**
 * =============================================
 * QuizGlass – teacher.js
 * Handles quiz building and publishing to
 * localStorage so students can access it.
 * =============================================
 */

/* =============================================
   DEFAULT QUESTIONS (pre-filled for convenience)
   Teachers can edit these before publishing.
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

let shuffleEnabled = false;

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    buildTeacherForm();
    prefillForm();
    attachRadioOptions();

    // If a quiz was already published, lock the form
    if (localStorage.getItem('quizglass_quiz')) {
        lockForm();
    }

    // Form submit → Publish Quiz
    document.getElementById('quizBuilderForm').addEventListener('submit', publishQuiz);

    // Ctrl+S shortcut
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); publishQuiz(e); }
    });

    // Shuffle toggle
    document.getElementById('shuffleToggle').addEventListener('change', function () {
        shuffleEnabled = this.checked;
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light-glass');
    });

    // GSAP entrance
    gsap.from('.glass-card', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.2 });
});

/* =============================================
   BUILD TEACHER FORM
   Renders 5 question blocks dynamically.
   ============================================= */
function buildTeacherForm() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < 5; i++) {
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
}

/* =============================================
   PREFILL FORM
   Fills inputs with DEFAULT_QUESTIONS data.
   Loads saved quiz from localStorage if present.
   ============================================= */
function prefillForm() {
    const letters = ['A', 'B', 'C', 'D'];

    // Try loading existing saved quiz for display
    const stored = localStorage.getItem('quizglass_quiz');
    const source = stored ? JSON.parse(stored) : DEFAULT_QUESTIONS;

    source.forEach((q, i) => {
        const qInput = document.getElementById(`q${i}_text`);
        if (qInput) qInput.value = q.question;

        letters.forEach((l, idx) => {
            const optInput = document.getElementById(`q${i}_opt${l}`);
            if (optInput) optInput.value = q.options[idx];
        });

        // Mark correct answer pill
        const correctPill = document.querySelector(
            `.radio-option[data-q="${i}"][data-idx="${q.correctIndex}"]`
        );
        if (correctPill) {
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
   Styled pill-shaped radio buttons.
   ============================================= */
function attachRadioOptions() {
    document.querySelectorAll('.radio-option').forEach(label => {
        label.addEventListener('click', function () {
            const q = this.dataset.q;
            document.querySelectorAll(`.radio-option[data-q="${q}"]`)
                .forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}

/* =============================================
   PUBLISH QUIZ
   Validates all fields, saves to localStorage,
   and locks the form so it cannot be changed.
   ============================================= */
function publishQuiz(e) {
    if (e && e.preventDefault) e.preventDefault();

    const letters = ['A', 'B', 'C', 'D'];
    const data = [];
    let errorMsg = '';

    for (let i = 0; i < 5; i++) {
        const question = document.getElementById(`q${i}_text`).value.trim();
        const options = letters.map(l => document.getElementById(`q${i}_opt${l}`).value.trim());
        const radioEl = document.querySelector(`input[name="correct${i}"]:checked`);

        if (!question) { errorMsg = `Question ${i + 1} text is empty.`; break; }
        if (options.some(o => !o)) { errorMsg = `All 4 options for Q${i + 1} are required.`; break; }
        if (!radioEl) { errorMsg = `Please select the correct answer for Q${i + 1}.`; break; }

        data.push({ question, options, correctIndex: parseInt(radioEl.value) });
    }

    if (errorMsg) {
        Swal.fire({
            icon: 'warning',
            title: 'Incomplete Quiz',
            text: errorMsg,
            background: 'rgba(20,10,50,0.95)',
            color: '#f0f4ff',
            confirmButtonColor: '#7c3aed',
        });
        return;
    }

    // Optionally shuffle before saving
    const toSave = shuffleEnabled ? shuffleArray([...data]) : data;

    // 🔒 Save to localStorage (students will read this)
    localStorage.setItem('quizglass_quiz', JSON.stringify(toSave));

    Swal.fire({
        icon: 'success',
        title: '🎉 Quiz Published!',
        html: `Students can now open <strong>student.html</strong> to take the quiz.<br><br>
           <a href="student.html" target="_blank"
              style="color:#a78bfa;font-weight:700;text-decoration:underline">
             Open Student Page →
           </a>`,
        background: 'rgba(20,10,50,0.95)',
        color: '#f0f4ff',
        confirmButtonColor: '#7c3aed',
        confirmButtonText: 'Got it!',
    }).then(() => {
        lockForm();
    });
}

/* =============================================
   LOCK FORM
   Disables all inputs once the quiz is published.
   Shows the published banner.
   ============================================= */
function lockForm() {
    document.getElementById('teacherSection').classList.add('quiz-locked');
    document.getElementById('publishedBanner').classList.remove('hidden');

    // GSAP animate banner in
    gsap.from('#publishedBanner', { y: -12, opacity: 0, duration: 0.5, ease: 'power3.out' });
}

/* =============================================
   UNLOCK QUIZ
   Removes quiz from localStorage and unlocks form
   so the teacher can start fresh.
   ============================================= */
function unlockQuiz() {
    Swal.fire({
        icon: 'question',
        title: 'Edit Quiz?',
        text: 'This will unpublish the current quiz. Students cannot take it until you re-publish.',
        background: 'rgba(20,10,50,0.95)',
        color: '#f0f4ff',
        showCancelButton: true,
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#475569',
        confirmButtonText: 'Yes, edit it',
    }).then(result => {
        if (result.isConfirmed) {
            localStorage.removeItem('quizglass_quiz');
            document.getElementById('teacherSection').classList.remove('quiz-locked');
            document.getElementById('publishedBanner').classList.add('hidden');
        }
    });
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
