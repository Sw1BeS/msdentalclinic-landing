/**
 * Implant Landing UI Enhancements
 * Handles dynamic UI injection, slider, quiz, and countdown logic.
 */

function isImplantLanding() {
    return window.location.pathname.includes('implant') ||
        document.title.includes('Імплантація') ||
        document.title.toLowerCase().includes('implant');
}

function injectImplantLandingStyles() {
    if (document.getElementById('implant-offer-quiz-styles')) return;
    const style = document.createElement('style');
    style.id = 'implant-offer-quiz-styles';
    style.textContent = `
        .hero-container-offers{gap:44px}.hero-badge[data-scroll-target]{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);font-family:var(--font-display);cursor:pointer}.hero-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:32px}.hero-main-cta{width:auto;min-width:260px;padding-left:24px;padding-right:24px}.hero-secondary-cta{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;border-radius:var(--radius-sm);padding:15px 22px;font-family:var(--font-display);font-weight:700;cursor:pointer;transition:all .3s ease}.hero-secondary-cta:hover{background:rgba(255,255,255,.15);transform:translateY(-2px)}
        .hero-offer-panel{position:relative;min-height:560px;border-radius:34px;padding:32px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.15);box-shadow:0 40px 100px rgba(0,0,0,.3);overflow:hidden;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}.hero-offer-panel:before{content:'';position:absolute;inset:auto -15% -25% auto;width:400px;height:400px;background:radial-gradient(circle,rgba(255,255,255,.15),transparent 70%);border-radius:50%;pointer-events:none}.offer-slider{position:relative;min-height:260px;z-index:2}.offer-slide{position:absolute;inset:0;opacity:0;transform:translateY(16px);transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1);pointer-events:none}.offer-slide.active{opacity:1;transform:translateY(0);pointer-events:auto}.offer-kicker{display:inline-flex;width:fit-content;margin-bottom:16px;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.offer-slide h2{color:#fff;font-family:var(--font-display);font-size:clamp(26px,4vw,36px);line-height:1.15;font-weight:800;margin-bottom:14px}.offer-slide p,.offer-slide li{color:rgba(255,255,255,.85);font-size:15px;line-height:1.5}.offer-slide ul{margin-top:18px;display:grid;gap:10px;list-style:none}.offer-slide li{position:relative;padding-left:24px}.offer-slide li:before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;position:absolute;left:0;top:9px;opacity:.7}
        .hero-offer-panel .offer-visual-wrap{position:absolute;right:-30px;bottom:74px;width:min(72%,430px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:1px solid rgba(255,255,255,.2);box-shadow:0 20px 60px rgba(0,0,0,.2);z-index:1}.hero-offer-panel .offer-visual{width:100%;height:100%;object-fit:cover;object-position:center 30%;transform:scale(1.15)}.hero-offer-panel .offer-bottom-row{position:absolute;left:32px;right:32px;bottom:32px;z-index:3;display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.offer-countdown,.result-offer-box{border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.25);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:20px;padding:16px 20px}.countdown-label{display:block;color:rgba(255,255,255,.6);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}.countdown-grid,.mini-countdown{display:grid;grid-template-columns:repeat(4,minmax(48px,1fr));gap:8px}.countdown-grid span,.mini-countdown span{display:grid;place-items:center;min-width:50px;padding:8px 4px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.05);color:#fff}.countdown-grid strong,.mini-countdown b{font-size:20px;line-height:1;font-weight:800}.countdown-grid small,.mini-countdown span{font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}.offer-controls{display:flex;gap:10px;padding-bottom:8px}.offer-dot{width:10px;height:10px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;cursor:pointer;transition:all .3s ease}.offer-dot:hover{background:rgba(255,255,255,.3)}.offer-dot.active{width:32px;background:#fff;border-color:#fff}.inline-countdown{margin:-4px 0 20px;background:rgba(67,156,195,.12);border-color:rgba(67,156,195,.28);padding:16px;border-radius:18px;border:1px solid}.inline-countdown span:first-child{color:rgba(255,255,255,.72);margin-bottom:4px;display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.inline-countdown strong{color:#fff;font-size:16px;letter-spacing:.02em}
        .quiz-section{background:linear-gradient(180deg,#f8fbff 0%,#fff 100%)}.quiz-shell{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;padding:28px;border-radius:36px;background:linear-gradient(145deg,#fff 0%,#f4fbff 100%);border:1px solid rgba(67,156,195,.15);box-shadow:0 40px 100px rgba(26,43,51,.1)}.quiz-copy .section-title,.quiz-copy .section-subtitle,.quiz-copy .section-label{text-align:left;margin-left:0;margin-right:0}.quiz-copy .section-label:before,.quiz-copy .section-label:after{display:none}.quiz-trust-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.quiz-trust-row span{border-radius:999px;padding:8px 12px;background:rgba(67,156,195,.1);color:var(--brand-dark);font-size:12px;font-weight:800}.quiz-card{position:relative;overflow:hidden;min-height:520px;padding:26px;border-radius:28px;background:#1a2b33;color:#fff;box-shadow:0 28px 80px rgba(26,43,51,.2)}.quiz-card:after{content:'';position:absolute;right:-120px;top:-120px;width:280px;height:280px;background:radial-gradient(circle,rgba(51,247,255,.18),transparent 70%);pointer-events:none}.quiz-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:28px;position:relative;z-index:1}.quiz-progress span{height:6px;border-radius:999px;background:rgba(255,255,255,.16)}.quiz-progress span.active{background:var(--brand-cyan)}.quiz-step,.quiz-result{display:none;position:relative;z-index:1}.quiz-step.active,.quiz-result.active{display:block;animation:quizFade .28s ease}@keyframes quizFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.quiz-step-label,.quiz-result-badge{display:inline-flex;width:fit-content;margin-bottom:14px;padding:6px 12px;border-radius:999px;color:var(--brand-cyan);background:rgba(51,247,255,.12);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.quiz-step h3,.quiz-result h3{color:#fff;font-size:clamp(24px,3vw,34px);margin-bottom:22px}.quiz-result p{color:rgba(255,255,255,.78);margin-bottom:18px}.quiz-options{display:grid;gap:12px}.quiz-options button{width:100%;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px 18px;background:rgba(255,255,255,.08);color:#fff;font-family:var(--font-display);font-size:15px;font-weight:700;text-align:left;cursor:pointer;transition:all .25s ease}.quiz-options button:hover,.quiz-options button.selected{border-color:var(--brand-cyan);background:rgba(51,247,255,.14);transform:translateX(4px)}.result-offer-box{margin:18px 0 22px;background:rgba(51,247,255,.08)}.result-offer-box strong{display:block;color:#fff;margin-bottom:12px}.quiz-lead-form{display:grid;gap:0}.quiz-card .form-success h3,.quiz-card .form-success p{color:#fff}.quiz-card .form-input{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.24)}.quiz-card .form-input::placeholder{color:rgba(255,255,255,.55)}.quiz-card .form-label,.quiz-card .form-privacy{color:rgba(255,255,255,.72)!important}
        @media(min-width:1024px){.hero-container-offers{grid-template-columns:minmax(0,.92fr) minmax(420px,1fr)}.quiz-shell{grid-template-columns:.9fr 1.1fr;padding:46px}}@media(max-width:767px){.hero-actions{justify-content:center;margin-top:24px}.hero-main-cta,.hero-secondary-cta{width:100%}.hero-offer-panel{min-height:650px;padding:24px;border-radius:28px}.offer-slider{min-height:300px}.hero-offer-panel .offer-visual-wrap{right:50%;transform:translateX(50%);bottom:140px;width:260px}.hero-offer-panel .offer-bottom-row{left:20px;right:20px;bottom:20px;align-items:stretch;flex-direction:column}.countdown-grid,.mini-countdown{grid-template-columns:repeat(4,1fr)}.countdown-grid span,.mini-countdown span{min-width:0}.offer-controls{justify-content:center;margin-top:10px;padding-bottom:0}.quiz-shell{padding:18px;border-radius:24px}.quiz-card{padding:20px;min-height:570px;border-radius:22px}.quiz-options button{font-size:14px;padding:14px 16px}}
    `;
    document.head.appendChild(style);
}

function enhanceHeroOfferBlock() {
    const hero = document.querySelector('.hero');
    const container = document.querySelector('.hero .hero-container');
    const content = document.querySelector('.hero-content');
    const imageContainer = document.querySelector('.hero-image-container');
    if (!hero || !container || !content || !imageContainer || document.querySelector('[data-offer-carousel]')) return;

    container.classList.add('hero-container-offers');

    const badge = content.querySelector('.hero-badge');
    if (badge) {
        badge.innerHTML = '<span class="hero-badge-dot"></span>Безкоштовна консультація — місця обмежені';
        badge.setAttribute('data-scroll-target', 'form-top');
        badge.setAttribute('role', 'button');
        badge.setAttribute('tabindex', '0');
        badge.removeAttribute('onclick');
    }

    const subtitle = content.querySelector('.hero-subtitle');
    if (subtitle) {
        subtitle.textContent = 'Отримайте консультацію імплантолога, попередній план лікування та зрозумійте варіанти відновлення — від одиничного імпланта до All-on-4 / All-on-6.';
    }

    const features = content.querySelectorAll('.hero-feature span');
    if (features[0]) features[0].textContent = 'Системи Straumann 🇨🇭, Megagen 🇰🇷 та інші перевірені бренди';
    if (features[1]) features[1].textContent = 'Тимчасові конструкції орієнтовно за 7 днів';
    if (features[2]) features[2].textContent = 'Прозорий план: діагностика → хірургія → тимчасові зуби → постійний протез';

    if (!content.querySelector('.hero-actions')) {
        content.insertAdjacentHTML('beforeend', \`
            <div class="hero-actions">
                <button class="btn-primary hero-main-cta" type="button" data-scroll-target="quiz"><span class="btn-text">Пройти мініквіз і отримати бонус</span></button>
                <button class="hero-secondary-cta" type="button" data-scroll-target="form-top">Записатися одразу</button>
            </div>
        \`);
    }

    const img = imageContainer.querySelector('img');
    const src = img ? img.getAttribute('src') : 'static/img/landing/hero-implant.png';
    imageContainer.outerHTML = \`
        <div class="hero-offer-panel reveal" data-offer-carousel>
            <div class="offer-slider" aria-live="polite">
                <article class="offer-slide active" data-offer-slide><span class="offer-kicker">З чого починати</span><h2>Безкоштовна консультація зі складанням плану лікування</h2><p>Приходьте — лікар детально розбере вашу ситуацію, запропонує варіанти та складе покроковий план лікування.</p><ul><li>Оцінка стану щелепи та зубів</li><li>Персональний план із термінами та вартістю</li><li>Відповіді на всі запитання без зобов'язань</li></ul></article>
                <article class="offer-slide" data-offer-slide><span class="offer-kicker">Якість та надійність</span><h2>Перевірені імплантаційні системи — чесна ціна</h2><p>Використовуємо сертифіковані системи Straumann, Megagen та інших виробників. Ціна відповідає якості, без прихованих надбавок.</p><ul><li>Сертифіковані системи преміум-класу</li><li>Прозорий прайс без доплат</li><li>Гарантія на роботу лікаря</li></ul></article>
                <article class="offer-slide" data-offer-slide><span class="offer-kicker">Повна реабілітація</span><h2>All-on-4 / All-on-6 — зуби за чітким планом</h2><p>Повне відновлення зубного ряду з зрозумілою послідовністю кроків. Ви знаєте, що і коли відбудеться — від першого візиту до фінальної коронки.</p><ul><li>Прозорий план по кожному етапу</li><li>Тимчасові зуби на час лікування</li><li>Результат, який видно і відчувається</li></ul></article>
            </div>
            <div class="offer-visual-wrap"><img class="offer-visual" src="\${src}" alt="Дентальний імплант" width="520" height="520" loading="eager"></div>
            <div class="offer-bottom-row">
                <div class="offer-countdown" data-countdown="main" data-countdown-hours="48"><span class="countdown-label">Консультація доступна:</span><div class="countdown-grid" aria-live="polite"><span><strong data-countdown-days>02</strong><small>дні</small></span><span><strong data-countdown-hours>00</strong><small>год</small></span><span><strong data-countdown-minutes>00</strong><small>хв</small></span><span><strong data-countdown-seconds>00</strong><small>сек</small></span></div></div>
                <div class="offer-controls" aria-label="Перемикання пропозицій"><button type="button" class="offer-dot active" data-offer-dot aria-label="Пропозиція 1"></button><button type="button" class="offer-dot" data-offer-dot aria-label="Пропозиція 2"></button><button type="button" class="offer-dot" data-offer-dot aria-label="Пропозиція 3"></button></div>
            </div>
        </div>
    \`;
}

function enhanceTopConsultationForm() {
    const card = document.getElementById('cta-card-top');
    if (!card || card.querySelector('[data-countdown="form-top"]')) return;
    const title = card.querySelector('.cta-card-title');
    const subtitle = card.querySelector('.cta-card-subtitle');
    if (title) title.textContent = 'Забронюйте безкоштовну консультацію';
    if (subtitle) {
        subtitle.textContent = 'Офер для цієї сторінки обмежений у часі. Менеджер зв\\'яжеться з вами у робочий час.';
        subtitle.insertAdjacentHTML('afterend', \`<div class="inline-countdown" data-countdown="form-top" data-countdown-hours="48"><span>До завершення персональної пропозиції:</span><strong><span data-countdown-days>02</span>д : <span data-countdown-hours>00</span>г : <span data-countdown-minutes>00</span>хв</strong></div>\`);
    }
}

function insertMiniQuizSection() {
    if (document.getElementById('quiz')) return;
    const anchor = document.querySelector('.brands-strip') || document.getElementById('cases') || document.getElementById('steps');
    if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', \`
        <section class="section quiz-section" id="quiz">
            <div class="section-container">
                <div class="quiz-shell reveal">
                    <div class="quiz-copy">
                        <p class="section-label">Мініквіз</p>
                        <h2 class="section-title">Відповідайте на 3 питання — отримайте безкоштовну консультацію</h2>
                        <p class="section-subtitle">Квіз допоможе лікарю підготуватися до консультації заздалегідь. Після відповідей ви отримаєте запис на безкоштовну консультацію зі складанням плану лікування.</p>
                        <div class="quiz-trust-row"><span>≈ 30 секунд</span><span>Без оплати</span><span>Для імплантації в Одесі</span></div>
                    </div>
                    <div class="quiz-card" data-quiz>
                        <div class="quiz-progress" aria-label="Прогрес квізу"><span class="active" data-quiz-progress></span><span data-quiz-progress></span><span data-quiz-progress></span></div>
                        <div class="quiz-step active" data-quiz-step="0"><span class="quiz-step-label">Питання 1/3</span><h3>Що потрібно відновити?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Один зуб">Один зуб</button><button type="button" data-quiz-option data-value="Декілька зубів">Декілька зубів</button><button type="button" data-quiz-option data-value="Весь зубний ряд">Весь зубний ряд</button><button type="button" data-quiz-option data-value="Потрібна консультація">Поки не знаю</button></div></div>
                        <div class="quiz-step" data-quiz-step="1"><span class="quiz-step-label">Питання 2/3</span><h3>Що для вас найважливіше?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Швидко отримати тимчасові зуби">Швидко отримати тимчасові зуби</button><button type="button" data-quiz-option data-value="Максимальна надійність системи">Максимальна надійність системи</button><button type="button" data-quiz-option data-value="Зрозуміти бюджет">Зрозуміти бюджет</button><button type="button" data-quiz-option data-value="Безболісне лікування">Безболісне лікування</button></div></div>
                        <div class="quiz-step" data-quiz-step="2"><span class="quiz-step-label">Питання 3/3</span><h3>Коли вам зручно прийти на консультацію?</h3><div class="quiz-options"><button type="button" data-quiz-option data-value="Цього тижня">Цього тижня</button><button type="button" data-quiz-option data-value="Протягом 2 тижнів">Протягом 2 тижнів</button><button type="button" data-quiz-option data-value="Пізніше">Пізніше</button><button type="button" data-quiz-option data-value="Хочу, щоб мені передзвонили">Хочу, щоб мені передзвонили</button></div></div>
                        <div class="quiz-result" data-quiz-result><span class="quiz-result-badge">Консультацію заброньовано</span><h3>Консультація імплантолога</h3><div class="result-offer-box" style="margin-bottom: 24px;"><strong>Індивідуальний план лікування</strong></div><form id="lead-form-quiz" class="quiz-lead-form" novalidate><input type="hidden" name="quiz-summary" id="quiz-summary" value=""><div class="form-group"><label class="form-label" for="name-quiz">Ваше ім'я *</label><input type="text" class="form-input" id="name-quiz" name="name" placeholder="Як до вас звертатися?" required autocomplete="name"><p class="form-error" id="name-error-quiz">Будь ласка, вкажіть ваше ім'я</p></div><div class="form-group"><label class="form-label" for="tel-quiz">Номер телефону *</label><input type="tel" class="form-input" id="tel-quiz" name="tel" placeholder="+380 (XX) XXX-XX-XX" required autocomplete="tel" inputmode="tel"><p class="form-error" id="tel-error-quiz">Вкажіть коректний номер телефону</p></div><button type="submit" class="btn-primary" id="submit-quiz"><span class="btn-text">Записатися на консультацію</span><span class="spinner"></span></button><p class="form-privacy">Натискаючи кнопку, ви даєте згоду на обробку персональних даних</p></form><div class="form-success" id="success-quiz"><div class="form-success-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg></div><h3>Заявку надіслано!</h3><p>Ваші відповіді збережено. Менеджер зв'яжеться з вами найближчим часом.</p></div></div>
                    </div>
                </div>
            </div>
        </section>
    \`);
}

function initOfferCarousel() {
    const carousel = document.querySelector('[data-offer-carousel]');
    if (!carousel || carousel.dataset.bound === 'true') return;
    carousel.dataset.bound = 'true';
    const slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-offer-slide]'));
    const dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-offer-dot]'));
    let current = 0;
    let timer = null;

    function showSlide(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) { slide.classList.toggle('active', i === current); });
        dots.forEach(function (dot, i) { dot.classList.toggle('active', i === current); });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            if (timer) window.clearInterval(timer);
            showSlide(index);
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = window.setInterval(function () { showSlide(current + 1); }, 5200);
        });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = window.setInterval(function () { showSlide(current + 1); }, 5200);
    }
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
        
        // This function exists in telegram-forms.js
        if (typeof window.handleFormSubmit === 'function') {
            window.handleFormSubmit('lead-form-quiz', 'success-quiz', 'name-error-quiz', 'tel-error-quiz', 'submit-quiz', 'Implant Landing - Quiz Bonus');
        }
        
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
    enhanceHeroOfferBlock();
    enhanceTopConsultationForm();
    insertMiniQuizSection();
    initOfferCarousel();
    initCountdowns();
    initMiniQuiz();
    initScrollButtons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootImplantLandingEnhancements);
} else {
    bootImplantLandingEnhancements();
}
