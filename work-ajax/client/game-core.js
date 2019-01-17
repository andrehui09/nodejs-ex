var username;
var yourTurn;
var yourSym;
var oppSym;
var updated;
var intervalSet = false;
var sRatio;
var checked = false;
var standby = true;
var access_token;
var gameid;
var started = false;

const tileRange = {
    "1": {"min": "8", "max": "58"},
    "2": {"min": "63", "max": "113"},
    "3": {"min": "118", "max": "168"},
    "4": {"min": "196", "max": "246"},
    "5": {"min": "251", "max": "301"},
    "6": {"min": "306", "max": "356"},
    "7": {"min": "384", "max": "434"},
    "8": {"min": "439", "max": "489"},
    "9": {"min": "494", "max": "544"}
}; // min < pixel <= max

const tileToSP = {
    "1": {"1": "11", "2": "12", "3": "13", "4": "21", "5": "22", "6": "23", "7": "31", "8": "32", "9": "33"},
    "2": {"1": "14", "2": "15", "3": "16", "4": "24", "5": "25", "6": "26", "7": "34", "8": "35", "9": "36"},
    "3": {"1": "17", "2": "18", "3": "19", "4": "27", "5": "28", "6": "29", "7": "37", "8": "38", "9": "39"},
    "4": {"1": "41", "2": "42", "3": "43", "4": "51", "5": "52", "6": "53", "7": "61", "8": "62", "9": "63"},
    "5": {"1": "44", "2": "45", "3": "46", "4": "54", "5": "55", "6": "56", "7": "64", "8": "65", "9": "66"},
    "6": {"1": "47", "2": "48", "3": "49", "4": "57", "5": "58", "6": "59", "7": "67", "8": "68", "9": "69"},
    "7": {"1": "71", "2": "72", "3": "73", "4": "81", "5": "82", "6": "83", "7": "91", "8": "92", "9": "93"},
    "8": {"1": "74", "2": "75", "3": "76", "4": "84", "5": "85", "6": "86", "7": "94", "8": "95", "9": "96"},
    "9": {"1": "77", "2": "78", "3": "79", "4": "87", "5": "88", "6": "89", "7": "97", "8": "98", "9": "99"}
};

function logon(){
    username = $("#username").val();
    const password = $("#password").val();
    if(username && password){
        $.get('http://127.0.0.1:8080/people/' + username, {"username":username, "password":password, "function":"login"}, function(data){
            if(data["logon"] == "true"){
                access_token = data["access_token"];

                $('#nameDisplay').html('<h2>' + username + '</h2>');
                var stats = updateStats(username, 1);
                closeNav('overlay');
                refreshPlayers();

                if (!intervalSet) {
                    window.setInterval(status, 100);
                    window.setInterval(updateChat, 100);
                    intervalSet = true;
                };

            } else {
                $('#logonNote').html('Incorrect username/password, please try again.')
            };
        });
    } else {
        $('#logonNote').html('Make sure all fields are filled.')
    };
    return false;
};

function register(){
    const usernameR = $("#usernameR").val();
    const password = $("#passwordR").val();
    const forename = $("#forenameR").val();
    const surname = $("#surnameR").val();
    if(usernameR && password && forename && surname){
        $.get('http://127.0.0.1:8080/accesstoken', {}, function(data){
            access_token = data["access_token"];
            $.post('http://127.0.0.1:8080/people', {"username":usernameR, "password":password, "forename":forename, "surname":surname, "access_token":access_token}, function(dat){
                if(dat && dat["registered"] == "false"){
                    $('#registrationNote').html('<div>Username Taken.</div>');
                } else {
                    $('#logonNote').html('Registration successful! You can now log in.');
                    showLForm();
                };
            });
        });
        
    } else {
        $('#registrationNote').html('<div>Make sure all fields are filled.</div>');
    };
    return false
};

function startSearch() {
    console.log(access_token);
    $.post('http://127.0.0.1:8080/people/' + username, {"status":"searching", "access_token":access_token}, function (data) {
        if (data) {
            $('#search').hide();
            $('#searching').show();
            standby = false;
        } else {
            return;
        }
    });
}

function getGame(){
    $.get('http://127.0.0.1:8080/people/' + username, {"function":"gameinfo"}, function(data){
        gameid = data["id"];
        yourSym = data["symbol"];
    });
};

function ready() {
    $.post('http://127.0.0.1:8080/people/' + username, {"status":"ready", "access_token":access_token}, function (data) {
        if (yourSym == "O"){
            oppSym = 'X';
        } else {
            oppSym = 'O';
        };
    });
};

function startGame(){
    $.get('http://127.0.0.1:8080/games/' + gameid, {"function":"load"}, function(data){
        var stats = updateStats(data[oppSym], 2);

        $('#searching').hide();
        $('#ready').hide();
        setCanvas('/client/background.png');
        setRatio();
    });
};

function move(b) {
    if (yourTurn) {
        sector = b.toString()[0];
        pos = b.toString()[1];

        $.post('http://127.0.0.1:8080/games/' + gameid, { "function":"move", "s":sector, "p":pos, "symbol":yourSym, "access_token":access_token }, function (data) {
            if (data["playable"] == "true") {
                $('#' + b).html('<span>' + yourSym + '</span>');
                drawMove(yourSym, b);
            };
        });
    };
};

function updateBoard() {
    $.get('http://127.0.0.1:8080/games/' + gameid, { "function":"update" }, function (data) {
        if(data["symbol"] == "X" || data["symbol"] == "O"){
            drawMove(data["symbol"], data["move"]);
        };
    });
};

function getMousePos(c, evt){
    var rect = c.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
};

function handleClick(e){
    var pos = getMousePos(canvas, e);
    posx = pos.x / sRatio;
    posy = pos.y / sRatio;
    var x;
    var y;

    c = document.getElementById('canvas');

    for(i = 1; i < 10; i++){
        if(posx >= tileRange[i].min && posx < tileRange[i].max){
            x = i;
        };
        if(posy >= tileRange[i].min && posy < tileRange[i].max){
            y = i;
        };
    };

    move(tileToSP[y][x]);
};

function drawMove(sym, pos){
    var x;
    var y;

    for(i = 1; i < 10; i++){
        for(j = 1; j < 10; j++){
            if(tileToSP[i.toString()][j.toString()] == pos){
                x = tileRange[j.toString()]["min"];
                y = tileRange[i.toString()]["min"];
            };
        };
    };

    c = document.getElementById('canvas');
    ctx = c.getContext('2d');
    var imgpath = '/client/small';

    if(sym == 'X'){
        imgpath += 'x';
    } else if(sym == 'O'){
        imgpath += 'o';
    }

    imgpath += '.png';

    img = new Image();
    img.src = imgpath;
    img.onload = function(){
        ctx.drawImage(img, parseInt(x,10), parseInt(y,10));
    };

};

function home(){
    $.post('http://127.0.0.1:8080/people/' + username, {"status":"standby"}, function(){
        $('#player2').html('');
        $('#search').show();
        $('#result').html('');
        $('#invited').hide();
        updateStats();
        setCanvas('/client/backgroundopac.png');
        $('#home').hide();
    })
}

function status() {
    $.get('http://127.0.0.1:8080/people/' + username, { "function":"status" }, function (data) {
        if (data["status"] == 'standby') {
            if(!standby){
                home();
                standby = true;
            };

        } else if (data["status"] == 'searching') {
            console.log(data);

        } else if (data["status"] == 'gamefound') {
            $('#searching').hide();
            $('#ready').show();
            $('#invited').hide();
            getGame();

        } else if (data["status"] == 'ready') {
            checked = false;

        } else if (data["status"] == 'turn') {
            if(!started){
                startGame();
                started = true;
            };
            yourTurn = true;
            if (!updated) {
                updateBoard();
                updated = true;
            };

        } else if (data["status"] == 'wait') {
            if(!started){
                startGame();
                started = true;
            };
            yourTurn = false;
            updated = false;

        } else if (data["status"] == 'win') {
            $('#result').html('Winner!');
            $('#home').show();
            started = false;

        } else if (data["status"] == 'loss') {
            updateBoard();
            $('#result').html('Loser.');
            $('#home').show();
            started = false;

        } else if(data["status"] == 'invited'){
            console.log(data);
            if(!checked){
                checkInvite();
                checked = true;
            };

        } else if (data["status"] == 'nologon') {
            console.log(data);
            openNav('overlay2');

        };
        console.log(data);
    });
};

$('#logon').on('submit', logon);
$('#register').on('submit', register);
$('#msgbox').on('submit', sendMsg);