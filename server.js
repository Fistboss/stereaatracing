const express = require('express');
const { Pool } = require('pg');

const app = express();

// Только Express парсеры
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Временное хранилище для демо (можно убрать после подключения БД)
let users = [];

// Проверка подключения к БД
pool.connect()
  .then(() => {
    console.log('✅ PostgreSQL подключен успешно!');
    
    // Создаем таблицу если её нет
    pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(err => console.log('⚠️ Таблица уже существует или ошибка:', err.message));
  })
  .catch(err => {
    console.log('❌ Ошибка PostgreSQL:', err.message);
  });

// ★ Главная страница
app.get('/', async (req, res) => {
  try {
    // Проверяем подключение к БД
    const dbResult = await pool.query('SELECT NOW()');
    const dbTime = dbResult.rows[0].now;
    
    res.send(`
      <html>
      <head>
        <title>Сервер авторизации</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .form-container { margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
          input { margin: 5px 0; padding: 8px; width: 200px; }
          button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
          button:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <h1>✅ Сервер работает!</h1>
        <p>Порт: ${process.env.PORT || 3000}</p>
        <p>Время в БД: ${dbTime}</p>
        <p>PostgreSQL: подключено ✅</p>
        
        <h2>Тестирование через формы:</h2>
        
        <div class="form-container">
          <h3>Регистрация (POST /reg)</h3>
          <form action="/reg" method="POST">
            Логин: <br><input type="text" name="login" required><br>
            Пароль: <br><input type="password" name="password" required><br>
            <button type="submit">Зарегистрироваться</button>
          </form>
        </div>
        
        <div class="form-container">
          <h3>Авторизация (POST /aut)</h3>
          <form action="/aut" method="POST">
            Логин: <br><input type="text" name="login" required><br>
            Пароль: <br><input type="password" name="password" required><br>
            <button type="submit">Войти</button>
          </form>
        </div>
        
        <p><a href="/ping">Проверить /ping</a></p>
        <p>Текущее время: ${new Date().toLocaleTimeString()}</p>
        <p>Количество пользователей в памяти: ${users.length}</p>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`
      <h1>⚠️ Сервер работает, но БД нет</h1>
      <p>Ошибка: ${err.message}</p>
      <p>Проверьте подключение к PostgreSQL</p>
    `);
  }
});

// Регистрация
app.post('/reg', async (req, res) => {
  const { login, password } = req.body;
  
  try {
    // Проверяем в БД
    const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    
    if (result.rows.length > 0) {
      return res.json({ error: 'User already exists in database' });
    }
    
    // Добавляем в БД
    await pool.query('INSERT INTO users (login, password) VALUES ($1, $2)', [login, password]);
    
    // Также добавляем во временное хранилище для совместимости
    users.push({ login, password });
    
    console.log('Registered in DB:', login);
    res.json({ success: true, message: 'Registered in database' });
  } catch (err) {
    console.log('DB error:', err.message);
    
    // Fallback на временное хранилище если БД не работает
    const existingUser = users.find(u => u.login === login);
    if (existingUser) {
      return res.json({ error: 'User already exists in memory' });
    }
    
    users.push({ login, password });
    console.log('Registered in memory:', login);
    res.json({ success: true, message: 'Registered in memory (DB fallback)' });
  }
});

// Авторизация
app.post('/aut', async (req, res) => {
  const { login, password } = req.body;
  
  try {
    // Пробуем найти в БД
    const result = await pool.query(
      'SELECT * FROM users WHERE login = $1 AND password = $2',
      [login, password]
    );
    
    if (result.rows.length > 0) {
      return res.json({ success: true, data: '15,20000,66,100', source: 'database' });
    }
  } catch (err) {
    console.log('DB auth error:', err.message);
  }
  
  // Fallback на временное хранилище
  const user = users.find(u => u.login === login && u.password === password);
  if (user) {
    res.json({ success: true, data: '15,20000,66,100', source: 'memory' });
  } else {
    res.json({ error: 'Invalid credentials' });
  }
});

// ★ Health check для Render
app.get('/ping', (req, res) => {
  res.send('OK');
});

// ★ Используем порт из переменной окружения
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ Сервер запущен на порту ${PORT}!`);
  console.log(`📌 Ссылка: https://your-service.onrender.com`);
  console.log('='.repeat(50));
});
