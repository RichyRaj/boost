
function renderAppUsage(cData) {
    var Chart = require('chart.js');
    var ct = document.getElementById('appUsage'),
        ctx = ct.getContext('2d'),
        myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ["Productive", "Un-Productive", "Neutral"],
            datasets: [{
              label: "Time Spent Today",
              backgroundColor: ["#4caf50", "#d32f2f","#BB86FC"],
              data: cData
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
              text: 'How You Spent Your Time Today (Minutes)',
              fontColor: '#cccccc',              
            }
          }
    });
}

function init() {
    const ipc = require('electron').ipcRenderer;

    ipc.on('dataReady', (e, data) => {
        switch(data.type) {
            case 'todayAppUsage':
                console.log("Mass Mass");
                console.log(data);
                var cData = Object.values(data.data).map((e) => {
                    return Math.round(e / 60);
                })
                renderAppUsage(cData);
              break;
            default:
              console.log("Cannot Understand");
              break;        
          }
    });
        
    ipc.send('getData', {
        type: 'todayAppUsage',
        data: {}
    });    
}

$(document).ready(function() {
    init();
});