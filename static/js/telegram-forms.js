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
        .hero-container-offers{gap:44px}.hero-badge[data-scroll-target]{border:1px solid rgba(51,247,255,.25);font-family:var(--font-display);cursor:pointer}.hero-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.hero-main-cta{width:auto;min-width:260px;padding-left:24px;padding-right:24px}.hero-secondary-cta{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;border-radius:var(--radius-sm);padding:15px 22px;font-family:var(--font-display);font-weight:700;cursor:pointer;transition:all .25s ease}.hero-secondary-cta:hover{background:rgba(255,255,255,.15);transform:translateY(-2px)}
        .hero-offer-panel{position:relative;min-height:560px;border-radius:34px;padding:28px;background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.18);box-shadow:0 40px 100px rgba(0,0,0,.22);overflow:hidden;backdrop-filter:blur(16px)}.hero-offer-panel:before{content:'';position:absolute;inset:auto -15% -25% auto;width:360px;height:360px;background:radial-gradient(circle,rgba(51,247,255,.28),transparent 68%);border-radius:50%;pointer-events:none}.offer-slider{position:relative;min-height:245px;z-index:2}.offer-slide{position:absolute;inset:0;opacity:0;transform:translateY(16px);transition:opacity .45s ease,transform .45s ease;pointer-events:none}.offer-slide.active{opacity:1;transform:translateY(0);pointer-events:auto}.offer-kicker{display:inline-flex;width:fit-content;margin-bottom:12px;padding:6px 12px;border-radius:999px;background:rgba(51,247,255,.12);color:var(--brand-cyan);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.offer-slide h2{color:#fff;font-size:clamp(26px,4vw,40px);line-height:1.12;margin-bottom:14px}.offer-slide p,.offer-slide li{color:rgba(255,255,255,.78);font-size:15px}.offer-slide ul{margin-top:16px;display:grid;gap:8px;list-style:none}.offer-slide li{position:relative;padding-left:22px}.offer-slide li:before{content:'';width:8px;height:8px;border-radius:50%;background:var(--brand-cyan);position:absolute;left:0;top:8px}
        .offer-visual-wrap{position:absolute;right:-30px;bottom:74px;width:min(72%,430px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:4px solid rgba(51,247,255,.24);box-shadow:0 0 70px rgba(51,247,255,.18);z-index:1}.offer-visual{width:100%;height:100%;object-fit:cover;object-position:center 35%;transform:scale(1.55)}.offer-bottom-row{position:absolute;left:28px;right:28px;bottom:24px;z-index:3;display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.offer-countdown,.inline-countdown,.result-offer-box{border:1px solid rgba(51,247,255,.2);background:rgba(10,28,34,.72);border-radius:18px;padding:16px}.countdown-label,.inline-countdown span:first-child{display:block;color:rgba(255,255,255,.74);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}.countdown-grid,.mini-countdown{display:grid;grid-template-columns:repeat(4,minmax(50px,1fr));gap:8px}.countdown-grid span,.mini-countdown span{display:grid;place-items:center;min-width:54px;padding:8px 6px;border-radius:12px;background:rgba(255,255,255,.1);color:#fff}.countdown-grid strong,.mini-countdown b{font-size:20px;line-height:1}.countdown-grid small,.mini-countdown span{font-size:10px;color:rgba(255,255,255,.68);text-transform:uppercase}.offer-controls{display:flex;gap:10px}.offer-dot{width:11px;height:11px;border-radius:999px;border:0;background:rgba(255,255,255,.32);cursor:pointer;transition:all .25s ease}.offer-dot.active{width:34px;background:var(--brand-cyan)}.inline-countdown{margin:-4px 0 20px;background:rgba(67,156,195,.12);border-color:rgba(67,156,195,.28)}.inline-countdown span:first-child{color:rgba(255,255,255,.72);margin-bottom:4px}.inline-countdown strong{color:#fff;font-size:16px;letter-spacing:.02em}
        .quiz-section{background:linear-gradient(180deg,#f8fbff 0%,#fff 100%)}.quiz-shell{display:grid;grid-template-columns:1fr;gap:28px;align-items:start;padding:28px;border-radius:36px;background:linear-gradient(145deg,#fff 0%,#f4fbff 100%);border:1px solid rgba(67,156,195,.15);box-shadow:0 40px 100px rgba(26,43,51,.1)}.quiz-copy .section-title,.quiz-copy .section-subtitle,.quiz-copy .section-label{text-align:left;margin-left:0;margin-right:0}.quiz-copy .section-label:before,.quiz-copy .section-label:after{display:none}.quiz-trust-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.quiz-trust-row span{border-radius:999px;padding:8px 12px;background:rgba(67,156,195,.1);color:var(--brand-dark);font-size:12px;font-weight:800}.quiz-card{position:relative;overflow:hidden;min-height:520px;padding:26px;border-radius:28px;background:#1a2b33;color:#fff;box-shadow:0 28px 80px rgba(26,43,51,.2)}.quiz-card:after{content:'';position:absolute;right:-120px;top:-120px;width:280px;height:280px;background:radial-gradient(circle,rgba(51,247,255,.18),transparent 70%);pointer-events:none}.quiz-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:28px;position:relative;z-index:1}.quiz-progress span{height:6px;border-radius:999px;background:rgba(255,255,255,.16)}.quiz-progress span.active{background:var(--brand-cyan)}.quiz-step,.quiz-result{display:none;position:relative;z-index:1}.quiz-step.active,.quiz-result.active{display:block;animation:quizFade .28s ease}@keyframes quizFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.quiz-step-label,.quiz-result-badge{display:inline-flex;width:fit-content;margin-bottom:14px;padding:6px 12px;border-radius:999px;color:var(--brand-cyan);background:rgba(51,247,255,.12);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.quiz-step h3,.quiz-result h3{color:#fff;font-size:clamp(24px,3vw,34px);margin-bottom:22px}.quiz-result p{color:rgba(255,255,255,.78);margin-bottom:18px}.quiz-options{display:grid;gap:12px}.quiz-options button{width:100%;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px 18px;background:rgba(255,255,255,.08);color:#fff;font-family:var(--font-display);font-size:15px;font-weight:700;text-align:left;cursor:pointer;transition:all .25s ease}.quiz-options button:hover,.quiz-options button.selected{border-color:var(--brand-cyan);background:rgba(51,247,255,.14);transform:translateX(4px)}.result-offer-box{margin:18px 0 22px;background:rgba(51,247,255,.08)}.result-offer-box strong{display:block;color:#fff;margin-bottom:12px}.quiz-lead-form{display:grid;gap:0}.quiz-card .form-success h3,.quiz-card .form-success p{color:#fff}.quiz-card .form-input{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.24)}.quiz-card .form-input::placeholder{color:rgba(255,255,255,.55)}.quiz-card .form-label,.quiz-card .form-privacy{color:rgba(255,255,255,.72)!important}
        @media(min-width:1024px){.hero-container-offers{grid-template-columns:minmax(0,.92fr) minmax(420px,1fr)}.quiz-shell{grid-template-columns:.9fr 1.1fr;padding:46px}}@media(max-width:767px){.hero-actions{justify-content:center}.hero-main-cta,.hero-secondary-cta{width:100%}.hero-offer-panel{min-height:650px;padding:22px;border-radius:26px}.offer-slider{min-height:320px}.offer-visual-wrap{right:50%;transform:translateX(50%);bottom:128px;width:260px}.offer-bottom-row{left:18px;right:18px;bottom:18px;align-items:stretch;flex-direction:column}.countdown-grid,.mini-countdown{grid-template-columns:repeat(4,1fr)}.countdown-grid span,.mini-countdown span{min-width:0}.offer-controls{justify-content:center}.quiz-shell{padding:18px;border-radius:24px}.quiz-card{padding:20px;min-height:570px;border-radius:22px}.quiz-options button{font-size:14px;padding:14px 16px}}
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
        content.insertAdjacentHTML('beforeend', `
            <div class="hero-actions">
                <button class="btn-primary hero-main-cta" type="button" data-scroll-target="quiz"><span class="btn-text">Пройти мініквіз і отримати бонус</span></button>
                <button class="hero-secondary-cta" type="button" data-scroll-target="form-top">Записатися одразу</button>
            </div>
        `);
    }

    const img = imageContainer.querySelector('img');
    const src = img ? img.getAttribute('src') : 'static/img/landing/hero-implant.png';
    imageContainer.outerHTML = `
        <div class="hero-offer-panel reveal" data-offer-carousel>
            <div class="offer-slider" aria-live="polite">
                <article class="offer-slide active" data-offer-slide><span class="offer-kicker">Офер 01</span><h2>Безкоштовна консультація імплантолога</h2><p>Для пацієнтів, які залишили заявку з цієї посадкової сторінки.</p><ul><li>Оцінка клінічної ситуації</li><li>Попередній план лікування</li><li>Пояснення варіантів за бюджетом</li></ul></article>
                <article class="offer-slide" data-offer-slide><span class="offer-kicker">Офер 02</span><h2>Тимчасові зуби орієнтовно за 7 днів</h2><p>Актуально для пацієнтів, які не хочуть залишатися без посмішки під час лікування.</p><ul><li>План тимчасового протезування</li><li>Підбір імплантаційної системи</li><li>Пояснення етапів і строків</li></ul></article>
                <article class="offer-slide" data-offer-slide><span class="offer-kicker">Офер 03</span><h2>All-on-4 / All-on-6 під ключ</h2><p>Комплексне відновлення зубного ряду з чіткою послідовністю етапів.</p><ul><li>Сценарії для повної реабілітації</li><li>Порівняння систем імплантів</li><li>Орієнтир по термінах і підготовці</li></ul></article>
            </div>
            <div class="offer-visual-wrap"><img class="offer-visual" src="${src}" alt="Дентальний імплант" width="520" height="520" loading="eager"></div>
            <div class="offer-bottom-row">
                <div class="offer-countdown" data-countdown="main" data-countdown-hours="48"><span class="countdown-label">Персональний офер активний ще:</span><div class="countdown-grid" aria-live="polite"><span><strong data-countdown-days>02</strong><small>дні</small></span><span><strong data-countdown-hours>00</strong><small>год</small></span><span><strong data-countdown-minutes>00</strong><small>хв</small></span><span><strong data-countdown-seconds>00</strong><small>сек</small></span></div></div>
                <div class="offer-controls" aria-label="Перемикання оферів"><button type="button" class="offer-dot active" data-offer-dot aria-label="Офер 1"></button><button type="button" class="offer-dot" data-offer-dot aria-label="Офер 2"></button><button type="button" class="offer-dot" data-offer-dot aria-label="Офер 3"></button></div>
            </div>
        </div>
    `;
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
    enhanceHeroOfferBlock();
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
