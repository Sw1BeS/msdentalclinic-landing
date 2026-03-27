/**
 * Telegram Forms Handler
 * Відправка форм в Telegram
 * 
 * Налаштування:
 * 1. Створіть Telegram бота через @BotFather
 * 2. Отримайте токен бота
 * 3. Дізнайтеся chat_id (наприклад, через @userinfobot)
 * 4. Вставте значення нижче
 */

const TELEGRAM_CONFIG = {
    // 🔧 ЗАМІНІТЬ НА ВАШІ ЗНАЧЕННЯ
    botToken: 'YOUR_BOT_TOKEN_HERE',      // Токен бота від @BotFather
    chatId: 'YOUR_CHAT_ID_HERE'           // Ваш chat_id
};

// Перевірка телефону (12 цифр, починається з 380)
function validatePhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('380');
}

// Перевірка імені (мінімум 2 символи)
function validateName(value) {
    return value.trim().length >= 2;
}

// Відправка в Telegram
async function sendToTelegram(name, phone, page = 'Невідомо') {
    const message = `
🦷 *Нова заявка з сайту*

👤 *Ім'я:* ${name}
📞 *Телефон:* ${phone}
🌐 *Сторінка:* ${page}
⏰ *Час:* ${new Date().toLocaleString('uk-UA')}
    `.trim();

    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            throw new Error(`Telegram API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        throw error;
    }
}

// Обробка форми
function handleFormSubmit(formId, successId, nameErrorId, telErrorId, submitBtnId, pageName = 'Невідомо') {
    const form = document.getElementById(formId);
    if (!form) return;

    const successEl = document.getElementById(successId);
    const nameError = nameErrorId ? document.getElementById(nameErrorId) : null;
    const telError = telErrorId ? document.getElementById(telErrorId) : null;
    const submitBtn = submitBtnId ? document.getElementById(submitBtnId) : null;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nameInput = form.querySelector('input[name="name"]');
        const telInput = form.querySelector('input[name="tel"]');
        let isValid = true;

        // Скидання помилок
        if (nameInput) {
            nameInput.classList.remove('error');
            if (nameError) nameError.classList.remove('visible');
        }
        if (telInput) {
            telInput.classList.remove('error');
            if (telError) telError.classList.remove('visible');
        }

        // Валідація імені
        if (nameInput && !validateName(nameInput.value)) {
            nameInput.classList.add('error');
            if (nameError) nameError.classList.add('visible');
            isValid = false;
        }

        // Валідація телефону
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

        // Блокування кнопки
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        // Очищення телефону
        const cleanPhone = '+' + telInput.value.replace(/\D/g, '');

        try {
            await sendToTelegram(nameInput.value.trim(), cleanPhone, pageName);

            // Успіх
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }

            form.style.display = 'none';
            if (successEl) successEl.classList.add('visible');

            // Meta Pixel Lead event
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: pageName,
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

    // Inline валідація
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
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

        input.addEventListener('input', function() {
            input.classList.remove('error');
            const errorEl = input.parentElement.querySelector('.form-error');
            if (errorEl) errorEl.classList.remove('visible');
        });
    });
}

// Експорт для глобального доступу
window.handleFormSubmit = handleFormSubmit;
window.sendToTelegram = sendToTelegram;
window.validatePhone = validatePhone;
window.validateName = validateName;
