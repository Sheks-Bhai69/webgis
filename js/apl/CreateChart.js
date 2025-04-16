/* CreateChart.js - Simplified for bar charts only */
Chart.defaults.font.family = "'Avenir Next LT Pro', 'Avenir Next', 'Helvetica Nue', 'Helvetica', sans-serif";

export const createBarChart = (barNode) => {
  const barChart = new Chart(barNode, {
    type: "bar",
    data: {
      labels: [
        ["Lanslide Hazard"],
        ["Vulnerability"],
        ["Exposure"],
      ],
      datasets: [{
        axis: "y",
        data: [0.0, 0.0, 0.0],
        backgroundColor: [
          "rgba(247, 135, 33, 0.8", // Orange for Hazard
          "rgba(117, 85, 155, 0.8", // Purple for Vulnerability
          "rgba(30, 144, 255, 0.8"  // Blue for exposure
        ],
        borderColor: [
          "rgba(247, 135, 33, 1",
          "rgba(117, 85, 155, 1",
          "rgba(30, 144, 255, 1"
        ],
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
        datalabels: {
          color: "black",
          anchor: "end",
          align: "right",
          offset: 2,
          font:{
            family: "'Times New Roman', Times, serif"
          }
        },
      }]
    },
    plugins: [ChartDataLabels],
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.raw.toFixed(1)}`,
            title: () => 'Risk Score'
          }
        },
        datalabels: {
          display: true,
          color: '#fff',
          anchor: 'end',
          align: 'right',
          offset: 5,
          font: {
            size: 12,
            family: "'Times New Roman', Times, serif"
          },
          formatter: (value) => value.toFixed(1)
        }
      },
      scales: {
        y: {
          ticks: { 
            autoSkip: false,
            font:{
              family:"'Times New Roman', Times, serif"
            }
          },
          grid: { display: false }
        },
        x: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2 },
          title: {
            display: true,
            text: 'Risk Score (0-10)',
            font:{
              family:"'Times New Roman', Times, serif"
            }
          },
          grid: { display: false }
        }
      }
    }
  });

  // Add helper methods
  barChart.updateData = function(data) {
    // Scale values from 0-1 to 1-10 range
    const scaledData = data.map(value => (value * 9) + 1);
    this.data.datasets[0].data = scaledData;
    this.update();
  };

  barChart.clearData = function() {
    this.data.datasets[0].data = [0, 0, 0];
    this.update();
  };

  return barChart;
};