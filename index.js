const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// ВАЖНО: Вставьте ваш токен от @BotFather между кавычками!
const token = '8548588340:AAFb9aV_DswdcTDcW_ElEMrQ_vDhDuy00Gk';
const bot = new TelegramBot(token, { polling: true });

let incidentCounters = {}; // Хранилище счетчиков (временное)

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();
  // ... (код инициализации и отправки сообщения с кнопкой)
});

bot.on('callback_query', (callbackQuery) => {
  // ... (код обработки нажатия кнопки "Произошел инцидент")
});

cron.schedule('0 12 * * *', () => {
  // ... (код для ежедневного увеличения счетчика и отправки отчета)
}, {
  timezone: "UTC"
});

console.log('Бот запущен!');
