/**
 * Telegram Forms Handler
 * Safe frontend handler: sends leads to backend /callme/.
 * Implant landing enhancements: offer carousel, countdown and mini quiz.
 */

const TELEGRAM_CONFIG = {
    // ✅ Налаштовано
    botToken: '8600696729:AAHBhrnTUzRzOr7DEssWxO6-f0pWlEDrSnw',

    // 🔔 Отримувачі повідомлень (chatId масив підтримує кілька користувачів)
    // 1 — основний адмін (219480233)
    // 2 — @PvlSkl (ID: 578319195)
    chatIds: ['219480233', '578319195']
};

function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('380') && digits.length >= 12) {
        digits = digits.substring(0, 12);
    } else if (digits.startsWith('80') && digits.length >= 11) {
        digits = '3' + digits.substring(0, 11);
    } else if (digits.startsWith('0') && digits.length >= 10) {
        digits = '38' + digits.substring(0, 10);
    }
    return digits;
}

function validatePhone(value) {
    const digits = normalizePhone(value);
    return digits.length === 12 && digits.startsWith('380');
}

function validateName(value) {
    return String(value || '').trim().length >= 2;
}

function isImplantLanding() {
    return window.location.pathname.includes('implant') ||
        document.title.includes('Імплантація') ||
        document.title.toLowerCase().includes('implant');
}

// Відправка в БД + Telegram
async function sendToTelegram(name, phone, page = 'Невідомо') {
    const isAd = isImplantLanding();
    const sourceTag = isAd ? '\n🎯 *РЕКЛАМНА ЗАЯВКА (Імплантація)* 🎯' : '';
    const dbSource = isAd ? 'implant_landing' : 'main';

    const message = `
🦷 *Нова заявка з сайту*${sourceTag}

👤 *Ім'я:* ${name}
📞 *Телефон:* ${phone}
🌐 *Сторінка:* ${page}
⏰ *Час:* ${new Date().toLocaleString('uk-UA')}
    `.trim();

    // Спочатку відправляємо в БД (якщо доступна)
    try {
        await fetch('/callme/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                tel: phone,
                source: dbSource,
                page: page
            })
        });
        console.log('Data sent to database, source:', dbSource);
    } catch (dbError) {
        console.log('Database not available, sending only to Telegram');
    }

    // Потім відправляємо в Telegram всім отримувачам
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;

    const sendPromises = TELEGRAM_CONFIG.chatIds.map(chatId =>
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Telegram API error for chatId ${chatId}: ${response.status}`);
            }
            return response.json();
        }).catch(error => {
            console.error(`Error sending to chatId ${chatId}:`, error);
        })
    );

    try {
        await Promise.all(sendPromises);
        console.log('Telegram messages sent to all recipients');
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        throw error;
    }
}

function handleFormSubmit(formId, successId, nameErrorId, telErrorId, submitBtnId, pageName = 'Невідомо') {
    const form = document.getElementById(formId);
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    const successEl = document.getElementById(successId);
    const nameError = nameErrorId ? document.getElementById(nameErrorId) : null;
    const telError = telErrorId ? document.getElementById(telErrorId) : null;
    const submitBtn = submitBtnId ? document.getElementById(submitBtnId) : null;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nameInput = form.querySelector('input[name="name"]');
        const telInput = form.querySelector('input[name="tel"]');
        let isValid = true;

        if (nameInput) {
            nameInput.classList.remove('error');
            if (nameError) nameError.classList.remove('visible');
        }
        if (telInput) {
            telInput.classList.remove('error');
            if (telError) telError.classList.remove('visible');
        }

        if (nameInput && !validateName(nameInput.value)) {
            nameInput.classList.add('error');
            if (nameError) nameError.classList.add('visible');
            isValid = false;
        }

        if (telInput && !validatePhone(telInput.value)) {
            telInput.classList.add('error');
            if (telError) telError.classList.add('visible');
            isValid = false;
        }

        if (!isValid) {
            const firstError = form.querySelector('.error');
            if (firstError) firstError.focus();
            return;
        }

        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        const cleanPhone = '+' + normalizePhone(telInput.value);
        const quizSummaryInput = form.querySelector('input[name="quiz-summary"]');
        const extendedPageName = quizSummaryInput && quizSummaryInput.value
            ? pageName + ' | ' + quizSummaryInput.value
            : pageName;

        try {
            await sendToTelegram(nameInput.value.trim(), cleanPhone, extendedPageName);

            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }

            form.style.display = 'none';
            if (successEl) successEl.classList.add('visible');

            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: extendedPageName,
                    content_category: 'Dental',
                    value: 0,
                    currency: 'UAH'
                });
            }
        } catch (error) {
            console.error('Form submission error:', error);
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
            alert('Виникла помилка. Будь ласка, зателефонуйте нам: +38 063 617 15 55');
        }
    });

    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(function (input) {
        input.addEventListener('blur', function () {
            if (input.name === 'name' && input.value && !validateName(input.value)) {
                input.classList.add('error');
                const errorEl = input.parentElement.querySelector('.form-error');
                if (errorEl) errorEl.classList.add('visible');
            }
            if (input.name === 'tel' && input.value && input.value !== '+380 ' && !validatePhone(input.value)) {
                input.classList.add('error');
                const errorEl = input.parentElement.querySelector('.form-error');
                if (errorEl) errorEl.classList.add('visible');
            }
        });

        input.addEventListener('input', function () {
            input.classList.remove('error');
            const errorEl = input.parentElement.querySelector('.form-error');
            if (errorEl) errorEl.classList.remove('visible');
        });
    });
}

function injectImplantLandingStyles() {
    if (document.getElementById('implant-offer-quiz-styles')) return;
    const style = document.createElement('style');
    style.id = 'implant-offer-quiz-styles';
    style.textContent = `
        .quiz-section{background:linear-gradient(180deg,#f8fbff 0%,#fff 100%)}.quiz-shell{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;padding:28px;border-radius:36px;background:linear-gradient(145deg,#fff 0%,#f4fbff 100%);border:1px solid rgba(67,156,195,.15);box-shadow:0 40px 100px rgba(26,43,51,.1)}.quiz-copy .section-title,.quiz-copy .section-subtitle,.quiz-copy .section-label{text-align:left;margin-left:0;margin-right:0}.quiz-copy .section-label:before,.quiz-copy .section-label:after{display:none}.quiz-trust-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.quiz-trust-row span{border-radius:999px;padding:8px 12px;background:rgba(67,156,195,.1);color:var(--brand-dark);font-size:12px;font-weight:800}.quiz-card{position:relative;overflow:hidden;min-height:520px;padding:26px;border-radius:28px;background:#1a2b33;color:#fff;box-shadow:0 28px 80px rgba(26,43,51,.2)}.quiz-card:after{content:'';position:absolute;right:-120px;top:-120px;width:280px;height:280px;background:radial-gradient(circle,rgba(51,247,255,.18),transparent 70%);pointer-events:none}.quiz-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:28px;position:relative;z-index:1}.quiz-progress span{height:6px;border-radius:999px;background:rgba(255,255,255,.16)}.quiz-progress span.active{background:var(--brand-cyan)}.quiz-step,.quiz-result{display:none;position:relative;z-index:1}.quiz-step.active,.quiz-result.active{display:block;animation:quizFade .28s ease}@keyframes quizFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.quiz-step-label,.quiz-result-badge{display:inline-flex;width:fit-content;margin-bottom:14px;padding:6px 12px;border-radius:999px;color:var(--brand-cyan);background:rgba(51,247,255,.12);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.quiz-step h3,.quiz-result h3{color:#fff;font-size:clamp(24px,3vw,34px);margin-bottom:22px}.quiz-result p{color:rgba(255,255,255,.78);margin-bottom:18px}.quiz-options{display:grid;gap:12px}.quiz-options button{width:100%;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px 18px;background:rgba(255,255,255,.08);color:#fff;font-family:var(--font-display);font-size:15px;font-weight:700;text-align:left;cursor:pointer;transition:all .25s ease}.quiz-options button:hover,.quiz-options button.selected{border-color:var(--brand-cyan);background:rgba(51,247,255,.14);transform:translateX(4px)}.result-offer-box{margin:18px 0 22px;background:rgba(51,247,255,.08)}.result-offer-box strong{display:block;color:#fff;margin-bottom:12px}.quiz-lead-form{display:grid;gap:0}.quiz-card .form-success h3,.quiz-card .form-success p{color:#fff}.quiz-card .form-input{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.24)}.quiz-card .form-input::placeholder{color:rgba(255,255,255,.55)}.quiz-card .form-label,.quiz-card .form-privacy{color:rgba(255,255,255,.72)!important}
        @media(min-width:1024px){.quiz-shell{grid-template-columns:.9fr 1.1fr;padding:46px}}@media(max-width:767px){.quiz-shell{padding:18px;border-radius:24px}.quiz-card{padding:20px;min-height:570px;border-radius:22px}.quiz-options button{font-size:14px;padding:14px 16px}}
    `;
    document.head.appendChild(style);
}

function enhanceTopConsultationForm() {
    const card = document.getElementById('cta-card-top');
    if (!card || card.querySelector('[data-countdown="form-top"]')) return;
    const title = card.querySelector('.cta-card-title');
    const subtitle = card.querySelector('.cta-card-subtitle');
    if (title) title.textContent = 'Забронюйте безкоштовну консультацію';
    if (subtitle) {
        subtitle.textContent = 'Офер для цієї сторінки обмежений у часі. Менеджер зв\'яжеться з вами у робочий час.';
        subtitle.insertAdjacentHTML('afterend', `<div class="inline-countdown" data-countdown="form-top" data-countdown-hours="48"><span>До завершення персональної пропозиції:</span><strong><span data-countdown-days>02</span>д : <span data-countdown-hours>00</span>г : <span data-countdown-minutes>00</span>хв</strong></div>`);
    }
}

function insertMiniQuizSection() {
    if (document.getElementById('quiz')) return;
    const anchor = document.querySelector('.brands-strip') || document.getElementById('cases') || document.getElementById('steps');
    if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', `
        <section class="section quiz-section" id="quiz">
            <div class="section-container">
                <div class="quiz-shell reveal">
                    <div class="quiz-copy">
                        <p class="section-label">Мініквіз</p>
                        <h2 class="section-title">Пройдіть 3 питання та відкрийте персональний бонус</h2>
                        <p class="section-subtitle">Квіз допоможе швидко зрозуміти вашу ситуацію. Після відповідей ви отримаєте офер з обмеженням по часу: безкоштовна консультація або додатковий бонус на послуги після огляду.</p>
                        <div class="quiz-trust-row"><span>≈ 30 секунд</span><span>Без оплати</span><span>Для імплантації в Одесі</span></div>
                    </div>
                    <div class="quiz-card" data-quiz>
                        <div class="quiz-progress" aria-label="Прогрес квізу"><span class="active" data-quiz-progress></span><span data-quiz-progress></span><span data-quiz-progress></span></div>
                        <div class="quiz-step active" data-quiz-step="0"><span class="quiz-step-label">Питання 1/3</span><h3>Що потрібно відновити?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Один зуб">Один зуб</button><button type="button" data-quiz-option data-value="Декілька зубів">Декілька зубів</button><button type="button" data-quiz-option data-value="Весь зубний ряд">Весь зубний ряд</button><button type="button" data-quiz-option data-value="Потрібна консультація">Поки не знаю</button></div></div>
                        <div class="quiz-step" data-quiz-step="1"><span class="quiz-step-label">Питання 2/3</span><h3>Що для вас найважливіше?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Швидко отримати тимчасові зуби">Швидко отримати тимчасові зуби</button><button type="button" data-quiz-option data-value="Максимальна надійність системи">Максимальна надійність системи</button><button type="button" data-quiz-option data-value="Зрозуміти бюджет">Зрозуміти бюджет</button><button type="button" data-quiz-option data-value="Безболісне лікування">Безболісне лікування</button></div></div>
                        <div class="quiz-step" data-quiz-step="2"><span class="quiz-step-label">Питання 3/3</span><h3>Коли вам зручно прийти на консультацію?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Цього тижня">Цього тижня</button><button type="button" data-quiz-option data-value="Протягом 2 тижнів">Протягом 2 тижнів</button><button type="button" data-quiz-option data-value="Пізніше">Пізніше</button><button type="button" data-quiz-option data-value="Хочу, щоб мені передзвонили">Хочу, щоб мені передзвонили</button></div></div>
                        <div class="quiz-result" data-quiz-result><span class="quiz-result-badge">Ваш бонус відкрито</span><h3>Безкоштовна консультація + персональний план лікування</h3><p data-quiz-result-text>Залиште контакти, і менеджер передасть лікарю ваші відповіді перед консультацією.</p><div class="result-offer-box"><strong>Пропозиція доступна протягом 48 годин</strong><div class="mini-countdown" data-countdown="quiz" data-countdown-hours="48"><span><b data-countdown-days>02</b> дні</span><span><b data-countdown-hours>00</b> год</span><span><b data-countdown-minutes>00</b> хв</span><span><b data-countdown-seconds>00</b> сек</span></div></div><form id="lead-form-quiz" class="quiz-lead-form" novalidate><input type="hidden" name="quiz-summary" id="quiz-summary" value=""><div class="form-group"><label class="form-label" for="name-quiz">Ваше ім'я *</label><input type="text" class="form-input" id="name-quiz" name="name" placeholder="Як до вас звертатися?" required autocomplete="name"><p class="form-error" id="name-error-quiz">Будь ласка, вкажіть ваше ім'я</p></div><div class="form-group"><label class="form-label" for="tel-quiz">Номер телефону *</label><input type="tel" class="form-input" id="tel-quiz" name="tel" placeholder="+380 (XX) XXX-XX-XX" required autocomplete="tel" inputmode="tel"><p class="form-error" id="tel-error-quiz">Вкажіть коректний номер телефону</p></div><button type="submit" class="btn-primary" id="submit-quiz"><span class="btn-text">Забрати бонус</span><span class="spinner"></span></button><p class="form-privacy">Натискаючи кнопку, ви даєте згоду на обробку персональних даних</p></form><div class="form-success" id="success-quiz"><div class="form-success-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></div><h3>Заявку надіслано!</h3><p>Ваші відповіді збережено. Менеджер зв'яжеться з вами найближчим часом.</p></div></div>
                    </div>
                </div>
            </div>
        </section>
    `);
}

function initOfferCarousel() {
    const carousel = document.querySelector('[data-offer-carousel]');
    if (!carousel || carousel.dataset.bound === 'true') return;
    carousel.dataset.bound = 'true';
    
    const slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-offer-slide]'));
    const dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-offer-dot]'));
    const heroImage = document.getElementById('hero-slider-img');
    let current = 0;
    let timer = null;
    let isHovered = false;

    function showSlide(index) {
        current = (index + slides.length) % slides.length;
        
        slides.forEach(function (slide, i) { 
            slide.classList.toggle('active', i === current); 
        });
        
        dots.forEach(function (dot, i) { 
            dot.classList.toggle('active', i === current); 
        });
        
        // Dynamic image swap
        if (heroImage && slides[current].dataset.image) {
            heroImage.style.opacity = '0';
            setTimeout(() => {
                heroImage.src = slides[current].dataset.image;
                heroImage.style.opacity = '1';
            }, 300);
        }
    }

    function startTimer() {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !isHovered) {
            clearInterval(timer);
            timer = setInterval(function () { showSlide(current + 1); }, 5200);
        }
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            clearInterval(timer);
            showSlide(index);
            startTimer();
        });
    });

    carousel.addEventListener('mouseenter', function() {
        isHovered = true;
        clearInterval(timer);
    });

    carousel.addEventListener('mouseleave', function() {
        isHovered = false;
        startTimer();
    });

    startTimer();
}

function initCountdowns() {
    const countdowns = document.querySelectorAll('[data-countdown]');
    countdowns.forEach(function (countdown) {
        if (countdown.dataset.bound === 'true') return;
        countdown.dataset.bound = 'true';
        const key = 'msdental_' + countdown.getAttribute('data-countdown') + '_deadline';
        const hours = parseInt(countdown.getAttribute('data-countdown-hours') || '48', 10);
        let deadline = parseInt(localStorage.getItem(key) || '0', 10);
        const now = Date.now();

        if (!deadline || deadline < now) {
            deadline = now + hours * 60 * 60 * 1000;
            localStorage.setItem(key, String(deadline));
        }

        function update() {
            const diff = Math.max(0, deadline - Date.now());
            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const pad = function (value) { return String(value).padStart(2, '0'); };
            countdown.querySelectorAll('[data-countdown-days]').forEach(function (el) { el.textContent = pad(days); });
            countdown.querySelectorAll('[data-countdown-hours]').forEach(function (el) { el.textContent = pad(hoursLeft); });
            countdown.querySelectorAll('[data-countdown-minutes]').forEach(function (el) { el.textContent = pad(minutes); });
            countdown.querySelectorAll('[data-countdown-seconds]').forEach(function (el) { el.textContent = pad(seconds); });
        }

        update();
        window.setInterval(update, 1000);
    });
}

function initMiniQuiz() {
    const quiz = document.querySelector('[data-quiz]');
    if (!quiz || quiz.dataset.bound === 'true') return;
    quiz.dataset.bound = 'true';
    const steps = Array.prototype.slice.call(quiz.querySelectorAll('[data-quiz-step]'));
    const progress = Array.prototype.slice.call(quiz.querySelectorAll('[data-quiz-progress]'));
    const result = quiz.querySelector('[data-quiz-result]');
    const summaryInput = quiz.querySelector('#quiz-summary');
    const resultText = quiz.querySelector('[data-quiz-result-text]');
    const answers = [];

    function showStep(index) {
        steps.forEach(function (step, i) { step.classList.toggle('active', i === index); });
        progress.forEach(function (bar, i) { bar.classList.toggle('active', i <= index); });
    }

    function finishQuiz() {
        steps.forEach(function (step) { step.classList.remove('active'); });
        progress.forEach(function (bar) { bar.classList.add('active'); });
        if (result) result.classList.add('active');
        const summary = 'Квіз: потреба — ' + (answers[0] || 'не вказано') + '; пріоритет — ' + (answers[1] || 'не вказано') + '; консультація — ' + (answers[2] || 'не вказано');
        if (summaryInput) summaryInput.value = summary;
        if (resultText) resultText.textContent = 'Ваші відповіді: ' + summary + '. Залиште контакти, і менеджер передасть їх лікарю перед консультацією.';
        handleFormSubmit('lead-form-quiz', 'success-quiz', 'name-error-quiz', 'tel-error-quiz', 'submit-quiz', 'Implant Landing - Quiz Bonus');
        initCountdowns();
    }

    quiz.querySelectorAll('[data-quiz-option]').forEach(function (button) {
        button.addEventListener('click', function () {
            const step = button.closest('[data-quiz-step]');
            const index = steps.indexOf(step);
            answers[index] = button.getAttribute('data-value') || button.textContent.trim();
            step.querySelectorAll('[data-quiz-option]').forEach(function (option) { option.classList.remove('selected'); });
            button.classList.add('selected');
            window.setTimeout(function () {
                if (index >= steps.length - 1) finishQuiz();
                else showStep(index + 1);
            }, 180);
        });
    });
}

function initScrollButtons() {
    document.querySelectorAll('[data-scroll-target]').forEach(function (button) {
        if (button.dataset.scrollBound === 'true') return;
        button.dataset.scrollBound = 'true';
        button.addEventListener('click', function () {
            const id = button.getAttribute('data-scroll-target');
            const target = document.getElementById(id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        button.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
}

function bootImplantLandingEnhancements() {
    if (!isImplantLanding()) return;
    injectImplantLandingStyles();
    enhanceTopConsultationForm();
    insertMiniQuizSection();
    initOfferCarousel();
    initCountdowns();
    initMiniQuiz();
    initScrollButtons();
}

window.handleFormSubmit = handleFormSubmit;
window.sendToTelegram = sendToTelegram;
window.validatePhone = validatePhone;
window.validateName = validateName;
window.normalizePhone = normalizePhone;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootImplantLandingEnhancements);
} else {
    bootImplantLandingEnhancements();
}
