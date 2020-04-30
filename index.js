function init() {
    const moment = require('moment'),
        ipc = require('electron').ipcRenderer;


    const ON_STATE = 'on',
        OFF_STATE = 'off';
            
    var cState = OFF_STATE,
        timeText = $('.main-page .ui.huge.statistic .cur_time'),
        statusText = $('.main-page .ui.huge.statistic .cur_status'),
        tglButton = $('.main-page .controls #mainToggle'),
        reportsButton = $('#reportsButton');

    tglButton.click(function(_e) {
        _e.preventDefault();
        if (tglButton.hasClass('active')) {
            tglButton.removeClass('active');
            tglButton.html('Start');
            statusText.html("Not Tracking");
            // Enable Reports
            if (reportsButton.hasClass('disabled')) {
                reportsButton.removeClass('disabled')
            }
            cState = OFF_STATE;
            ipc.send('fromHome', {
                type: 'stop',
                data: {}
            });
        } else {
            tglButton.addClass('active');
            tglButton.html('Stop');
            cState = ON_STATE;
            statusText.html("Tracking ... ");
            // Disable Reports
            if (!reportsButton.hasClass('disabled')) {
                reportsButton.addClass('disabled')
            }
            ipc.send('fromHome', {
                type: 'start',
                data: {}
            });
        }
    });

    window.setInterval(function() {
        timeText.html(moment().format("HH:mm"));
    }, 1000);
}

$(document).ready(function() {
    init();
});