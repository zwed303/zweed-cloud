const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = './users.json';
const UPLOADS_DIR = './uploads';
const AVATARS_DIR = './uploads/avatars';

[UPLOADS_DIR, AVATARS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function loadUsers() { return fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : []; }
function saveUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'zweed-v8-ultra', resave: false, saveUninitialized: true }));
app.use('/download', express.static('uploads'));

const THEME = (content, user = null) => {
    const avatarPath = user && user.avatar ? '/download/avatars/' + user.avatar : null;
    const isAdmin = user && (user.role === 'admin' || user.username === 'Zwed');
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { -webkit-tap-highlight-color: transparent !important; outline: none !important; box-shadow: none !important; user-select: none; }
        body { background: #0b0e11; color: white; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .header { position: absolute; top: 20px; left: 20px; z-index: 100; }
        .menu-btn { font-size: 28px; color: #007bff; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1c1e21; transition: 0.3s; z-index: 1000; padding: 20px; box-sizing: border-box; border-right: 1px solid #333; }
        .sidebar.active { left: 0; }
        .close-sidebar { position: absolute; top: 20px; right: 20px; font-size: 20px; color: #666; cursor: pointer; }
        .profile-section { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid #333; margin-bottom: 20px; }
        .avatar-circle { width: 55px; height: 55px; border-radius: 50%; background: #0b0e11; overflow: hidden; border: 2px solid #007bff; display: flex; align-items: center; justify-content: center; }
        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .container { background: #1c1e21; padding: 30px; border-radius: 20px; width: 85%; max-width: 350px; text-align: center; margin-top: 100px; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #007bff; margin: 0 0 20px 0; font-size: 1.6rem; }
        input { width: 100%; padding: 12px; margin: 8px 0; background: #0b0e11; border: 1px solid #333; color: white; border-radius: 10px; box-sizing: border-box; }
        .btn { background: #007bff; color: white; border: none; padding: 15px; width: 100%; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        .btn-danger { background: #ff4d4d; padding: 8px 12px; font-size: 0.8rem; border-radius: 8px; border:none; color:white; cursor:pointer; text-decoration: none;}
        .sidebar a { display: flex; align-items: center; gap: 10px; color: #eee; text-decoration: none; padding: 12px; border-radius: 10px; margin: 5px 0; }
        .sidebar a:hover { background: #007bff; }
        .footer { margin-top: 25px; font-size: 0.8rem; color: #555; font-weight: bold; text-align: center; }
    </style>
</head>
<body>
    ${user ? `
    <div class="header" onclick="toggleSidebar()"><i class="fas fa-bars menu-btn"></i></div>
    <div class="sidebar" id="sidebar">
        <div class="close-sidebar" onclick="toggleSidebar()"><i class="fas fa-times"></i></div>
        <div class="profile-section">
            <div class="avatar-circle">${avatarPath ? '<img src="'+avatarPath+'">' : '<i class="fas fa-user" style="color:#007bff"></i>'}</div>
            <div><h2 style="margin:0; font-size:1rem;">${user.username}</h2><p style="margin:0; font-size:0.7rem; color:#007bff;">${(user.role === 'admin' || user.username === 'Zwed') ? 'Kurucu Admin' : 'Zweed VIP'}</p></div>
        </div>
        <a href="/"><i class="fas fa-home"></i> Ana Sayfa</a>
        <a href="/dosyalar"><i class="fas fa-folder"></i> Dosyalarım</a>
        <a href="/hesap"><i class="fas fa-user-cog"></i> Hesap Paneli</a>
        ${(user.role === 'admin' || user.username === 'Zwed') ? '<a href="/admin" style="background: #007bff22; color: #007bff;"><i class="fas fa-shield-alt"></i> Admin Paneli</a>' : ''}
        <a href="/logout" style="color:#ff4d4d; margin-top:20px;"><i class="fas fa-sign-out-alt"></i> Çıkış Yap</a>
    </div>` : ''}
    <div class="container">${content}</div>
    <div class="footer">Created By Zweed DEV.<br>Discord: zweed888</div>
    <script>function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('active'); }</script>
</body>
</html>`;
};

const checkAuth = (req, res, next) => { req.session.user ? next() : res.redirect('/login'); };
const checkAdmin = (req, res, next) => { 
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.username === 'Zwed')) {
        next();
    } else {
        res.send("<script>alert('Yetkin yok kanka!'); window.location='/';</script>");
    }
};

app.get('/login', (req, res) => res.send(THEME(`<h1>Giriş</h1><form action="/login" method="POST"><input name="username" placeholder="Kullanıcı Adı" required><input name="password" type="password" placeholder="Şifre" required><button class="btn">GİRİŞ YAP</button></form><a href="/register" style="color:#007bff;text-decoration:none;font-size:0.8rem;display:block;margin-top:15px;">Kayıt Ol</a>`)));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = loadUsers().find(u => u.username === username && u.password === password);
    if (user) { req.session.user = user; res.redirect('/'); }
    else res.send("<script>alert('Bilgiler hatalı!'); window.location='/login';</script>");
});

app.get('/register', (req, res) => res.send(THEME(`<h1>Kayıt Ol</h1><form action="/register" method="POST"><input name="username" placeholder="Kullanıcı Adı" required><input name="password" type="password" placeholder="Şifre" required><button class="btn">KAYDOL</button></form>`)));
app.post('/register', (req, res) => {
    let users = loadUsers();
    if(users.find(u => u.username === req.body.username)) return res.send("Bu kullanıcı adı alınmış.");
    const role = (users.length === 0 || req.body.username === 'Zwed') ? 'admin' : 'user';
    users.push({ username: req.body.username, password: req.body.password, avatar: null, role: role });
    saveUsers(users);
    res.redirect('/login');
});

app.get('/admin', checkAuth, checkAdmin, (req, res) => {
    const files = fs.readdirSync(UPLOADS_DIR).filter(f => f !== 'avatars');
    const list = files.map(f => `
        <div style="background:#0b0e11; margin:8px 0; padding:12px; border-radius:12px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center; text-align:left;">
            <span style="font-size:0.7rem; color:#aaa; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:150px;">${f}</span>
            <a href="/admin/delete/${f}" class="btn-danger" onclick="return confirm('Siliyom bak?')">SİL</a>
        </div>`).join('');
    res.send(THEME(`<h1>Admin Kontrol</h1><p style="font-size:0.8rem; color: #666;">Toplam dosya: ${files.length}</p>${list || '<p>Bulut boş.</p>'} <a href="/" style="color:#007bff; text-decoration:none; display:block; margin-top:20px;">Geri Dön</a>`, req.session.user));
});

app.get('/admin/delete/:filename', checkAuth, checkAdmin, (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/admin');
});

app.get('/hesap', checkAuth, (req, res) => {
    res.send(THEME(`<h1>Hesap Paneli</h1><form action="/update-account" method="POST" enctype="multipart/form-data"><h3>Profil Bilgileri</h3><input name="newUsername" value="${req.session.user.username}" placeholder="Yeni Kullanıcı Adı"><input type="file" name="avatar" accept="image/*"><h3>Güvenlik</h3><input name="newPassword" type="password" placeholder="Yeni Şifre"><button class="btn">GÜNCELLE</button></form>`, req.session.user));
});

app.post('/update-account', checkAuth, multer({dest: AVATARS_DIR}).single('avatar'), (req, res) => {
    let users = loadUsers();
    const idx = users.findIndex(u => u.username === req.session.user.username);
    if(req.body.newUsername) users[idx].username = req.body.newUsername;
    if(req.body.newPassword && req.body.newPassword !== "") users[idx].password = req.body.newPassword;
    if(req.file) users[idx].avatar = req.file.filename;
    saveUsers(users);
    req.session.user = users[idx];
    res.send("<script>alert('Güncellendi!'); window.location='/hesap';</script>");
});

app.get('/', checkAuth, (req, res) => res.send(THEME(`<h1>Zweed Cloud</h1><p style="font-size:0.9rem; color:#aaa;">Hoş geldin, bulutun hazır.</p><form action="/upload" method="POST" enctype="multipart/form-data"><input type="file" name="file" required><button class="btn">DOSYAYI YÜKLE</button></form>`, req.session.user)));
app.post('/upload', checkAuth, multer({dest: UPLOADS_DIR}).single('file'), (req, res) => res.redirect('/dosyalar'));

app.get('/dosyalar', checkAuth, (req, res) => {
    const files = fs.readdirSync(UPLOADS_DIR).filter(f => f !== 'avatars');
    const list = files.map(f => `<div style="background:#0b0e11; margin:8px 0; padding:12px; border-radius:12px; border:1px solid #333;"><a href="/download/${f}" target="_blank" style="color:#007bff; text-decoration:none; font-size:0.8rem;">${f}</a></div>`).join('');
    res.send(THEME(`<h1>Dosyalarım</h1>${list || '<p>Dosya yok.</p>'}<a href="/" style="color:#007bff; text-decoration:none; display:block; margin-top:20px;">Geri Dön</a>`, req.session.user));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });
app.listen(PORT, () => console.log('Zweed Cloud v8 Admin Edition Online!'));
