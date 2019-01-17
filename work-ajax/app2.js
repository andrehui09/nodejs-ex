var express = require('express');
var app = express();
var serv = require('http').Server(app);

const uuid = require('uuid/v4');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

var users = { Andre: { wins: 50, played: 55 } }; //{name: {wins: , played: }}
var searching = {}; // {name: index} searching.keys().length
var games = {};
var invites = {};

var people = [{
    "username": "doctorwhocomposer",
    "password": "",
    "forename": "Delia",
    "surname": "Derbyshire",
    "access_token": "concertina",
    "stats": { "wins": "", "played": "" },
    "status": "offline",
    "game": { "id": "", "symbol": "" },
    "timeout": 0
}]

var validTokens = ["concertina"];

var messagelist = [["", "", "0"]];

const check = {
    "1": { "2": "3", "4": "6", "5": "9" },
    "2": { "1": "3", "5": "8" },
    "3": { "2": "1", "5": "7", "6": "9" },
    "4": { "1": "7", "5": "6" },
    "5": { "1": "9", "2": "8", "3": "7", "4": "6" },
    "6": { "3": "9", "5": "4" },
    "7": { "4": "1", "5": "3", "8": "9" },
    "8": { "5": "2", "7": "9" },
    "9": { "5": "1", "6": "3", "7": "8" }
};

function checkAuth(token) {
    for (i = 0; i < people.length; i++) {
        if (people["access_token"] == token) {
            return true;
        };
    };
    return false;
};

function findPlayer(usr) {
    for (i = 0; i < people.length; i++) {
        if (people[i]["username"] == usr) {
            return i;
        };
    };
    return 0;
};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

app.get('/people', function (req, res) {
    var online = { "online": [] };
    if (req.query["filter"] == "online") {
        for (i = 0; i < people.length; i++) {
            p = people[i];
            if (p["status"] != "offline") {
                online["online"].push(p["username"]);
            };
        };
        res.send(online);
    } else {
        res.send(people);
    };
});

app.post('/people', function (req, res) {
    for (i = 0; i < people.length; i++) {
        if (people[i]["username"] == req.body["username"]) {
            res.send({ "registered": "false" });
        };
    };
    if (validTokens.includes(req.body["access_token"])) {
        var newPerson = {
            "username": req.body["username"],
            "password": req.body["password"],
            "forename": req.body["forename"],
            "surname": req.body["surname"],
            "access_token": req.body["access_token"],
            "stats": { "wins": "0", "played": "0" },
            "status": "offline",
            "game": { "id": "", "symbol": "" },
            "timeout": 0
        };
        people.push(newPerson);
        res.send({ "registered": "true" });
    } else {
        res.sendStatus(403);
    };
});

app.get('/accesstoken', function (req, res) {
    const token = uuid().toString();
    validTokens.push(token);
    res.send({ "access_token": token })
})

app.get('/people/:username', function (req, res) {
    const username = req.params["username"];
    var user;

    for (i = 0; i < people.length; i++) {
        p = people[i];
        if (p["username"] == username) {
            user = p;
        };
    };

    if (!user) {
        res.sendStatus(404);
    } else {
        if (req.query["function"] == "login") {
            var token;
            if (user["password"] == req.query["password"]) {
                if (p["access_token"] == "") {
                    token = uuid().toString();
                    p["access_token"] = token;
                    validTokens.push(token);
                } else {
                    token = p["access_token"];
                }
                p["status"] = "standby";
                p["online"] = "true";
                res.send({ "access_token": token, "logon": "true" });
            } else {
                res.send({ "logon": "false" });
            };

        } else if (req.query["function"] == "stats") {
            res.send(user["stats"]);
        } else if (req.query["function"] == "status") {
            res.send({ "status": user["status"] });
            user["timeout"] = 0;
        } else if (req.query["function"] == "gameinfo") {
            res.send(user["game"]);
        };
    };
});

app.post('/people/:username', function (req, res) {
    const username = req.params["username"];
    var userindex;

    for (i = 0; i < people.length; i++) {
        p = people[i];
        if (p["username"] == username) {
            userindex = i;
        };
    };

    if (validTokens.includes(req.body["access_token"])) {
        people[userindex]["status"] = req.body["status"];
        if (req.body["status"] == "standby" && games[people[userindex]["game"]["id"]] != "") {
            delete games[people[userindex]["game"]["id"]];
            people[userindex]["game"] = { "id": "", "symbol": "" };
        };
        res.send({ "status": "updated" });
    } else {
        res.sendStatus(403);
    };
});

function matchmaker() {
    for (i = 0; i < people.length; i++) {
        var p = people[i];
        if (p["status"] == "searching" && !Object.keys(searching).includes(p["username"])) {
            searching[p["username"]] = i;
        } else if (p["status"] != "searching" && Object.keys(searching).includes(p["username"])) {
            delete searching[p["username"]];
        };
    };
    if (Object.keys(searching).length >= 2) {
        var gid = Math.random().toString();
        var symbols = ["O", "X"];
        newGame(gid);

        for (i = 0; i < 2; i++) {
            people[Object.values(searching)[i]]["game"]["id"] = gid;
            people[Object.values(searching)[i]]["game"]["symbol"] = symbols[i];
            people[Object.values(searching)[i]]["status"] = "gamefound";
            people[Object.values(searching)[i]]["stats"]["played"] = (parseInt(people[Object.values(searching)[i]]["stats"]["played"], 10) + 1).toString();
            games[gid]["players"][symbols[i]] = Object.keys(searching)[i];
        };
        delete searching[Object.keys(searching)[0]];
        delete searching[Object.keys(searching)[0]];

    };

    for (var key in games) {
        var p1 = games[key]["players"]["O"];
        var p2 = games[key]["players"]["X"];
        if (people[findPlayer(p1)]["status"] == "ready" && people[findPlayer(p2)]["status"] == "ready") {
            people[findPlayer(p1)]["status"] = "turn";
            people[findPlayer(p2)]["status"] = "wait";
        };
    };
};

function timeoutCheck() {
    for(i = 0; i < people.length; i++){
        people[i]["timeout"] += 3000;
        if(people[i]["timeout"] > 5000 && people[i]["status"] != "offline"){
            people[i]["status"] == "offline";
            const auth = people[i]["access_token"];
            validTokens.splice(validTokens.indexOf(auth),1);
            people[i]["access_token"] = "";
        };
    };
};

setInterval(matchmaker, 250);
setInterval(timeoutCheck, 3000);

function newGame(gid) {
    games[gid] = {
        "players": { "O": "", "X": "" },
        "board": {
            "1": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "2": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "3": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "4": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "5": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "6": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "7": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "8": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "9": { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "win": "" },
            "win": "",
            "playableS": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
            "lastmove": { "symbol": "", "move": "", "win": "" }
        }
    };
}

app.get('/games/:gid', function (req, res) {
    const gid = req.params["gid"];
    const f = req.query["function"];

    if (f == "load") {
        res.send(games[gid]["players"]);
    } else if (f == "update") {
        res.send(games[gid]["board"]["lastmove"]);
    };
});

app.post('/games/:gid', function (req, res) {
    const game = games[req.params["gid"]];
    const f = req.body["function"];
    const s = req.body["s"];
    const p = req.body["p"];
    const symbol = req.body["symbol"]

    if (validTokens.includes(req.body["access_token"])) {
        if (game["board"]["playableS"].includes(req.body["s"])) {
            playable = "true";

            updateBoard(req.params["gid"], s, p, symbol);

            if (game["board"]["win"] == "") {
                var p1 = findPlayer(game["players"]["O"]);
                var p2 = findPlayer(game["players"]["X"]);
                if (symbol == "O") {
                    people[p1]["status"] = 'wait';
                    people[p2]["status"] = 'turn';
                } else if (symbol == "X") {
                    people[p2]["status"] = 'wait';
                    people[p1]["status"] = 'turn';
                };
            };
        } else {
            playable = "false";
        };
        res.send({ "playable": playable });
    } else {
        res.sendStatus(403);
    };
});

function updateBoard(gid, s, p, sym) {
    const game = games[gid];
    game["board"]["playableS"] = [];
    game["board"][s][p] = sym;

    for (k in check[p]) {
        l = check[p][k];
        if (game["board"][s][k] == sym && game["board"][s][l] == sym) {
            game["board"][s]["win"] = sym;
        };
    };

    if (game["board"][p]["win"] != "") {
        for (i = 1; i < 10; i++) {
            if (game["board"][i.toString()]["win"] == "") {
                game["board"]["playableS"].push(i.toString());
            }
        }
    } else {
        game["board"]["playableS"].push(p);
    }

    game["board"]["lastmove"]["symbol"] = sym;
    game["board"]["lastmove"]["move"] = s + p;

    if (game["board"][s]["win"] == sym) {
        for (var k in check[s]) {
            l = check[s][k];
            if (game["board"][k]["win"] == sym && game["board"][l]["win"]) {
                game["board"]["win"] = sym;
            };
        };
    };

    var p1 = findPlayer(game["players"]["O"]);
    var p2 = findPlayer(game["players"]["X"]);
    if (game["board"]["win"] == "O") {
        people[p1]["stats"]["wins"] = (parseInt(people[p1]["stats"]["wins"], 10) + 1).toString();
        people[p1]["status"] = "win";
        people[p2]["status"] = "loss";
        delete game;
    } else if (game["board"]["win"] == "X") {
        people[p2]["stats"]["wins"] = (parseInt(people[p2]["stats"]["wins"], 10) + 1).toString();
        people[p1]["status"] = "loss";
        people[p2]["status"] = "win";
        delete game;
    };
}


app.get('/chat', function (req, res) {
    chat = '';
    for (i = 0; i < 10; i++) {
        if (messagelist[i]) {
            chat += '<div class=\'chat' + messagelist[i][2] + '\' style=\'background-color=#808080\'><small>' + messagelist[i][0] + '</small><div>' + messagelist[i][1] + '</div></div>';
        };
    };
    res.send(chat);
});

app.post('/chat', function (req, res) {
    var col;
    if (messagelist[messagelist.length - 1][2] == 0) {
        col = 1;
    } else {
        col = 0;
    }

    if (validTokens.includes(req.body["access_token"])) {
        messagelist.push([req.body["username"], req.body["message"], col]);
        if (messagelist.length > 30) {
            messagelist.shift();
        }
        res.send({ "posted": "true" });
    } else {
        res.sendStatus(403);
    };
});

app.post('/invite', function (req, res) {
    if (req.body["cancel"] == "true") {
        for (var key in invites) {
            if (invites[key].includes(req.body["inviter"])) {
                invites[key].splice(invites[key].indexOf(req.body["inviter"]), 1);
            };
        };
    };
    res.send({});
});

app.get('/invite/:invited', function (req, res) {
    const invited = req.params["invited"];
    if (!invites[invited]) {
        invites[invited] = [];
    };
    res.send(invites[invited]);
});

app.post('/invite/:invited', function (req, res) {
    const invited = req.params["invited"];

    if (validTokens.includes(req.body["access_token"])) {
        if (req.body["function"] == "invite") {
            const inviter = req.body["inviter"];
            var success = "true";

            for (var key in invites) {
                if (invites[key].includes(inviter)) {
                    success = "false";
                };
            };
            if (success == "true") {
                if (invites[invited]) {
                    invites[invited].push(inviter);
                } else {
                    invites[invited] = [inviter];
                };
            };

            people[findPlayer(inviter)]["status"] = "inviter";

            res.send({ "invited": success });

        } else {
            if (req.body["function"] == "accept") {
                var inviter = invites[invited][0];
                var players = [findPlayer(inviter), findPlayer(invited)];
                var playernames = [inviter, invited]
                var gid = Math.random().toString();
                var symbols = ["O", "X"];
                newGame(gid);

                for (i = 0; i < 2; i++) {
                    people[players[i]]["game"]["id"] = gid;
                    people[players[i]]["game"]["symbol"] = symbols[i];
                    people[players[i]]["status"] = "gamefound";
                    people[players[i]]["stats"]["played"] = (parseInt(people[players[i]]["stats"]["played"], 10) + 1).toString();
                    games[gid]["players"][symbols[i]] = playernames[i];
                };
            } else {
                people[findPlayer(invites[invited][0])]["status"] = "standby";
            };
            invites[invited] = [];
            res.send({});
        };
    } else {
        res.sendStatus(403);
    };
});

app.get('/invite/:invited', function (req, res) {
    const invited = req.params["invited"];
    res.send(invites[invited]);
});

app.post('/dc', function (req, res) {
    if (online[req.body.pid]) {
        delete online[req.body.pid];
    };
});

serv.listen(8080);
console.log('Server started.');