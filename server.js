const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ВАЖНО: Только JSON парсер
app.use(express.json());

// Хранилище в памяти
const users = [
  { login: 'test', password: 'test', data: '15,20000,66,100' }
];

// ★ ★ ★ ЭНДПОИНТ ДЛЯ СТАРОГО KOTLIN КОДА ★ ★ ★
app.post('/aut', (req, res) => {
  console.log('📱 Kotlin запрос на /aut:', req.body);
  
  const { login, password } = req.body;
  
  if (!login || !password) {
    console.log('❌ Нет логина или пароля');
    return res.status(400).send('ERROR: Missing login or password');
  }
  
  // Ищем пользователя
  const user = users.find(u => 
    u.login === login && u.password === password
  );
  
  if (user) {
    console.log('✅ Успешная авторизация:', login);
    // ★ ВОТ ТОЧНО ТОТ ФОРМАТ, КОТОРЫЙ ЖДЁТ KOTLIN ★
    res.send(user.data); // Просто "15,20000,66,100"
  } else {
    console.log('❌ Неверные данные:', login);
    res.status(401).send('ERROR: Invalid credentials');
  }
});

// ★ Регистрация
app.post('/reg', (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const existingUser = users.find(u => u.login === login);
  if (existingUser) {
    return res.status(409).json({ error: 'User exists' });
  }
  
  users.push({
    login,
    password,
    data: '15,20000,66,100'
  });
  
  console.log('✅ Новый пользователь:', login);
  res.json({ success: true });
});

// ★ Проверка
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ★ Инфо
app.get('/', (req, res) => {
  res.send(`
    <h1>StreetRacing Auth Server</h1>
    <p>Порт: ${PORT}</p>
    <p>Пользователей: ${users.length}</p>
    <p>Для Kotlin: POST /aut с JSON {"login":"test","password":"test"}</p>
    <p><strong>Вернёт просто текст: 15,20000,66,100</strong></p>
  `);
});

// ★ Запуск
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Kotlin endpoint: POST /aut`);
  console.log('📤 Ответ: "15,20000,66,100" (простой текст)');
  console.log('='.repeat(50));
});
