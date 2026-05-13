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

window.handleFormSubmit = handleFormSubmit;
window.sendToTelegram = sendToTelegram;
window.validatePhone = validatePhone;
window.validateName = validateName;
window.normalizePhone = normalizePhone;
window.isImplantLanding = isImplantLanding;

