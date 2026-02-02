const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ВАЖНО: Только JSON парсер
app.use(express.json());

// Хранилище в памяти
const users = [
  { login: 'test', password: 'test', data: '15,20000,66,100' }
];

// ★ ★ ★ ГЛАВНЫЙ ЭНДПОИНТ ДЛЯ KOTLIN ★ ★ ★
app.post('/aut', (req, res) => {
  console.log('📱 Kotlin запрос на /aut:', req.body);
  
  const { login, password } = req.body;
  
  if (!login || !password) {
    console.log('❌ Нет логина или пароля');
    return res.json({
      success: false,
      error: 'Нужны login и password'
    });
  }
  
  // Ищем пользователя
  const user = users.find(u => 
    u.login === login && u.password === password
  );
  
  if (user) {
    console.log('✅ Успешная авторизация:', login);
    // ★ ВОТ ТОТ САМЫЙ ОТВЕТ ДЛЯ KOTLIN ★
    res.json({
      success: true,
      data: user.data
    });
  } else {
    console.log('❌ Неверные данные:', login);
    res.json({
      success: false,
      error: 'Неверный логин или пароль'
    });
  }
});

// ★ Регистрация (простая)
app.post('/reg', (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.json({
      success: false,
      error: 'Нужны login и password'
    });
  }
  
  const existingUser = users.find(u => u.login === login);
  if (existingUser) {
    return res.json({
      success: false,
      error: 'Пользователь уже существует'
    });
  }
  
  users.push({
    login,
    password,
    data: '15,20000,66,100' // Стандартные данные
  });
  
  console.log('✅ Новый пользователь:', login);
  
  res.json({
    success: true,
    message: 'Пользователь создан'
  });
});

// ★ Проверка сервера
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', server: 'streetracing' });
});

// ★ Информация
app.get('/', (req, res) => {
  res.send(`
    <h1>StreetRacing Auth Server</h1>
    <p>Порт: ${PORT}</p>
    <p>Пользователей: ${users.length}</p>
    <p>Для Kotlin: POST /aut с JSON {"login":"test","password":"test"}</p>
  `);
});

// ★ Запуск
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Kotlin endpoint: POST /aut`);
  console.log('='.repeat(50));
  console.log('Тестовый пользователь:');
  console.log('  Логин: test');
  console.log('  Пароль: test');
  console.log('='.repeat(50));
});
