const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 8080;

// Express парсеры
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Папка для пользователей
const USERS_DIR = './users';

// ★ Создаём папку для пользователей если её нет
async function initUsersDir() {
  try {
    await fs.mkdir(USERS_DIR, { recursive: true });
    console.log('✅ Папка users создана');
  } catch (err) {
    console.log('❌ Ошибка создания папки:', err.message);
  }
}

// ★ Получить файл пользователя
function getUserFile(login) {
  return path.join(USERS_DIR, `${login}.json`);
}

// ★ Регистрация (создаём файл пользователя)
app.post('/reg', async (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).send('ERROR: Нужны логин и пароль');
  }
  
  // Проверяем, нет ли уже такого пользователя
  const userFile = getUserFile(login);
  
  try {
    await fs.access(userFile);
    // Файл существует - пользователь уже зарегистрирован
    console.log(`❌ Пользователь ${login} уже существует`);
    return res.send('Пользователь уже существует');
  } catch {
    // Файла нет - создаём нового пользователя
    const userData = {
      login: login,
      password: password,
      data: '15,20000,66,100', // Стандартные данные
      created: new Date().toISOString(),
      lastLogin: null
    };
    
    try {
      await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
      console.log(`✅ Пользователь ${login} зарегистрирован`);
      return res.send('Успешная регистрация!');
    } catch (err) {
      console.log('❌ Ошибка сохранения:', err.message);
      return res.status(500).send('Ошибка сервера');
    }
  }
});

// ★ Авторизация (читаем файл пользователя)
app.post('/aut', async (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).send('ERROR: Нужны логин и пароль');
  }
  
  const userFile = getUserFile(login);
  
  try {
    // Читаем файл пользователя
    const data = await fs.readFile(userFile, 'utf8');
    const userData = JSON.parse(data);
    
    // Проверяем пароль
    if (userData.password === password) {
      // Обновляем время последнего входа
      userData.lastLogin = new Date().toISOString();
      await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
      
      console.log(`✅ Пользователь ${login} вошёл`);
      return res.send(userData.data); // "15,20000,66,100"
    } else {
      console.log(`❌ Неверный пароль для ${login}`);
      return res.send('Неправильный пароль!');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Файл не найден - пользователь не существует
      console.log(`❌ Пользователь ${login} не найден`);
      return res.send('Пользователь не существует');
    } else {
      console.log('❌ Ошибка чтения файла:', err.message);
      return res.status(500).send('Ошибка сервера');
    }
  }
});

// ★ Обновить данные пользователя (например, после игры)
app.post('/update', async (req, res) => {
  const { login, password, data } = req.body;
  
  if (!login || !password || !data) {
    return res.status(400).send('ERROR: Нужны логин, пароль и данные');
  }
  
  const userFile = getUserFile(login);
  
  try {
    const fileData = await fs.readFile(userFile, 'utf8');
    const userData = JSON.parse(fileData);
    
    // Проверяем пароль
    if (userData.password !== password) {
      return res.send('Неверный пароль!');
    }
    
    // Обновляем данные
    userData.data = data;
    userData.updated = new Date().toISOString();
    
    await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
    console.log(`✅ Данные ${login} обновлены: ${data}`);
    return res.send('Данные обновлены');
  } catch (err) {
    console.log('❌ Ошибка обновления:', err.message);
    return res.status(500).send('Ошибка сервера');
  }
});

// ★ Получить информацию о пользователе (админка)
app.get('/user/:login', async (req, res) => {
  const login = req.params.login;
  const userFile = getUserFile(login);
  
  try {
    const data = await fs.readFile(userFile, 'utf8');
    const userData = JSON.parse(data);
    
    // Не показываем пароль
    delete userData.password;
    
    res.json(userData);
  } catch (err) {
    res.status(404).send('Пользователь не найден');
  }
});

// ★ Список всех пользователей
app.get('/users', async (req, res) => {
  try {
    const files = await fs.readdir(USERS_DIR);
    const users = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(USERS_DIR, file), 'utf8');
        const userData = JSON.parse(data);
        users.push({
          login: userData.login,
          created: userData.created,
          lastLogin: userData.lastLogin
        });
      }
    }
    
    res.json({
      count: users.length,
      users: users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ★ Главная страница
app.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(USERS_DIR).catch(() => []);
    const userCount = files.filter(f => f.endsWith('.json')).length;
    
    res.send(`
      <html>
      <head><title>Сервер авторизации (файловая система)</title></head>
      <body>
        <h1>✅ Сервер работает на порту ${PORT}!</h1>
        <p>Пользователей: ${userCount}</p>
        
        <h2>Тестирование:</h2>
        
        <form action="/reg" method="POST">
          <h3>Регистрация</h3>
          Логин: <input type="text" name="login"><br>
          Пароль: <input type="password" name="password"><br>
          <button>Зарегистрироваться</button>
        </form>
        
        <form action="/aut" method="POST">
          <h3>Авторизация</h3>
          Логин: <input type="text" name="login"><br>
          Пароль: <input type="password" name="password"><br>
          <button>Войти</button>
        </form>
        
        <p><a href="/users">Список пользователей</a></p>
        <p><a href="/ping">Проверить /ping</a></p>
        <p>Время: ${new Date().toLocaleTimeString()}</p>
        <p>Каждый пользователь хранится в отдельном файле</p>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<h1>Ошибка: ${err.message}</h1>`);
  }
});

// ★ Проверка сервера
app.get('/ping', (req, res) => {
  res.send('OK');
});

// ★ Запуск сервера
initUsersDir().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('✅ Сервер запущен!');
    console.log(`📌 Локально: http://localhost:${PORT}`);
    console.log(`📌 Папка пользователей: ${USERS_DIR}/`);
    console.log('📌 Каждый пользователь = отдельный .json файл');
    console.log('='.repeat(50));
  });
});
