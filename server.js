const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json());

app.use(express.static(__dirname));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/api/status', (req, res) => {
    res.json({ message: 'Сервер работает на порту ' + PORT });
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1111',
    database: 'meatspace_db',
    port: 3307
});

db.connect((err) => {
    if (err) {
        console.log('MySQL подключение: ОШИБКА - ' + err.message);
    } else {
        console.log('MySQL подключение: УСПЕШНО');
    }
});

app.post('/api/register', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: 'Нужны логин и пароль' });
    }

    const checkSql = 'SELECT id FROM users WHERE login = ?';
    db.query(checkSql, [login], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Ошибка проверки:', checkErr);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        if (checkResult.length > 0) {
            return res.status(409).json({ message: 'Логин занят' });
        }

        const insertSql = 'INSERT INTO users (login, password) VALUES (?, ?)';
        db.query(insertSql, [login, password], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Ошибка регистрации:', insertErr);
                return res.status(500).json({ message: 'Ошибка регистрации' });
            }

            res.json({
                message: 'Регистрация успешна',
                user_id: insertResult.insertId,
                login: login
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: 'Нужны логин и пароль' });
    }

    const sql = 'SELECT id, login FROM users WHERE login = ? AND password = ?';
    
    db.query(sql, [login, password], (err, result) => {
        if (err) {
            console.error('Ошибка входа:', err);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        if (result.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        res.json({
            message: 'Вход выполнен',
            user_id: result[0].id,
            login: result[0].login
        });
    });
});

app.post('/api/create_order', (req, res) => {
    const { user_id, total_price, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Корзина пуста' });
    }

    db.beginTransaction((beginErr) => {
        if (beginErr) {
            return res.status(500).json({ message: 'Ошибка сервера' });
        }

        const orderSql = 'INSERT INTO orders (user_id, total_price) VALUES (?, ?)';
        db.query(orderSql, [user_id || null, total_price || 0], (orderErr, orderResult) => {
            if (orderErr) {
                db.rollback(() => {
                    res.status(500).json({ message: 'Ошибка создания заказа' });
                });
                return;
            }

            const orderId = orderResult.insertId;
            let completed = 0;
            let hasError = false;

            items.forEach((item) => {
                const itemSql = 'INSERT INTO order_items (order_id, product_name, price, quantity, image_url) VALUES (?, ?, ?, ?, ?)';
                
                db.query(itemSql, [
                    orderId, 
                    item.name, 
                    item.price, 
                    item.quantity, 
                    item.image
                ], (itemErr) => {
                    if (itemErr && !hasError) {
                        hasError = true;
                        db.rollback(() => {
                            res.status(500).json({ message: 'Ошибка добавления товара' });
                        });
                        return;
                    }

                    completed++;
                    
                    if (completed === items.length && !hasError) {
                        db.commit((commitErr) => {
                            if (commitErr) {
                                db.rollback(() => {
                                    res.status(500).json({ message: 'Ошибка сохранения' });
                                });
                                return;
                            }

                            res.json({
                                message: 'Заказ создан',
                                order_id: orderId
                            });
                        });
                    }
                });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log('Сервер запущен: http://localhost:' + PORT);
    console.log('Папка проекта: ' + __dirname);
});