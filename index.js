const moment = require('moment');

window.setInterval(function() {
    $('.main-page .ui.huge.statistic .cur_time').html(moment().format("HH:mm"));
}, 1000);
