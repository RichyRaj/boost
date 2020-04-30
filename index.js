function init() {
    const moment = require('moment'),
        ipc = require('electron').ipcRenderer;


    const ON_STATE = 'on',
        OFF_STATE = 'off';
            
    var cState = OFF_STATE,
        timeText = $('.main-page .ui.huge.statistic .cur_time'),
        statusText = $('.main-page .ui.huge.statistic .cur_status'),
        tglButton = $('.main-page .controls #mainToggle'),
        reportsButton = $('#reportsButton'),        
        myTimer = 0,
        timeElapsed = moment.duration(0); // 0 ms

    var startTimer = function() {
        myTimer = window.setInterval(function() {
            // Note: Snippets from the following links were used
            // https://stackoverflow.com/questions/10463376/momentjs-and-countdown-timer
            // https://stackoverflow.com/questions/13262621/how-do-i-use-format-on-a-moment-js-duration
            timeElapsed = moment.duration(timeElapsed.asMilliseconds() + 1000, 'milliseconds');
            console.log(timeElapsed.asMilliseconds());    
            timeText.html(moment.utc(timeElapsed.asMilliseconds()).format('HH:mm:ss'));
        }, 1000); 
    };

    var stopTimer = function() {
        clearInterval(myTimer);
        myTimer = 0;
        timeElapsed = moment.duration(0);
        timeText.html(moment.utc(timeElapsed.asMilliseconds()).format('HH:mm:ss'));
    }


    tglButton.click(function(_e) {
        _e.preventDefault();
        if (tglButton.hasClass('active')) {
            tglButton.removeClass('active');
            tglButton.html('Start');
            statusText.html("Not Tracking");
            stopTimer();
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
            startTimer();
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
}

$(document).ready(function() {
    init();
});