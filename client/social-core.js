
function getOnlinePlayers(){
    $.get('http://127.0.0.1:8080/people', {"filter":"online"}, function(data){
        $('#onlineplayers').html("");
        for(var p in data){
            $('#onlineplayers').append('<div><button class="btn btn-default btn-small" onclick="loadPlayer(\'' + data["username"] + '\')">' + data["username"] + '</button>');
        };
    });
};

function sendMsg() {
    const message = $('#msg').val();
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

$('#msgbox').on('submit', sendMsg);