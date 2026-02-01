const express = require('express');
const app = express();
const mysql = require('mysql');

// Только Express парсеры
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Подключение к базе
let sqlconnection = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "user1",
  password: '123456789',
  database: 'users'
});

// ★ ДОБАВЛЕНО: Главная страница
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Сервер авторизации</title></head>
    <body>
      <h1>✅ Сервер работает на порту 3000!</h1>
      <h2>Тестирование через формы:</h2>
      
      <form action="/reg" method="POST" style="margin: 20px; padding: 20px; border: 1px solid #ccc;">
        <h3>Регистрация (POST /reg)</h3>
        Логин: <input type="text" name="login"><br>
        Пароль: <input type="password" name="password"><br>
        <button type="submit">Зарегистрироваться</button>
      </form>
      
      <form action="/aut" method="POST" style="margin: 20px; padding: 20px; border: 1px solid #ccc;">
        <h3>Авторизация (POST /aut)</h3>
        Логин: <input type="text" name="login"><br>
        Пароль: <input type="password" name="password"><br>
        <button type="submit">Войти</button>
      </form>
      
      <p><a href="/ping">Проверить /ping</a></p>
      <p>Время: ${new Date().toLocaleTimeString()}</p>
    </body>
    </html>
  `);
});

app.post('/reg', (req, res) => {
  var login = req.body.login;
  var passw = req.body.password;
  const user = [login, passw];
  const sql = "INSERT INTO names(name, password) VALUES(?, ?)";
  const sql1 = "SELECT * FROM names WHERE name=?";
  
  sqlconnection.query(sql1, login, function(err, results) {
    if(err) {
      console.log('Ошибка поиска:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    if (results.length) {
      console.log('АВТОРИЗАЦИЯ: Пользователь ' + login + ' уже зарегистрирован');
      return res.send('Не удалось зарегистрироваться');
    } else {
      sqlconnection.query(sql, user, function(err, results) {
        if(err) {
          console.log('Ошибка регистрации:', err);
          return res.status(500).send('Ошибка сервера');
        }
        console.log('РЕГИСТРАЦИЯ: Пользователь ' + login + ' зарегистрирован');
        return res.send('Успешная регистрация!');
      });
    }
  });
});

app.post('/aut', (req, res) => {
  var alogin = req.body.login;
  var apassw = req.body.password;
  const sql1 = "SELECT password FROM names WHERE name=?";
  
  sqlconnection.query(sql1, alogin, function(err, results) {
    if(err) {
      console.log('Ошибка авторизации:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    if (results.length) {
      var insertedpassword = results[0].password;
      console.log('Пароль из БД:', insertedpassword);
      
      if (insertedpassword == apassw) {
        console.log('АВТОРИЗАЦИЯ: Пользователь ' + alogin + ' вошел');
        return res.send('15,20000,66,100');
      } else {
        console.log('АВТОРИЗАЦИЯ: ' + alogin + ' не подобрал пароль');
        return res.send('Неправильный пароль!');
      }
    } else {
      console.log('АВТОРИЗАЦИЯ: Пользователь ' + alogin + ' не найден');
      return res.send('Пользователь не существует');
    }
  });
});

// ★ ИСПРАВЛЕНО: добавлен req
app.get('/ping', (req, res) => {
  res.send('OK');
});





// Проверка подключения к БД
sqlconnection.getConnection((err, connection) => {
  if (err) {
    console.log('❌ Ошибка MySQL:', err.message);
  } else {
    console.log('✅ MySQL подключен успешно!');
    connection.release();
  }
});

// ★ ИСПРАВЛЕНО: ОДИН app.listen() в конце!
app.listen(8080, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('✅ Сервер запущен!');
  console.log('📌 Локально: http://localhost:8080');
  console.log('📌 В сети: http://192.168.10.XXX:3000');
  console.log('📌 Из интернета: http://ВАШ_ВНЕШНИЙ_IP:3000');
  console.log('='.repeat(50));
});