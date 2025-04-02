/*
 Copyright 2023 United Nations Satellite Centre (UNOSAT)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// import Chart from "chart.js/auto";
// import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.defaults.font.family = "'Avenir Next LT Pro', 'Avenir Next', 'Helvetica Nue', 'Helvetica', sans-serif";
// Chart.defaults.font.size = 11;
// Chart.defaults.color = "#3E8EDE";

class circularChart extends Chart.DoughnutController {
  draw() {
    super.draw(arguments);

    const { ctx, data, chartArea: {top, bottom, left, right, width, height}} = this.chart;
    //console.log(this.chart)
    ctx.save();
    ctx.font = 'normal 14px Avenir Next LT Pro';
    ctx.fillStyle = '#3E8EDE';
    let scoreText = (data.datasets[0].data[0]) ? 'score': '';
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, width/2, bottom-20);
    // ctx.textAlign = 'left';
    // ctx.fillText(0, left+20, bottom);
    
    // ctx.textAlign = 'right';
    // ctx.fillText(10, right-20, bottom);
    
    ctx.font = 'bold 14px Avenir Next LT Pro';
    ctx.fillStyle = '#3E8EDE';
    let dataValue = data.datasets[0].data[0] || '';
    ctx.textAlign = 'center';
    ctx.fillText(dataValue, width/2, bottom);
    
  }
}
circularChart.id = 'circularGauge';
circularChart.defaults = Chart.DoughnutController.defaults;
circularChart.defaults = {
  cutout: '60%',
  circumference: 180,
  rotation: 270
};
circularChart.overrides = {
  aspectRatio: 4,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    }
  }
}
Chart.register(circularChart);

export const createGaugeChart = (gaugeNode) => {
  const gaugeChart = new Chart(gaugeNode, {
    type: "circularGauge",
    data: {
      datasets: [{
        data: [0.0, 0.0],
        backgroundColor: ["#C93636", "#F3F3F3"],
        //borderColor: ["#F3F3F3"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
  return gaugeChart;
};

export const createBarChart = (barNode) => {
  const barChart = new Chart(barNode, {
    type: "bar",
    data: {
      labels: [
        ["Exposure to Hazard"],
        ["Vulnerability"],
        ["Lack of Coping", "Capacity"],
      ],
      datasets: [
        {
          axis: "y",
          data: [0.0, 0.0, 0.0],
          backgroundColor: ["#F78721", "#75559B", "#966C36"],
          datalabels: {
            color: "white",
            anchor: "end",
            align: "left",
            offset: 10,
          },
        },
      ],
    },
    plugins: [ChartDataLabels],
    options: {
      indexAxis: "y", //horizontalBar
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: false,
        tooltip: {
          enabled: true,
          callbacks: {
            title: () => null,
            label: function (tooltipItem, data) {
              let label;
              if (tooltipItem.dataIndex == 0) {
                label = "The aspects of physical exposure and physical vulnerability";
              } else if (tooltipItem.dataIndex == 1) {
                label =
                  "The aspect of fragility of the socio-economic system";
              } else {
                label = "Lack of resilience to cope and recover";
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            autoSkip: false,
          },
        },
        x: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 2,
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
  return barChart;
};

export const createPolarChart = (polarNode, chartLabels) => {
  const polarChart = new Chart(polarNode, {
    type: "polarArea",
    data: {
      labels: chartLabels,
      datasets: [
        {
          data: [],
          backgroundColor: "",
          borderColor: "",
          borderWidth: 0.5,
          datalabels: {
            align: "start",
            anchor: "end",
            color: "#151515",
            display: false
          },
        },
      ],
    },
    //plugins: [ChartDataLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      //animationDuration: 0,
      //animation: { duration: 0 },
      //hover: { animationDuration: 0 },
      responsiveAnimationDuration: 0,
      plugins: {
        title: {
          display: false,
        },
        legend: false,
      },
      scales: {
        r: {
          pointLabels: {
            display: true,
            centerPointLabels: true,
            font: {
              size: 11
            }
          },
          angleLines: {
            display: true,
            color: "#020D3A",
            lineWidth: 0.5,
          },
          grid: {
            color: "#020D3A",
            // color: function (context) {
            //   if (context.tick.value == 10) {
            //     return "#020D3A";
            //   }
            //   return "rgba(0, 0, 0, 0.1)";
            // },
            lineWidth: 0.5,
          },
          min: 0,
          max: 10,
          ticks: {
            showLabelBackdrop: false,
            display: true,
            //color: "#666",
            stepSize: 2,
            padding: 90,
            z: 1,
          },
        },
      },
    },
  });
  return polarChart;
};