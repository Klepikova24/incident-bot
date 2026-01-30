const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// 1. Токен бота (у вас уже верный)
const token = '8376764573:AAH5JpoqEtW1CfM60U3HYYVkkkMr45qoF0A';
const bot = new TelegramBot(token, { polling: true });

// 2. Временное хранилище (будет сбрасываться при перезапуске)
let incidentCounters = {};

// 3. Команда /start - отправляет приветствие и кнопку
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();
  
  // Если чата нет в хранилище, добавляем его с нулевым счетчиком
  if (!incidentCounters[chatId]) {
    incidentCounters[chatId] = 0;
  }

  // Создаем сообщение с инлайн-кнопкой
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚨 Произошел инцидент', callback_data: 'incident' }]
      ]
    }
  };

  // Отправляем сообщение с текущим счетчиком
  bot.sendMessage(chatId, `Бот для учета дней без инцидентов активирован!\nБез инцидентов дней: ${incidentCounters[chatId]}`, options);
});

// 4. Обработка нажатия кнопки "Инцидент"
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id.toString();
  
  // Проверяем, что нажали именно нашу кнопку
  if (callbackQuery.data === 'incident') {
    // Сбрасываем счетчик для этого чата на 0
    incidentCounters[chatId] = 0;
    
    // Подтверждаем нажатие пользователю
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Инцидент зарегистрирован!' });
    
    // Отправляем сообщение о сбросе
    bot.sendMessage(chatId, '🚨 Инцидент зарегистрирован. Счетчик сброшен.\nБез инцидентов дней: 0');
  }
});

// 5. Ежедневное уведомление (будет срабатывать в 12:00 по UTC)
cron.schedule('0 12 * * *', () => {
  console.log('⏰ Отправка ежедневных отчетов...');
  
  // Увеличиваем счетчик на 1 для всех известных чатов
  for (const chatId in incidentCounters) {
    incidentCounters[chatId] += 1;
    
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚨 Произошел инцидент', callback_data: 'incident' }]
        ]
      }
    };
    
    // Отправляем обновленный отчет в каждый чат
    bot.sendMessage(chatId, `📅 Ежедневный отчет:\nБез инцидентов дней: ${incidentCounters[chatId]}`, options);
  }
}, {
  timezone: "UTC"
});

console.log('🤖 Бот-счетчик дней без инцидентов запущен и ожидает команд...');
