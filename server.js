const express = require('express');
const session = require('express-session');
const PORT = 3000;
const bcrypt = require('bcrypt');
const pool = require('./db'); 
const app = express();
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= РЕГИСТРАЦИЯ =================
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body; 
    
    const login = name || (email ? email.split('@')[0] : 'user');

    try {
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).send('<h2>Ошибка: Пользователь с таким email уже существует!</h2><a href="/auth.html">Вернуться назад</a>'); 
        }

        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (login, password, email) VALUES ($1, $2, $3)', 
            [login, hash, email]
        );
        
        res.redirect('/auth.html?success=1');
    } catch (err) {
        console.error(err);
        res.status(500).send('<h2>Ошибка сервера при регистрации: ' + err.message + '</h2><a href="/auth.html">Вернуться назад</a>');
    }
});

// ================= ВХОД =================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; 

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).send('<h2>Ошибка: Пользователь с таким email не найден!</h2><a href="/auth.html">Вернуться назад</a>');
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(400).send('<h2>Ошибка: Неверный пароль!</h2><a href="/auth.html">Вернуться назад</a>');
        }

        req.session.userId = user.id;
        res.redirect('/profile.html'); 
        
    } catch (err) {
        console.error(err);
        res.status(500).send('<h2>Ошибка сервера при входе: ' + err.message + '</h2><a href="/auth.html">Вернуться назад</a>');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

app.post('/api/feedback', async (req, res) => {
    const { name, email, message } = req.body; 
    const userId = req.session.userId;
    
    if (!userId) {
        return res.redirect('/auth.html?error=1');
    }

    try {
        await pool.query(
            'INSERT INTO feedback (user_id, name, email, message) VALUES ($1, $2, $3, $4)',
            [userId, name, email, message] 
        );
    } catch (err) {
        console.error("Ошибка при записи в БД:", err);
        return res.redirect('/contacts.html?error=1');
    }
    res.status(200).send('OK');
});

app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    try {
        const result = await pool.query('SELECT id, login, email FROM users WHERE id = $1', [req.session.userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`server start http://localhost:${PORT}`);
});
