// === ПОДКЛЮЧЕНИЕ PUSHER ===
const pusher = new Pusher('373931c2b8d081fd1db7', {
  cluster: 'eu'
});

const channel = pusher.subscribe('public-chat');
channel.bind('pusher:subscription_succeeded', () => {
  console.log('✅ Подписка на public-chat успешна');
});


pusher.connection.bind('connected', () => {
  console.log('🟢 Pusher: подключён');
});

pusher.connection.bind('disconnected', () => {
  console.log('🔴 Pusher: отключён');
});

pusher.connection.bind('error', (err) => {
  console.error('❌ Ошибка Pusher:', err);
});



// ==========================

// Получаем элементы
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const nicknameInput = document.getElementById('nickname');
const sendButton = document.getElementById('sendBtn');
const smileyPanel = document.querySelectorAll('.smiley');
const typingIndicator = document.getElementById('typingIndicator');

// Генерим уникальный ID сессии
const sessionId = Date.now().toString();

// Формат времени: ЧЧ:ММ
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Проверка: введён ли ник
function isNicknameValid() {
  const nickname = nicknameInput.value.trim();
  return nickname.length > 0 && nickname !== 'Гость';
}

// Блокировка отправки, если ник не введён
function updateSendButton() {
  if (!isNicknameValid()) {
    messageInput.placeholder = 'Сначала введи ник!';
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.style.opacity = '0.5';
  } else {
    messageInput.placeholder = 'Напиши сообщение...';
    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.style.opacity = '1';
  }
}

// Загружаем сообщения из localStorage
function loadMessages() {
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const currentNickname = nicknameInput.value.trim() || 'Гость';

    savedMessages.forEach(msg => {
        const isOwn = msg.sessionId === sessionId;
        addMessageToDOM(msg.nickname, msg.text, isOwn, msg.time);
    });
}

// Добавляем сообщение в DOM
function addMessageToDOM(nickname, text, isOwn = false, time = getCurrentTime()) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isOwn ? 'my-message' : 'other-message');

    const header = document.createElement('span');
    header.classList.add('message-header');
    header.textContent = nickname || 'Гость';

    const textNode = document.createTextNode(': ');
    const content = document.createElement('span');
    content.innerHTML = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Время
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    timeSpan.textContent = time;

    messageElement.appendChild(header);
    messageElement.appendChild(textNode);
    messageElement.appendChild(content);
    messageElement.appendChild(timeSpan);

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
    const nickname = nicknameInput.value.trim();
    const message = messageInput.value.trim();

    if (!isNicknameValid()) {
        alert('⚠️ Сначала введи свой ник!');
        nicknameInput.focus();
        return;
    }

    if (message) {
        const time = getCurrentTime();
        const msgData = {
            nickname,
            text: message,
            sessionId,
            time
        };

        channel.trigger('client-message', msgData);
        addMessageToDOM(nickname, message, true, time);

        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messages.push(msgData);
        localStorage.setItem('chatMessages', JSON.stringify(messages));

        messageInput.value = '';
        messageInput.focus();
    }
}

// Получаем сообщения от других пользователей
channel.bind('client-message', function(data) {
    if (data.sessionId === sessionId) return;

    addMessageToDOM(data.nickname, data.text, false, data.time);

    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.push(data);
    localStorage.setItem('chatMessages', JSON.stringify(messages));

    // 🔊 Звук при сообщении
    const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-digital-clock-digital-alarm-bonus-992.mp3');
    sound.play().catch(() => {});
});

// Эффект "набирает..."
let typingTimer;
messageInput.addEventListener('input', () => {
    if (!isNicknameValid()) return;

    const nickname = nicknameInput.value.trim();
    channel.trigger('client-typing', { nickname });

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        channel.trigger('client-typing-stop', {});
    }, 1000);
});

channel.bind('client-typing', function(data) {
    typingIndicator.textContent = `${data.nickname} набирает...`;
    typingIndicator.style.display = 'block';
});

channel.bind('client-typing-stop', function() {
    typingIndicator.style.display = 'none';
});

// Обработчики событий
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Смайлики
smileyPanel.forEach(smiley => {
    smiley.addEventListener('click', () => {
        if (!isNicknameValid()) {
            alert('⚠️ Сначала введи ник!');
            nicknameInput.focus();
            return;
        }
        messageInput.value += smiley.getAttribute('data-smiley');
        messageInput.focus();
    });
});

// Обновление кнопки при изменении ника
nicknameInput.addEventListener('input', updateSendButton);
nicknameInput.addEventListener('change', loadMessages);
nicknameInput.addEventListener('blur', loadMessages);

// Инициализация при старте
updateSendButton();
loadMessages();
