// Основные библиотеки
const express = require("express");
const server = express();
const http = require("http").createServer(server).listen(3000);
const io = require("socket.io")(http);
const fs = require("fs-extra");

// Подключение статических папок
server.use(express.static(__dirname + "/js"));
server.use(express.static(__dirname + "/css"));

// Подключение главной html страницы
server.get("/", (request, response) => {
    response.sendFile(__dirname + "/login.html");
});

// Подключение страницы регистрации
server.get("/register", (request, response) => {
    response.sendFile(__dirname + "/register.html");
});

// Подключение страницы личного кабинета
server.get("/dashboard", (request, response) => {
    response.sendFile(__dirname + "/dashboard.html");
});

const sessions = {}; // Хранит логины пользователей по их сокетам

// Родительский сокет
io.sockets.on("connection", (socket) => {
    console.log(`Новый пользователь подключен: ${socket.id}`);

    socket.on("авторизация", (логин_с_клиента, пароль_с_клиента) => {
        let database = fs.readJSONSync("database.json");
        for (let user of database) {
            if (логин_с_клиента === user.login && пароль_с_клиента === user.password) {
                sessions[socket.id] = логин_с_клиента; // Сохраняем логин по ID сокета
                console.log(`Пользователь авторизован: ${логин_с_клиента}`);
                socket.emit("переадресация");
                socket.emit("пользовательДанные", логин_с_клиента);
                return; // Завершаем обработку
            }
        }
        console.log("Неверные данные для авторизации.");
    });

    socket.on("регистрация", (логин, пароль) => {
        let database = fs.readJSONSync("database.json");
        let user = { "login": логин, "password": пароль };
        database.push(user);
        fs.writeFileSync("database.json", JSON.stringify(database, null, 4));

        sessions[socket.id] = логин; // Сохраняем логин при регистрации
        console.log(`Пользователь зарегистрирован: ${логин}`);
        socket.emit("переадресация");
        socket.emit("пользовательДанные", логин);
    });
});
