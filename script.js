const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const nicknameInput = document.getElementById('nickname');
const sendButton = document.getElementById('sendBtn');


// Ключ для localStorage
const STORAGE_KEY = 'icq-chat-messages';



// Получаем время
function getCurrentTime() {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

// Загружаем сообщения из localStorage
function loadMessages() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const messages = saved ? JSON.parse(saved) : getDefaultMessages();
  messages.forEach(msg => addMessageToDOM(msg.nickname, msg.text, msg.isMy));
}

// Сохраняем все сообщения
function saveMessages() {
  const messageElements = messagesDiv.querySelectorAll('.message');
  const messages = [];

  messageElements.forEach(el => {
    const header = el.querySelector('.message-header');
    const nickname = header ? header.querySelector('span:first-child').textContent : 'Аноним';
    const text = el.querySelector('.message-content').textContent;
    const isMy = el.classList.contains('my-message');
    messages.push({ nickname, text, isMy });
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// Добавляем сообщение в DOM
function addMessageToDOM(nickname, text, isMy = true) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message ' + (isMy ? 'my-message' : 'other-message');

  messageElement.innerHTML = `
    <div class="message-header">
      <span>${nickname}</span>
      <span>${getCurrentTime()}</span>
    </div>
    <div class="message-content">${text}</div>
  `;

  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
  const text = messageInput.value.trim();
  const nickname = nicknameInput.value.trim() || 'Аноним';

  if (text === '') return;

  // 🔁 Автозамена текстовых смайлов
  const withEmojis = text
    .replace(/:\)/g, '🙂')
    .replace(/:\(/g, '🙁')
    .replace(/:D/g, '😂')
    .replace(/<3/g, '❤️')
    .replace(/:\|/g, '😐')
    .replace(/;\)/g, '😉');

  addMessageToDOM(nickname, withEmojis, true);
  saveMessages();
  messageInput.value = '';
}




// Сообщения по умолчанию
function getDefaultMessages() {
  return [
    { nickname: 'Система', text: 'Добро пожаловать в ICQ-общалку Нажмите Enter, чтобы отправить.', isMy: false },
    { nickname: 'Гость92', text: 'Привет Это реально как в 2005 году 😂', isMy: false }
  ];
}

// Обработчики
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Загружаем при старте
window.addEventListener('load', () => {
  loadMessages();

  // Приветствие (только если чат пуст)
  setTimeout(() => {
    if (messagesDiv.children.length === 0) {
      addMessageToDOM('ICQ Бот', `Привет, ${nicknameInput.value || 'Гость'} Добро пожаловать в ретро-чат 🖥️`, false);
      saveMessages();
    }
  }, 500);
});
// 😄 Вставка смайликов
document.querySelectorAll('.smiley').forEach(smiley => {
  smiley.addEventListener('click', () => {
    const symbol = smiley.getAttribute('data-smiley');
    messageInput.value += symbol;
    messageInput.focus(); // курсор остаётся в поле
  });
});


// Автосохранение (на всякий случай)
window.addEventListener('beforeunload', saveMessages);
