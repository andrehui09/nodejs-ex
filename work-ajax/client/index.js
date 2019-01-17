var playerid;
var yourTurn;
var yourSym;
var oppSym;
var updated;
var name;
var intervalSet = false;
var sRatio;
var chatHist = '';
var checked = false;
var standby = true;

function openNav(eid){
    document.getElementById(eid).style.width='100%';
}
function closeNav(eid){
    document.getElementById(eid).style.width='0%';
};
function displayPlayer(){
    document.getElementById('playeroverlay').style.width='100%';
}
function closePlayer(){
    document.getElementById('playeroverlay').style.width='0%';
}

function setName() {
    name = $('#name').val();
    if (name) {
        $.post('http://127.0.0.1:8080/logon', { n: name }, function (data) {
            console.log(data);
            if (data != 'taken') {
                playerid = data;
                console.log(playerid);
                $('#nameDisplay').html('<h2>' + name + '</h2>');
                updateStats();
                closeNav('overlay');
                refreshPlayers();
            } else {
                $('#logonErr').html('<div>Username taken, please try another one.</div>')
            }
            if (!intervalSet && data != 'taken') {
                window.setInterval(status, 100);
                window.setInterval(updateChat, 100);
                intervalSet = true;
            };
        });
    } else {
        $('#logonErr').html('<div>Please enter a name.</div>')
    };
    return false;
}

function updateStats() {
    $.get('http://127.0.0.1:8080/updatestats', { pid: playerid }, function (data) {
        $('#stats').html('<div>Wins: ' + data.wins + '</div><div>Games Played: ' + data.played);
    });
}

function startSearch() {
    console.log('searching');
    $.post('http://127.0.0.1:8080/search', { pid: playerid }, function (data) {
        if (data) {
            $('#search').hide();
            $('#searching').show();
            standby = false;
        } else {
            return;
        }
    });
}

function ready() {
    $.post('http://127.0.0.1:8080/ready', { pid: playerid }, function (data) {
        if (data[0] == playerid) {
            yourSym = 'O';
            oppSym = 'X';
        } else {
            yourSym = 'X';
            oppSym = 'O';
        };
        $('#searching').hide();
        $('#ready').hide();
        setCanvas('/client/background.png');
        setRatio();

        const pStats = data[1]; 
        var p1 = '<div><h2>' + pStats[1].name + '</h2></div><div>Wins: ' + pStats[1].wins + '</div><div>Played: ' + pStats[1].played + '</div>';
        var p2 = '<div><h2>' + pStats[2].name + '</h2></div><div>Wins: ' + pStats[2].wins + '</div><div>Played: ' + pStats[2].played + '</div>';;
        $('#player2').html(p2);
        if(yourSym == 'O'){
            $('#player2').html(p2);
        } else {
            $('#player2').html(p1);
        };
    });
}

function move(b) {
    if (yourTurn) {
        sector = parseInt(b.toString()[0], 10);
        pos = parseInt(b.toString()[1], 10);
        console.log('ready' + sector + pos);

        $.post('http://127.0.0.1:8080/move', { pid: playerid, s: sector, p: pos }, function (data) {
            console.log(data);
            if (data) {
                $('#' + b).html('<span>' + yourSym + '</span>');
                drawMove(yourSym, b);
            };
        });
    };
};

function updateBoard() {
    $.get('http://127.0.0.1:8080/updateBoard', { pid: playerid }, function (data) {
        drawMove(oppSym, parseInt(data, 10));
    })
}

function status() {
    $.get('http://127.0.0.1:8080/status', { pid: playerid }, function (data) {
        if (data == 'standby') {
            if(!standby){
                home();
                standby = true;
            };
        } else if (data == 'searching') {
            console.log(data);
        } else if (data == 'gamefound') {
            $('#searching').hide();
            $('#ready').show();
            $('#invited').hide();
        } else if (data == 'ready') {
            checked = false;
        } else if (data == 'turn') {
            yourTurn = true;
            if (!updated) {
                updateBoard();
                updated = true;
            };
        } else if (data == 'wait') {
            yourTurn = false;
            updated = false;
        } else if (data == 'win') {
            $('#result').html('Winner!');
            $('#home').show();
        } else if (data == 'loss') {
            updateBoard();
            $('#result').html('Loser.');
            $('#home').show();
        } else if(data == 'invited'){
            console.log(data);
            if(!checked){
                checkInvite();
                checked = true;
            };
        } else if (data == 'nologon') {
            //setName(); or ask for refresh
            console.log(data);
            openNav('overlay2');
        };
        //console.log(data);
    });
};

function home(){
    $.post('http://127.0.0.1:8080/reset', {pid: playerid}, function(){
        $('#player2').html('');
        $('#search').show();
        $('#result').html('');
        $('#invited').hide();
        updateStats();
        setCanvas('/client/backgroundopac.png');
        $('#home').hide();
    })
}




function updateChat() {
    //console.log('updatingchat');
    $.get('http://127.0.0.1:8080/world', { pid: playerid }, function (data) {
        //recieve list size 30?
        if(data != chatHist){
            $('#worldchat').html(data);
            $('#worldchat').scrollTop($('#worldchat')[0].scrollHeight);
            chatHist = data;
        };
    });
};

function sendMsg() {
    message = $('#msg').val();
    if (name) {
        $.post('http://127.0.0.1:8080/world', { msg: message, pid: playerid }, function (data) { });
    }
    document.getElementById('msgbox').reset();
    return false;
}

function refreshPlayers() {
    $.get('http://127.0.0.1:8080/playerlist', {pid: playerid}, function(data){
        $('#onlineplayers').html('');
        for(var key in data){
            var dat = {};
            dat[key] = data[key];
            $('#onlineplayers').append('<div><button class="btn btn-default btn-small" onclick="loadPlayer(\'' + data[key] + '\')">' + data[key] + '</button>');
            console.log(key, data[key], dat);
        };
    });
};

function loadPlayer(dat){
    const query = {n: dat};
    console.log(query);
    $.get('http://127.0.0.1:8080/stats', {n: dat}, function(data){
        $('#pname').html(dat);
        $('#pwins').html('Wins: ' + data.wins);
        $('#pplayed').html('Played: ' + data.played);
        $('#invite').html('<button class="btn btn-default btn-md" onclick="invite(\'' + dat + '\')">Invite</button>');
        displayPlayer();
    });
};

function invite(dat){
    console.log(dat);
    $.post('http://127.0.0.1:8080/invite', {pid: playerid, n: dat}, function(data){
        if(data){
            $('#invitee').html(dat);
            $('#search').hide();
            $('#invited').show();
            standby = false;
        } else {
            alert('Invite not successful');
        }
    });
    //check if invitee in game
    //make new object invites {inviter id: invitee id}
    //set inviter status to inviter
    //set invitee status to invited
    //invitee on status change gets inviter data, creates pop up of
    //inviter data with accept/decline prompt
    //if accept, both statuses set to gamefound, and game created
};

function checkInvite(){
    $.get('http://127.0.0.1:8080/invite', {pid: playerid}, function(data){
        const opp = data.n;
        $('#inviter').html(opp);
        openNav('inviteoverlay');
    });
};

function accept(a){
    $.post('http://127.0.0.1:8080/accept', {pid: playerid, accept: a}, function(data){
        closeNav('inviteoverlay');
        if(data == 1){
            $('#search').hide();
        };
    });
};



function setRatio(){
    c = document.getElementById('canvas');
    sRatio = c.scrollWidth/552;
};

function setCanvas(imgsrc){
    c = document.getElementById('canvas');
    c.width = 552;
    c.height = 552;
    ctx = c.getContext('2d');
    ctx.clearRect(0,0,552,552);
    img = new Image();
    img.src = imgsrc;
    img.onload = function(){
        ctx.drawImage(img, 0, 0);
    };
}

const tileRange = {
    1: {min: 8, max: 58},
    2: {min: 63, max: 113},
    3: {min: 118, max: 168},
    4: {min: 196, max: 246},
    5: {min: 251, max: 301},
    6: {min: 306, max: 356},
    7: {min: 384, max: 434},
    8: {min: 439, max: 489},
    9: {min: 494, max: 544}
}; // min < pixel <= max

const tileToSP = {
    1: {1: 11, 2: 12, 3: 13, 4: 21, 5: 22, 6: 23, 7: 31, 8: 32, 9: 33},
    2: {1: 14, 2: 15, 3: 16, 4: 24, 5: 25, 6: 26, 7: 34, 8: 35, 9: 36},
    3: {1: 17, 2: 18, 3: 19, 4: 27, 5: 28, 6: 29, 7: 37, 8: 38, 9: 39},
    4: {1: 41, 2: 42, 3: 43, 4: 51, 5: 52, 6: 53, 7: 61, 8: 62, 9: 63},
    5: {1: 44, 2: 45, 3: 46, 4: 54, 5: 55, 6: 56, 7: 64, 8: 65, 9: 66},
    6: {1: 47, 2: 48, 3: 49, 4: 57, 5: 58, 6: 59, 7: 67, 8: 68, 9: 69},
    7: {1: 71, 2: 72, 3: 73, 4: 81, 5: 82, 6: 83, 7: 91, 8: 92, 9: 93},
    8: {1: 74, 2: 75, 3: 76, 4: 84, 5: 85, 6: 86, 7: 94, 8: 95, 9: 96},
    9: {1: 77, 2: 78, 3: 79, 4: 87, 5: 88, 6: 89, 7: 97, 8: 98, 9: 99}
}

function getMousePos(c, evt){
    var rect = c.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
};

function handleClick(e){
    var pos = getMousePos(canvas, e);
    posx = pos.x / sRatio;
    posy = pos.y / sRatio;
    console.log(posx + ' ' + posy);
    var x;
    var y;

    c = document.getElementById('canvas');
    console.log(c.width);

    console.log(posx + ' ' + posy);

    for(i = 1; i < 10; i++){
        if(posx >= tileRange[i].min && posx < tileRange[i].max){
            x = i;
        };
        if(posy >= tileRange[i].min && posy < tileRange[i].max){
            y = i;
        };
    };

    console.log(tileToSP[y][x]);
    move(tileToSP[y][x]);

};

function drawMove(sym, pos){
    var x;
    var y;
    var posx;
    var posy;

    for(i = 1; i < 10; i++){
        for(j = 1; j < 10; j++){
            if(tileToSP[i][j] == pos){
                x = tileRange[j].min;
                y = tileRange[i].min;
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
        ctx.drawImage(img, x, y);
    };

};

window.onload = function(){
    setCanvas('/client/backgroundopac.png');
    c = document.getElementById('canvas');
    c.addEventListener('click', handleClick);
    $('#searching').hide();
    $('#ready').hide();
    $('#home').hide();
    $('#invited').hide();
};

window.onbeforeunload = function(){
    $.post('http://127.0.0.1:8080/dc', {pid: playerid}, function(){

    });
}

$(window).on('resize', setRatio);
$('#logon').on('submit', setName);
$('#msgbox').on('submit', sendMsg);
$(document).on('click', function(evt){
    if(!$(evt.target).is('#invite')){
        closePlayer();
    };
});