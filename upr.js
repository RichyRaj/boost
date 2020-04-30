function renderAppsUnProductive(cData) {
    console.log(cData)
    console.log(Object.keys(cData));
    console.log(Object.values(cData));
    var Chart = require('chart.js');

    var ct = document.getElementById('appsUpr'),
        appNames = Object.keys(cData),
        appDurations = Object.values(cData).map((e) => {
            return Math.round(e / 60) <= 0 ? 1 : Math.round(e / 60) ;
        }),
        appColors = [
            "#F44336",
            "#AB47BC",
            "#651FFF",
            "#536DFE",
            "#2196F3",
            "#01579B",
            "#00BFA5",
            "#69F0AE",
            "#EEFF41",
            "#F57F17"
        ],
        ctx = ct.getContext('2d'),
        myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: appNames,
            datasets: [{
              label: "Apps that were used when un-productive (usage in minutes)",  
              backgroundColor: appColors,
              data: appDurations
            }]
          },
          options: {
            title: {
              display: true,
              text: 'Apps that were used when un-productive (usage in minutes)',
              fontColor: '#cccccc',              
            }
          }        
    });
}

function init() {
    const ipc = require('electron').ipcRenderer;
    ipc.on('dataReady', (e, data) => {
        switch(data.type) {
            case 'todayUprApps':
                console.log("Mass Mass");
                console.log(data);                
                renderAppsUnProductive(data.data.prList);
              break;
            default:
              console.log("Cannot Understand");
              break;        
          }
    });
        
    ipc.send('getData', {
        type: 'todayUprApps',
        data: {}
    });
}

$(document).ready(function() {
    init();
});