function renderTimeToday(cData) {
    var Chart = require('chart.js');
    var ct = document.getElementById('timeToday'),
        ctx = ct.getContext('2d'),
        pData = Object.values(cData.prHourBreak).map((e) => {
            return Math.round(e / 60);
        }),
        npData = Object.values(cData.uprHourBreak).map((e) => {
            return Math.round(e / 60);
        }),
        neData = Object.values(cData.neHourBreak).map((e) => {
            return Math.round(e / 60);
        }),
        myPieChart = new Chart(ctx, {
        type: 'line',        
        data: {
            labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
            datasets: [{
              label: "Productive",
              borderColor: "#4caf50",
              data: pData,
              fill: false
            },{
                label: "Un-Productive",
                borderColor: "#d32f2f",
                data: npData,
                fill: false
            },{
                label: "Neutral",
                borderColor: "#BB86FC",
                data: neData,
                fill: false
            }]
          },
          options: {
            legend: {
                labels: {
                    fontColor: '#cccccc'                    
                }
            },
            title: {
              display: true,
              text: 'Your productivity by hour',
              fontColor: '#cccccc',              
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'No. of Minutes'
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Hour'
                    }
                }]
            }
          }
    });
}

function init() {
    const ipc = require('electron').ipcRenderer;
    ipc.on('dataReady', (e, data) => {
        switch(data.type) {
            case 'timeToday':
                console.log("Mass Mass");
                console.log(data);
                renderTimeToday(data.data);
              break;
            default:
              console.log("Cannot Understand");
              break;        
          }
    });        
    ipc.send('getData', {
        type: 'timeToday',
        data: {}
    });    
}

$(document).ready(function() {
    init();
});