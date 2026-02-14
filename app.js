const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE = 'users.json';

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'zweed-gizli-anahtar',
    resave: false,
    saveUninitialized: true
}));

// Admin Kontrol Fonksiyonu
const isAdmin = (user) => {
    return user && (user.role === 'admin' || user.username === 'Zwed');
};

const checkAuth = (req, res, next) => {
    if (req.session.user) next();
    else res.redirect('/login');
};

const checkAdmin = (req, res, next) => {
    if (isAdmin(req.session.user)) next();
    else res.status(403).send("Yetkin yok kanka! Sadece Zwed girebilir.");
};

app.get('/', (req, res) => {
    const user = req.session.user;
    let adminLink = isAdmin(user) ? '<br><a href="/admin" style="color:red; font-weight:bold;">[ADMİN PANELİ]</a>' : '';
    
    res.send(`
        <h1>Zweed Cloud v8</h1>
        ${user ? `<p>Hoş geldin ${user.username}! ${adminLink}</p><a href="/logout">Çıkış</a>` : '<a href="/login">Giriş</a> | <a href="/register">Kayıt</a>'}
    `);
});

app.get('/admin', checkAuth, checkAdmin, (req, res) => {
    res.send(`<h1>Zwed Özel Admin Paneli</h1><p>Dosyalar burada listelenecek...</p><a href="/">Geri Dön</a>`);
});

app.get('/login', (req, res) => {
    res.send('<form action="/login" method="POST">User: <input name="username"><br>Pass: <input name="password" type="password"><br><button>Giriş</button></form>');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.send('Hatalı giriş!');
    }
});

app.get('/register', (req, res) => {
    res.send('<form action="/register" method="POST">User: <input name="username"><br>Pass: <input name="password" type="password"><br><button>Kayıt Ol</button></form>');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    let users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    const role = (users.length === 0 || username === 'Zwed') ? 'admin' : 'user';
    users.push({ username, password, role });
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Zweed Cloud ${PORT} üzerinde aktif!`));
