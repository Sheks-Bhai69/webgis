/** Declare variables */
const fsURL =
  "https://services.arcgis.com/Zoi8xtp32kQcxoKu/ArcGIS/rest/services/SLB_INFORM/FeatureServer/0/";
const fsFields = [
  "informscore",
  "hzdim",
  "vudim",
  "ccdim",
  "informclass",
  "hzclass",
  "vuclass",
  "ccclass"
];
const adminFields = [
  "ADM3_CODE",
  "ADM3_NAME",
  "ADM2_NAME",
  "ADM1_NAME",
  "ADM0_NAME"
];

const riskColor = ["#FFFDFB", "#F5C5AB", "#E19884", "#DB6857", "#C93636"];
const hzColor = ["#FFFDFB", "#FFF1E2", "#FEDCBA", "#FCB16C", "#F78721"];
const vuColor = ["#FCFBFD", "#EDE8F4", "#CFC4E0", "#A68FC5", "#75559B"];
const ccColor = ["#FEFDFB", "#F2E7D9", "#DCC19D", "#C08F4E", "#966C36"];
/** End Declare variables */

require([
  "esri/core/urlUtils",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/smartMapping/renderers/color",
  "esri/widgets/Legend",
], (urlUtils, Map, MapView, FeatureLayer, colorRendererCreator, Legend) =>
  (async () => {
    document.getElementById("btnPrint").addEventListener("click", () => {
      window.print();
    });

    // UPDATE DATE TIME //
    const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedDate = dateFormatter.format(new Date());
    document.getElementById("today-date").innerHTML = formattedDate;

    const urlObject = urlUtils.urlToObject(document.location.href);

    let featureGeometry;
    let featureAttributes;

    if (urlObject.query) {
      // queryFeatures(urlObject.query.id);

      const featureLayer = new FeatureLayer({
        url: fsURL,
      });
  
      let query = featureLayer.createQuery();
      query.where = `${adminFields[0]} = '${urlObject.query.id}'`;
      query.outFields = ["*"];
  
      const { features } = await featureLayer.queryFeatures(query);
      if (features.length > 0) {
        //featureGeometry = features[0].geometry.centroid;
        featureGeometry = features[0].geometry.extent;
        featureAttributes = features[0].attributes;
      } else {
        console.log("No features found.");
      }

    } else {
      console.log("no url parameter");
      return;
    }

    const adminNode = document.getElementById("admin-node");
    const adminNames = adminFields.slice(1).map(adminField => featureAttributes[adminField]);
    adminNode.innerHTML = adminNames.join(", ");

    // SUMMARY //
    const adminSum = document.getElementById("admin-sum-name");
    adminSum.innerHTML = adminNames.join(", ");
    const summaryScore = document.getElementById("summary-score");
    summaryScore.innerHTML = featureAttributes[fsFields[0]]
    const summaryClass = document.getElementById("summary-class");
    summaryClass.innerHTML = featureAttributes[fsFields[4]]
    
    document.getElementById("hz-class").innerHTML = featureAttributes["hzclass"]
    document.getElementById("vu-class").innerHTML = featureAttributes["vuclass"]
    document.getElementById("cc-class").innerHTML = featureAttributes["ccclass"]
    document.getElementById("hz-risk-score").innerHTML = featureAttributes["hzdim"]
    document.getElementById("vu-risk-score").innerHTML = featureAttributes["vudim"]
    document.getElementById("cc-risk-score").innerHTML = featureAttributes["ccdim"]
    document.getElementById("hz-admin-name").innerHTML = adminNames.join(", ");
    document.getElementById("vu-admin-name").innerHTML = adminNames.join(", ");
    document.getElementById("cc-admin-name").innerHTML = adminNames.join(", ");

    // DIMENSIONS BAR CHART //
    const dimensionsChartNode = document.getElementById("dimensions-bar-chart");
    const dimensionsBarChart = createBarChart(dimensionsChartNode);
    dimensionsBarChart.update();

    // UPDATE DIMENSION CHART //
    let dimensionStats = [
      featureAttributes[fsFields[1]],
      featureAttributes[fsFields[2]],
      featureAttributes[fsFields[3]]
    ];
    dimensionsBarChart.data.datasets[0].data = dimensionStats;
    dimensionsBarChart.update();

    // HAZARD DIMENSIONS POLAR CHART //
    const hzChartNode = document.getElementById('hz-chart-node');
    const hzLabels = [
      "Riverine Flood",
      "Coastal Flood",
      "Earthquake",
      "Tropical Cyclone",
      "Tsunami",
      "Storm Surge"
    ];
    const hzPolarChart = createPolarChart(hzChartNode, hzLabels);
    hzPolarChart.data.datasets[0].backgroundColor = "rgba(247, 135, 33, 0.5)";
    hzPolarChart.data.datasets[0].borderColor = "rgba(247, 135, 33, 1)";
    hzPolarChart.update();

    // VULNERABILITY POLAR CHART //
    const vuChartNode = document.getElementById('vu-chart-node');
    const vuLabels = [
      ["Development", "& Deprivation Index"],
      "Inequality Index",
      "Aid Dependency Index",
      "Children under 5",
      "Disability Person",
      "Elderly Person"
    ];
    const vuPolarChart = createPolarChart(vuChartNode, vuLabels);       
    vuPolarChart.data.datasets[0].backgroundColor = "rgba(117, 85, 115, 0.5)";
    vuPolarChart.data.datasets[0].borderColor = "rgba(117, 85, 115, 1)";
    vuPolarChart.update();

    // LACK OF COPING CAPACITY POLAR CHART //
    const ccChartNode = document.getElementById('cc-chart-node');
    const ccLabels = [
      "Electricity",
      "Internet Access",
      "Mobile Cellular",
      "Road Density",
      "Water Source",
      "Sanitation",
      "Building Materials",
      "Health Facility Density"
    ];
    const ccPolarChart = createPolarChart(ccChartNode, ccLabels);
    ccPolarChart.data.datasets[0].backgroundColor = "rgba(150, 108, 54, 0.5)";
    ccPolarChart.data.datasets[0].borderColor = "rgba(150, 108, 54, 1)";
    ccPolarChart.update();

    // UPDATE HAZARD POLAR CHART //
    hzPolarChart.data.datasets[0].data = [
      featureAttributes["hz1"],
      featureAttributes["hz2"],
      featureAttributes["hz3"],
      featureAttributes["hz4"],
      featureAttributes["hz5"],
      featureAttributes["hz6"]
    ];
    hzPolarChart.update();

    // UPDATE VULNERABILITY POLAR CHART //
    vuPolarChart.data.datasets[0].data = [
      featureAttributes["vu1"],
      featureAttributes["vu2"],
      featureAttributes["vu3"],
      featureAttributes["vu4"],
      featureAttributes["vu5"],
      featureAttributes["vu6"]
    ];
    vuPolarChart.update();

    // UPDATE LACK OF COPING CAPACITY POLAR CHART //
    ccPolarChart.data.datasets[0].data = [
      featureAttributes["cc1"],
      featureAttributes["cc2"],
      featureAttributes["cc3"],
      featureAttributes["cc4"],
      featureAttributes["cc5"],
      featureAttributes["cc6"],
      featureAttributes["cc7"],
      featureAttributes["cc8"]
    ];
    ccPolarChart.update();

    // CREATE RISK LAYER AND VIEWS //
    createRiskLayerAndView(fsFields[0], "viewRisk", "legendRisk");
    createRiskLayerAndView(fsFields[1], "viewHZ", "legendHZ");
    createRiskLayerAndView(fsFields[2], "viewVU", "legendVU");
    createRiskLayerAndView(fsFields[3], "viewCC", "legendCC");

    // UPDATE ALL TABLE //
    // HAZARD TABLE //
    document.getElementById('hz-score1').innerHTML = hzPolarChart.data.datasets[0].data[0];
    document.getElementById('hz-score2').innerHTML = hzPolarChart.data.datasets[0].data[1];
    document.getElementById('hz-score3').innerHTML = hzPolarChart.data.datasets[0].data[2];
    document.getElementById('hz-score4').innerHTML = hzPolarChart.data.datasets[0].data[3];
    document.getElementById('hz-score5').innerHTML = hzPolarChart.data.datasets[0].data[4];
    document.getElementById('hz-score6').innerHTML = hzPolarChart.data.datasets[0].data[5];

    document.getElementById('hz-name1').innerHTML = hzLabels[0];
    document.getElementById('hz-name2').innerHTML = hzLabels[1];
    document.getElementById('hz-name3').innerHTML = hzLabels[2];
    document.getElementById('hz-name4').innerHTML = hzLabels[3];
    document.getElementById('hz-name5').innerHTML = hzLabels[4];
    document.getElementById('hz-name6').innerHTML = hzLabels[5];

    // VULNERABILITY TABLE//
    document.getElementById('vu-score1').innerHTML = vuPolarChart.data.datasets[0].data[0];
    document.getElementById('vu-score2').innerHTML = vuPolarChart.data.datasets[0].data[1];
    document.getElementById('vu-score3').innerHTML = vuPolarChart.data.datasets[0].data[2];
    document.getElementById('vu-score4').innerHTML = vuPolarChart.data.datasets[0].data[3];
    document.getElementById('vu-score5').innerHTML = vuPolarChart.data.datasets[0].data[4];
    document.getElementById('vu-score6').innerHTML = vuPolarChart.data.datasets[0].data[5];

    document.getElementById('vu-name1').innerHTML = vuLabels[0];
    document.getElementById('vu-name2').innerHTML = vuLabels[1];
    document.getElementById('vu-name3').innerHTML = vuLabels[2];
    document.getElementById('vu-name4').innerHTML = vuLabels[3];
    document.getElementById('vu-name4').innerHTML = vuLabels[4];
    document.getElementById('vu-name6').innerHTML = vuLabels[5];

    // LACK OF COPING CAPACITY TABLE//
    document.getElementById('cc-score1').innerHTML = ccPolarChart.data.datasets[0].data[0];
    document.getElementById('cc-score2').innerHTML = ccPolarChart.data.datasets[0].data[1];
    document.getElementById('cc-score3').innerHTML = ccPolarChart.data.datasets[0].data[2];
    document.getElementById('cc-score4').innerHTML = ccPolarChart.data.datasets[0].data[3];
    document.getElementById('cc-score5').innerHTML = ccPolarChart.data.datasets[0].data[4];
    document.getElementById('cc-score6').innerHTML = ccPolarChart.data.datasets[0].data[5];
    document.getElementById('cc-score7').innerHTML = ccPolarChart.data.datasets[0].data[6];
    document.getElementById('cc-score8').innerHTML = ccPolarChart.data.datasets[0].data[7];

    document.getElementById('cc-name1').innerHTML = ccLabels[0];
    document.getElementById('cc-name2').innerHTML = ccLabels[1];
    document.getElementById('cc-name3').innerHTML = ccLabels[2];
    document.getElementById('cc-name4').innerHTML = ccLabels[3];
    document.getElementById('cc-name5').innerHTML = ccLabels[4];
    document.getElementById('cc-name6').innerHTML = ccLabels[5];
    document.getElementById('cc-name7').innerHTML = ccLabels[6];
    document.getElementById('cc-name8').innerHTML = ccLabels[7];

    function createBarChart (barNode) {
      const barChart = new Chart(barNode, {
        type: "bar",
        data: {
          labels: [
            "Exposure to Hazard",
            "Vulnerability",
            "Lack of Coping Capacity",
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
          indexAxis: "y", // horizontalBar
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
                    label =
                      "The aspects of physical exposure and physical vulnerability";
                  } else if (tooltipItem.dataIndex == 1) {
                    label = "The aspect of fragility of the socio-economic system";
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
    
    function createPolarChart (polarNode, chartLabels) {
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
                display: false,
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
                  size: 10,
                },
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

    function createRiskLayerAndView (layerTitle, viewDiv, legendDiv) {
      const layer = new FeatureLayer({
        url: fsURL,
        labelingInfo: [
          {
            labelExpressionInfo: {
              expression: "$feature.ADM3_NAME"
            }
          }
        ],
        outFields: ["*"],
      });

      const view = new MapView({
        container: viewDiv,
        map: new Map({
          basemap: "topo-vector",
          layers: [layer],
        }),
        ui: { components: [] },
        constraints: { rotationEnabled: false },
        highlightOptions: { fillOpacity: 0 }
      });

      new Legend({
        view: view,
        container: legendDiv,
        layerInfos: [
          {
            layer: layer,
            title: "Legend",
          },
        ],
      });

      view.when(
        () => {
          disableZooming(view);
          generateRenderer(view, layer, layerTitle);
          view.goTo({
            center: featureGeometry,
            //zoom: 10
          });
          view.whenLayerView(layer).then((layerView) => {
            layerView.highlight(featureAttributes["OBJECTID"]);
          });
        },
        (error) => {
          console.error(error);
        }
      );
      return { outputLayerName: layer, outputView: view };
    };

    function disableZooming (view) {
      view.popup.actions = [];
      view.ui.components = [];

      // stops propagation of default behavior when an event fires
      function stopEvtPropagation(event) {
        event.stopPropagation();
      }

      // disable mouse wheel scroll zooming on the view
      view.on("mouse-wheel", stopEvtPropagation);

      // disable zooming via double-click on the view
      view.on("double-click", stopEvtPropagation);

      // disable zooming out via double-click + Control on the view
      view.on("double-click", ["Control"], stopEvtPropagation);

      // disables pinch-zoom and panning on the view
      view.on("drag", stopEvtPropagation);

      // disable the view's zoom box to prevent the Shift + drag
      // and Shift + Control + drag zoom gestures.
      view.on("drag", ["Shift"], stopEvtPropagation);
      view.on("drag", ["Shift", "Control"], stopEvtPropagation);

      // prevents zooming with the + and - keys
      view.on("key-down", (event) => {
        const prohibitedKeys = [
          "+",
          "-",
          "Shift",
          "_",
          "=",
          "ArrowUp",
          "ArrowDown",
          "ArrowRight",
          "ArrowLeft",
        ];
        const keyPressed = event.key;
        if (prohibitedKeys.indexOf(keyPressed) !== -1) {
          event.stopPropagation();
        }
      });

      return view;
    };

    function generateRenderer (view, featureLayer, thematicField) {
      const params = {
        view: view,
        layer: featureLayer,
        field: thematicField,
        classificationMethod: "natural-breaks",
        numClasses: 5,
        defaultSymbolEnabled: false,
      };

      // WHEN THE PROMISE RESOLVES, APPLY THE RENDERER TO THE LAYER //
      colorRendererCreator
        .createClassBreaksRenderer(params)
        .then((rendererResponse) => {
          const newRenderer = rendererResponse.renderer;
          const breakInfos = newRenderer.classBreakInfos;
          const breakInfosLength = breakInfos.length;

          breakInfos[0].label = `Very Low (${breakInfos[0].minValue} - ${breakInfos[0].maxValue})`;
          breakInfos[1].label = `Low (${breakInfos[1].minValue} - ${breakInfos[1].maxValue})`;
          breakInfos[2].label = `Medium (${breakInfos[2].minValue} - ${breakInfos[2].maxValue})`;
          breakInfos[3].label = `High (${breakInfos[3].minValue} - ${breakInfos[3].maxValue})`;
          breakInfos[4].label = `Very High (${breakInfos[4].minValue} - ${breakInfos[4].maxValue})`;

          const assignColorToClassBreaksRenderer = (nClass, colorList) => {
            for (let i = 0; i < nClass; i++) {
              breakInfos[i].symbol.color = colorList[i];
            }
          };
          // ASSIGN INFORM RISK COLOR AS DEFAULT //
          assignColorToClassBreaksRenderer(breakInfosLength, riskColor);

          switch (thematicField) {
            case fsFields[0]:
              assignColorToClassBreaksRenderer(breakInfosLength, riskColor);
              break;
            case fsFields[1]:
              assignColorToClassBreaksRenderer(breakInfosLength, hzColor);
              break;
            case fsFields[2]:
              assignColorToClassBreaksRenderer(breakInfosLength, vuColor);
              break;
            case fsFields[3]:
              assignColorToClassBreaksRenderer(breakInfosLength, ccColor);
          }
          featureLayer.renderer = newRenderer;
        });
    };

  })());
