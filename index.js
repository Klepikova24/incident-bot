const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// ===== НАСТРОЙКИ =====
// 1. ТОКЕН БОТА. Убедитесь, что это токен именно для @Kolyasad_bot
const BOT_TOKEN = '8376764573:AAH5JpoqEtW1CfM60U3HYYVkkkMr45qoF0A';

// 2. Настройки polling для стабильной работы на Bothost
const botOptions = {
  polling: {
    interval: 1000,      // Частота опроса (мс)
    timeout: 30,         // Таймаут запроса (сек)
    params: {
      timeout: 30        // Таймаут для long-polling
    }
  }
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
const bot = new TelegramBot(BOT_TOKEN, botOptions);
let incidentCounters = {}; // Временное хранилище (сбросится при перезапуске)

// ===== ОБРАБОТЧИКИ ОШИБОК ПОЛЛИНГА =====
// Критически важно для диагностики проблем с подключением
bot.on('polling_error', (error) => {
  console.error('🔴 КРИТИЧЕСКАЯ ОШИБКА ПОЛЛИНГА:', error.code, '-', error.message);
});

bot.on('webhook_error', (error) => {
  console.error('🔴 ОШИБКА ВЕБХУКА:', error);
});

// ===== ОСНОВНАЯ ЛОГИКА БОТА =====

// 1. Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();
  console.log(`📩 Получен /start от chat_id: ${chatId}`);
  
  // Инициализируем счетчик для чата, если его нет
  if (!incidentCounters[chatId]) {
    incidentCounters[chatId] = 0;
  }

  // Создаем сообщение с кнопкой
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚨 Произошел инцидент', callback_data: 'incident' }]
      ]
    }
  };

  // Отправляем приветственное сообщение
  bot.sendMessage(chatId, `Бот для учета дней без инцидентов активирован!\nБез инцидентов дней: ${incidentCounters[chatId]}`, options)
    .then(() => {
      console.log(`✅ Ответ на /start отправлен в chat_id: ${chatId}`);
    })
    .catch(err => {
      console.error(`❌ Ошибка отправки в chat_id ${chatId}:`, err.message);
    });
});

// 2. Обработка нажатия кнопки "Инцидент"
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id.toString();
  const data = callbackQuery.data;
  
  console.log(`🖱️ Нажата кнопка callback_data: "${data}" в chat_id: ${chatId}`);
  
  if (data === 'incident') {
    // Сбрасываем счетчик
    incidentCounters[chatId] = 0;
    
    // Подтверждаем нажатие пользователю
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Инцидент зарегистрирован!' });
    
    // Отправляем сообщение о сбросе
    bot.sendMessage(chatId, '🚨 Инцидент зарегистрирован. Счетчик сброшен.\nБез инцидентов дней: 0')
      .then(() => {
        console.log(`✅ Счетчик сброшен для chat_id: ${chatId}`);
      })
      .catch(err => {
        console.error(`❌ Ошибка сброса в chat_id ${chatId}:`, err.message);
      });
  }
});

// 3. Ежедневное уведомление (срабатывает в 12:00 по UTC)
cron.schedule('0 12 * * *', () => {
  console.log('⏰ Запуск ежедневного отчета...');
  
  // Увеличиваем счетчик для всех активных чатов
  for (const chatId in incidentCounters) {
    incidentCounters[chatId] += 1;
    
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚨 Произошел инцидент', callback_data: 'incident' }]
        ]
      }
    };
    
    bot.sendMessage(chatId, `📅 Ежедневный отчет:\nБез инцидентов дней: ${incidentCounters[chatId]}`, options)
      .then(() => {
        console.log(`✅ Отчет отправлен в chat_id: ${chatId}`);
      })
      .catch(err => {
        console.error(`❌ Ошибка отправки отчета в chat_id ${chatId}:`, err.message);
      });
  }
}, {
  timezone: "UTC"
});

// ===== ЗАПУСК И МОНИТОРИНГ =====
console.log('='.repeat(50));
console.log('🤖 БОТ НАЧИНАЕТ РАБОТУ НА BOTHOST');
console.log(`⏰ Время запуска: ${new Date().toLocaleString('ru-RU')}`);
console.log(`🔑 Токен: ${BOT_TOKEN.substring(0, 10)}...`);
console.log('📡 Режим: Polling (с обработкой ошибок)');
console.log('='.repeat(50));
console.log('⚠️  Внимание: Счетчики хранятся в памяти и сбросятся при перезапуске бота.');
console.log('='.repeat(50));

// Простая проверка активности каждые 5 минут
setInterval(() => {
  const activeChats = Object.keys(incidentCounters).length;
  console.log(`📊 Статус: Активных чатов - ${activeChats}, Время - ${new Date().toLocaleTimeString('ru-RU')}`);
}, 5 * 60 * 1000);
