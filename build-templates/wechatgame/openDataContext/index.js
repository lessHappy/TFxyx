var sharedCanvas = wx.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');

var CANVAS_W = sharedCanvas.width;
var CANVAS_H = sharedCanvas.height;

var ITEM_H = 100;
var PADDING = 20;
var AVATAR_SIZE = 60;

var FONT_SIZE_NAME = 28;
var FONT_SIZE_SCORE = 24;
var FONT_SIZE_TITLE = 36;

var dataList = [];
var rankType = 'friend';
var isShowing = false;

wx.onMessage(function (data) {
    if (data.type === 'showRank') {
        rankType = data.rankType || 'friend';
        isShowing = true;
        loadFriendData();
    } else if (data.type === 'hideRank') {
        isShowing = false;
        clearCanvas();
    } else if (data.type === 'refresh') {
        if (isShowing) {
            loadFriendData();
        }
    }
});

function clearCanvas() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
}

function loadFriendData() {
    if (rankType === 'group') {
        wx.getGroupCloudStorage({
            shareTicket: '',
            keyList: ['score', 'kill', 'time', 'gold', 'level', 'update_time'],
            success: function (res) {
                processData(res.data);
            },
            fail: function () {
                drawEmpty();
            }
        });
    } else {
        wx.getFriendCloudStorage({
            keyList: ['score', 'kill', 'time', 'gold', 'level', 'update_time'],
            success: function (res) {
                processData(res.data);
            },
            fail: function () {
                drawEmpty();
            }
        });
    }
}

function processData(data) {
    dataList = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var kvData = item.KVDataList || [];
        var score = 0;
        var kill = 0;
        var time = 0;
        var gold = 0;
        var level = 0;

        for (var j = 0; j < kvData.length; j++) {
            var kv = kvData[j];
            if (kv.key === 'score') score = parseInt(kv.value) || 0;
            if (kv.key === 'kill') kill = parseInt(kv.value) || 0;
            if (kv.key === 'time') time = parseInt(kv.value) || 0;
            if (kv.key === 'gold') gold = parseInt(kv.value) || 0;
            if (kv.key === 'level') level = parseInt(kv.value) || 0;
        }

        dataList.push({
            avatarUrl: item.avatarUrl,
            nickname: item.nickname,
            score: score,
            kill: kill,
            time: time,
            gold: gold,
            level: level
        });
    }

    dataList.sort(function (a, b) {
        return b.score - a.score;
    });

    drawRankList();
}

function drawEmpty() {
    clearCanvas();
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT_SIZE_TITLE + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无好友数据', CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = 'start';
}

function drawRankList() {
    clearCanvas();

    if (dataList.length === 0) {
        drawEmpty();
        return;
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold ' + FONT_SIZE_TITLE + 'px sans-serif';
    ctx.textAlign = 'center';
    var title = rankType === 'group' ? '群排行榜' : '好友排行榜';
    ctx.fillText(title, CANVAS_W / 2, 60);
    ctx.textAlign = 'start';

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, 80);
    ctx.lineTo(CANVAS_W - PADDING, 80);
    ctx.stroke();

    var startY = 90;
    for (var i = 0; i < dataList.length; i++) {
        var item = dataList[i];
        var y = startY + i * ITEM_H;

        if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
        }
        ctx.fillRect(0, y, CANVAS_W, ITEM_H);

        var rankColor = '#ffffff';
        if (i === 0) rankColor = '#ffcc00';
        else if (i === 1) rankColor = '#c0c0c0';
        else if (i === 2) rankColor = '#cd7f32';

        ctx.fillStyle = rankColor;
        ctx.font = 'bold ' + FONT_SIZE_NAME + 'px sans-serif';
        ctx.fillText((i + 1) + '.', PADDING, y + ITEM_H / 2 + 10);

        var avatarX = PADDING + 50;
        var avatarY = y + (ITEM_H - AVATAR_SIZE) / 2;

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        if (item.avatarUrl) {
            var img = wx.createImage();
            img.src = item.avatarUrl;
            img.onload = function () {
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
                ctx.restore();
            };
        }

        var nameX = avatarX + AVATAR_SIZE + 16;
        ctx.fillStyle = '#ffffff';
        ctx.font = FONT_SIZE_NAME + 'px sans-serif';
        ctx.fillText(item.nickname || '未知玩家', nameX, y + 36);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = FONT_SIZE_SCORE + 'px sans-serif';
        ctx.fillText('击杀:' + item.kill + '  生存:' + formatTime(item.time) + '  金币:' + item.gold, nameX, y + 68);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold ' + FONT_SIZE_SCORE + 'px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item.score + '分', CANVAS_W - PADDING, y + ITEM_H / 2 + 10);
        ctx.textAlign = 'start';
    }
}

function formatTime(seconds) {
    var min = Math.floor(seconds / 60);
    var sec = seconds % 60;
    if (sec < 10) sec = '0' + sec;
    return min + ':' + sec;
}