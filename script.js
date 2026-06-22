// === ПОДКЛЮЧЕНИЕ PUSHER ===
const pusher = new Pusher('373931c2b8d081fd1db7', {
  cluster: 'eu',

});

const channel = pusher.subscribe('presence-chat-channel');
// ==========================

// Получаем элементы (ТОЛЬКО ОДИН РАЗ!)
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const nicknameInput = document.getElementById('nickname');
const sendButton = document.getElementById('sendBtn');
const smileyPanel = document.querySelectorAll('.smiley');

// Генерим уникальный ID сессии
const sessionId = Date.now().toString();

// Загружаем сообщения из localStorage
function loadMessages() {
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const currentNickname = nicknameInput.value.trim() || 'Гость';

    savedMessages.forEach(msg => {
        const isOwn = msg.sessionId === sessionId;
        addMessageToDOM(msg.nickname, msg.text, isOwn);
    });
}

// Добавляем сообщение в DOM
function addMessageToDOM(nickname, text, isOwn = false) {
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

    messageElement.appendChild(header);
    messageElement.appendChild(textNode);
    messageElement.appendChild(content);

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
    const nickname = nicknameInput.value.trim() || 'Гость';
    const message = messageInput.value.trim();

    if (message) {
        const msgData = {
            nickname,
            text: message,
            sessionId
        };

        // Отправляем через Pusher
        channel.trigger('client-message', msgData);

        // Добавляем локально
        addMessageToDOM(nickname, message, true);

        // Сохраняем в localStorage
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messages.push(msgData);
        localStorage.setItem('chatMessages', JSON.stringify(messages));

        // Очищаем поле
        messageInput.value = '';
        messageInput.focus();
    }
}

// Получаем сообщения от других пользователей
channel.bind('client-message', function(data) {
    if (data.sessionId === sessionId) return;

    addMessageToDOM(data.nickname, data.text, false);

    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.push(data);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
});

// Обработчики событий
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Вставка смайликов
smileyPanel.forEach(smiley => {
    smiley.addEventListener('click', () => {
        messageInput.value += smiley.getAttribute('data-smiley');
        messageInput.focus();
    });
});

// Перезагрузка при смене ника
nicknameInput.addEventListener('change', loadMessages);
nicknameInput.addEventListener('blur', loadMessages);

// Загружаем сообщения при старте
loadMessages();
