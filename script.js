// Получаем элементы
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const nicknameInput = document.getElementById('nickname');
const sendButton = document.getElementById('sendBtn');
const smileyPanel = document.querySelectorAll('.smiley');

// Загружаем сообщения из localStorage
function loadMessages() {
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const currentNickname = nicknameInput.value.trim() || 'Гость';

    savedMessages.forEach(msg => {
        const isOwn = msg.isOwn || (msg.nickname === currentNickname);
        addMessageToDOM(msg.nickname, msg.text, isOwn, false); // не сохраняем повторно
    });
}

// Добавляем сообщение в DOM
function addMessageToDOM(nickname, text, isOwn = false, save = true) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    if (isOwn) {
        messageElement.classList.add('my-message');
    } else {
        messageElement.classList.add('other-message');
    }

    // Заголовок с ником
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

    // Сохраняем в localStorage
    if (save) {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messages.push({ nickname, text, isOwn });
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
}

// Отправка сообщения
function sendMessage() {
    const nickname = nicknameInput.value.trim() || 'Гость';
    const message = messageInput.value.trim();

    if (message) {
        addMessageToDOM(nickname, message, true); // это наше сообщение
        messageInput.value = '';
        messageInput.focus();
    }
	
}

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

// Сохраняем ник при изменении (чтобы определить "свои" сообщения)
nicknameInput.addEventListener('change', () => {
    loadMessages(); // перезагружаем с новым ником
});
nicknameInput.addEventListener('blur', () => {
    loadMessages();
});

// Загружаем сообщения при старте
loadMessages();
