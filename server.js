const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Парсеры для JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL подключение
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// Временное хранилище пользователей (для теста)
const users = [];

// ★ ★ ★ ГЛАВНОЕ: Единый формат ответа ★ ★ ★
const sendResponse = (res, success, data, error = null) => {
  res.json({
    success: success,
    data: data,
    error: error,
    timestamp: new Date().toISOString()
  });
};

// ★ 1. РЕГИСТРАЦИЯ (POST /reg)
app.post('/reg', async (req, res) => {
  const { login, password } = req.body;
  
  // Проверка входных данных
  if (!login || !password) {
    return sendResponse(res, false, null, 'Missing login or password');
  }
  
  try {
    // Если есть БД - сохраняем туда
    if (pool) {
      await pool.query(
        'INSERT INTO users (login, password) VALUES ($1, $2) ON CONFLICT (login) DO NOTHING',
        [login, password]
      );
    }
    
    // Также сохраняем в память
    const existingUser = users.find(u => u.login === login);
    if (!existingUser) {
      users.push({ login, password });
    }
    
    sendResponse(res, true, { message: 'User registered' });
    
  } catch (err) {
    sendResponse(res, false, null, `Database error: ${err.message}`);
  }
});

// ★ 2. АВТОРИЗАЦИЯ (POST /aut) - ТОТ САМЫЙ ЭНДПОИНТ
app.post('/aut', async (req, res) => {
  const { login, password } = req.body;
  
  // Проверка входных данных
  if (!login || !password) {
    return sendResponse(res, false, null, 'Missing login or password');
  }
  
  try {
    // Сначала проверяем в БД
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM users WHERE login = $1 AND password = $2',
        [login, password]
      );
      
      if (result.rows.length > 0) {
        // ★ ВОТ ЭТО ОЖИДАЕТ KOTLIN ПРИЛОЖЕНИЕ ★
        return sendResponse(res, true, '15,20000,66,100');
      }
    }
    
    // Если БД нет или пользователь не найден - проверяем в памяти
    const user = users.find(u => u.login === login && u.password === password);
    if (user) {
      // ★ ВОТ ЭТО ОЖИДАЕТ KOTLIN ПРИЛОЖЕНИЕ ★
      return sendResponse(res, true, '15,20000,66,100');
    }
    
    // Если пользователь не найден
    sendResponse(res, false, null, 'Invalid login or password');
    
  } catch (err) {
    sendResponse(res, false, null, `Server error: ${err.message}`);
  }
});

// ★ 3. ПРОВЕРКА СЕРВЕРА (GET /ping)
app.get('/ping', (req, res) => {
  sendResponse(res, true, 'pong');
});

// ★ 4. ИНФОРМАЦИЯ О СЕРВЕРЕ (GET /info)
app.get('/info', (req, res) => {
  sendResponse(res, true, {
    server: 'StreetRacing Auth Server',
    port: PORT,
    database: pool ? 'connected' : 'not connected',
    usersInMemory: users.length,
    endpoints: ['POST /reg', 'POST /aut', 'GET /ping']
  });
});

// ★ 5. HTML страница для браузера (ОПЦИОНАЛЬНО)
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Auth Server API</title></head>
    <body>
      <h1>StreetRacing Auth Server</h1>
      <p>Server is running on port ${PORT}</p>
      <p>Use these endpoints:</p>
      <ul>
        <li><strong>POST /reg</strong> - регистрация</li>
        <li><strong>POST /aut</strong> - авторизация (для Kotlin app)</li>
        <li><strong>GET /ping</strong> - проверка сервера</li>
        <li><strong>GET /info</strong> - информация о сервере</li>
      </ul>
      <p>Kotlin app expects JSON: {"success": true, "data": "15,20000,66,100"}</p>
    </body>
    </html>
  `);
});

// ★ Запуск сервера
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`✅ Auth Server запущен на порту ${PORT}`);
  console.log(`📌 Для Kotlin app: POST /aut`);
  console.log(`📌 Формат ответа: {"success": true, "data": "15,20000,66,100"}`);
  console.log('='.repeat(60));
});
