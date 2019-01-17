var express = require('express');
var app = express();
var serv = require('http').Server(app); 

const uuid = require('uuid/v4');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

var users = {Andre: {wins: 50, played: 55}}; //{name: {wins: , played: }}
var online = {}; // {id: {name: , status: , gid: , afk:? , timeout:? }
var searching = [];
var games = {};
var invites = {};

var messagelist = [['', '', 0]];

const check = {
    1: {2: 3, 4: 6, 5: 9},
    2: {1: 3, 5: 8},
    3: {2: 1, 5: 7, 6: 9},
    4: {1: 7, 5: 6},
    5: {1: 9, 2: 8, 3: 7, 4: 6},
    6: {3: 9, 5: 4},
    7: {4: 1, 5: 3, 8: 9},
    8: {5: 2, 7: 9},
    9: {5: 1, 6: 3, 7: 8}
};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

app.post('/logon', function(req, res){
    console.log('connection');
    const n = req.body.n;
    var taken = false;
    for(var key in online){
        if(online[key].name == n){
            taken = true;
        };
    };
    if(taken){
        res.send('taken');
    } else {
        if(!(n in users)){
            users[n] = {wins: 0, played: 0};
        };

        const pid = uuid();
        online[pid] = {name: n, status: 'standby', gid: ''};
        res.send(pid);
    };
});
 
app.get('/updatestats', function(req, res){
    const pid = req.query.pid;
    const usr = online[pid].name;
    res.send(users[usr]);
});

app.get('/status', function(req, res){
    if(online[req.query.pid]){
        res.send(online[req.query.pid].status);
    } else {
        res.send('nologon');
    };
})

app.post('/search', function(req, res){
    const pid = req.body.pid;
    searching.push(pid);
    online[pid].status = 'searching';
    console.log(searching);

    if(searching.length == 2){
        const gameid = Math.random();
        newGame(gameid);

        for(i = 0; i < 2; i++){
            online[searching[i]].status = 'gamefound';
            online[searching[i]].gid = gameid;
            games[gameid][i+1] = searching[i];
        }
        

        searching = [];
    };
    res.send(true);
});

app.post('/ready', function(req, res){
    const pid = req.body.pid;
    const gid = online[pid].gid;    
    online[pid].status = 'ready';

    const p1 = online[games[gid][1]].name;
    const p2 = online[games[gid][2]].name;
    var playerStats = {
        1: {name: p1, wins: users[p1].wins, played: users[p1].played},
        2: {name: p2, wins: users[p2].wins, played: users[p2].played}
    };

    users[online[pid].name].played++;
    console.log(pid + online[pid].status);

    if(online[games[gid][1]].status == 'ready' && online[games[gid][2]].status =='ready'){
        online[games[gid][1]].status = 'turn';
        online[games[gid][2]].status = 'wait';
        console.log(pid + online[pid].status);
    };

    res.send([games[gid][1], playerStats]);
});

app.post('/move', function(req, res){
    const pid = req.body.pid;
    const s = req.body.s;
    const p = req.body.p;
    const gid = online[pid].gid;
    var game = games[gid];
    var sym = '';
    var playable;
    
    if(game[1] == pid){
        sym = 'O';
    } else if(game[2] == pid){
        sym = 'X';
    }

    if(game.board.playableS.includes(s.toString())){
        playable = true;

        updateBoard(gid, s, p, sym);

        if(game.board.win == 'O'){
            online[game[1]].status = 'win';
            online[game[2]].status = 'loss';
        } else if (game.board.win == 'X'){
            online[game[1]].status = 'win';
            online[game[2]].status = 'loss';
        } else {
            if(game[1] == pid){
                online[game[1]].status = 'wait';
                online[game[2]].status = 'turn';
            } else if(game[2] == pid){
                online[game[1]].status = 'turn';
                online[game[2]].status = 'wait';
            };
        };
    } else {
            playable = false;
    };
    res.send(playable);
});

app.get('/updateBoard', function(req, res){
    const pid = req.query.pid;
    const gid = online[pid].gid;
    var game = games[gid];
    res.send(game.board.lastmove);
})

function newGame(gid){
    games[gid] = {1: '', 2: '', board:{
        1: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        2: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        3: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        4: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        5: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        6: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        7: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        8: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        9: {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', win: ''},
        win: '',
        playableS: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        lastmove: ''
        }
    };
}

function updateBoard(gid, s, p, sym){
    const game = games[gid];
    game.board.playableS = [];
    game.board[s][p] = sym

    for(k in check[p]){
        l = check[p][k];
        if(game.board[s][k] == sym && game.board[s][l] == sym){
            game.board[s].win = sym
        }
    };

    if(game.board[p].win != ''){
        for(i = 1; i < 10; i++){
            if(game.board[i].win == ''){
                game.board.playableS.push(i.toString());
            }
        }
    } else {
        game.board.playableS.push(p);
    }

    console.log(game.board.playableS);
    game.board.lastmove = '' + s + p;

    //check win conditions on game.board.s
    //if win conditions met, check win conditions on game.board

    if(game.board[s].win == sym){
        for(var k in check[s]){
            l = check[s][k];
            if(game.board[k].win == sym && game.board[l].win == sym){
                game.board.win = sym;
            }
        }
    };

    if(game.board.win == 'O'){
        users[online[game[1]].name].wins++;
        online[game[1]].status = 'win';
        online[game[2]].status = 'loss';
        delete game;
    } else if (game.board.win == 'X'){
        users[online[game[2]].name].wins++;
        online[game[1]].status = 'win';
        online[game[2]].status = 'loss';
        delete game;
    };
}

app.get('/world', function(req, res){
    chat = '';
    for(i = 0; i < 10; i++){
        if(messagelist[i]){
            chat += '<div class=\'chat' + messagelist[i][2] + '\' style=\'background-color=#808080\'><small>' + messagelist[i][0] + '</small><div>' + messagelist[i][1] + '</div></div>';
        };
    };
    res.send(chat);
});

app.post('/world', function(req, res){
    var col;
    if(messagelist[messagelist.length - 1][2] == 0){
        col = 1;
    } else {
        col = 0;
    }
    messagelist.push([online[req.body.pid].name, req.body.msg, col]);
    if(messagelist.length > 30){
        messagelist.shift();
    }
    res.send(true);
});

app.get('/playerlist', function(req, res){
    var resp = {};
    for(var key in online){
        if(key != req.query.pid){
            resp[key] = online[key].name;
        }
    }
    res.send(resp);
});

app.get('/stats', function(req, res){
    const name = req.query.n;
    res.send(users[name]);
});

app.post('/invite', function(req, res){
    const inviter = req.body.pid;
    var invited;
    var found = false;
    for(var key in online){
        if(online[key].name == req.body.n){
            invited = key;
            found = true;
        };
    };
    if(found){
        online[inviter].status = 'searching';
        online[invited].status = 'invited';
        invites[invited] = inviter;
    }
    res.send(found);
});

app.get('/invite', function(req, res){
    const invited = req.query.pid;
    const inviter = invites[invited];
    res.send(online[inviter].name);
});

app.post('/accept', function(req, res){
    const invited = req.body.pid;
    const inviter = invites[invited];
    if(req.body.accept == 1){
        delete invites[invited];

        const gid = Math.random();
        newGame(gid);

        games[gid][1] = inviter;
        games[gid][2] = invited;
        console.log(games[gid], games[gid][1], games[gid][2]);

        online[inviter].status = 'gamefound';
        online[inviter].gid = gid;
        online[invited].status = 'gamefound';
        online[invited].gid = gid;
    } else {
        online[inviter].status = 'standby';
    };
    res.send(req.body.accept);
});

app.post('/reset', function(req, res){
    const pid = req.body.pid;
    online[pid].status = 'standby';
    online[pid].gid = '';
    res.send('done');
});

app.post('/dc', function(req, res){
    if(online[req.body.pid]){
        delete online[req.body.pid];
    };
});

serv.listen(8080);
console.log('Server started.');