import { createBarChart, createPolarChart } from "./CreateChart.js";

/** Declare variables */
const fsURL = "YOUR_FEATURE_SERVICE_URL";
const fsFields = [
  "Risk",
  "Hazard",
  "Vulnerabil",
  "Exposure",
  "RiskClass",
  "HzClass",
  "VuClass",
  "EpClass"
];

const riskColor = ["#FFFDFB", "#F5C5AB", "#E19884", "#DB6857", "#C93636"];
const hzColor = ["#FFFDFB", "#FFF1E2", "#FEDCBA", "#FCB16C", "#F78721"];
const vuColor = ["#FCFBFD", "#EDE8F4", "#CFC4E0", "#A68FC5", "#75559B"];
const epColor = ["#F0F8FF", "#C2E0FF", "#7EB8FF", "#3A8CFF", "#0062CC"];

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize print button
  document.getElementById("btnPrint").addEventListener("click", () => {
    window.print();
  });

  // Set current date
  const dateFormatter = new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById("today-date").innerText = dateFormatter.format(new Date());

  // Get feature ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const featureId = urlParams.get('id');

  if (!featureId) {
    console.error("No feature ID provided in URL");
    return;
  }

  try {
    // Load feature data
    const feature = await queryFeature(featureId);
    
    // Update report content
    updateReportContent(feature);
    
    // Initialize charts
    initializeCharts(feature);
    
    // Initialize maps
    initializeMaps(feature);
    
  } catch (error) {
    console.error("Error generating report:", error);
  }
});

async function queryFeature(featureId) {
  const featureLayer = new FeatureLayer({
    url: fsURL,
  });

  const query = featureLayer.createQuery();
  query.where = `ID_2 = ${featureId}`;
  query.outFields = ["*"];

  const { features } = await featureLayer.queryFeatures(query);
  if (features.length === 0) {
    throw new Error("No features found");
  }

  return features[0];
}

function updateReportContent(feature) {
  const attributes = feature.attributes;
  
  // Update admin names
  const adminNames = [
    attributes.NAME_2,
    attributes.NAME_1
  ].filter(Boolean);
  
  document.getElementById("admin-node").textContent = adminNames.join(", ");
  document.getElementById("admin-sum-name").textContent = adminNames.join(", ");
  document.getElementById("hz-admin-name").textContent = adminNames.join(", ");
  document.getElementById("vu-admin-name").textContent = adminNames.join(", ");
  document.getElementById("ep-admin-name").textContent = adminNames.join(", ");

  // Update risk scores
  document.getElementById("summary-score").textContent = (attributes.Risk * 9 + 1).toFixed(1);
  document.getElementById("summary-class").textContent = attributes.RiskClass;
  
  document.getElementById("hz-risk-score").textContent = (attributes.Hazard * 9 + 1).toFixed(1);
  document.getElementById("hz-class").textContent = attributes.HzClass;
  
  document.getElementById("vu-risk-score").textContent = (attributes.Vulnerabil * 9 + 1).toFixed(1);
  document.getElementById("vu-class").textContent = attributes.VuClass;
  
  document.getElementById("ep-risk-score").textContent = (attributes.Exposure * 9 + 1).toFixed(1);
  document.getElementById("ep-class").textContent = attributes.EpClass;
}

function initializeCharts(feature) {
  const attributes = feature.attributes;
  
  // Dimensions Bar Chart
  const barChart = createBarChart(document.getElementById("dimensions-bar-chart"));
  barChart.data.datasets[0].data = [
    attributes.Hazard,
    attributes.Vulnerabil,
    attributes.Exposure
  ];
  barChart.update();
  
  // Hazard Polar Chart
  const hzChart = createPolarChart(
    document.getElementById("hz-chart-node"),
    ["Slope Angle", "Soil Type", "Rainfall", "Land Use", "Geology", "Vegetation"]
  );
  hzChart.data.datasets[0].data = [
    attributes.Hz1 || 0,
    attributes.Hz2 || 0,
    attributes.Hz3 || 0,
    attributes.Hz4 || 0,
    attributes.Hz5 || 0,
    attributes.Hz6 || 0
  ];
  hzChart.update();
  
  // Vulnerability Polar Chart
  const vuChart = createPolarChart(
    document.getElementById("vu-chart-node"),
    ["Population", "Buildings", "Infrastructure", "Agriculture", "Economy"]
  );
  vuChart.data.datasets[0].data = [
    attributes.Vu1 || 0,
    attributes.Vu2 || 0,
    attributes.Vu3 || 0,
    attributes.Vu4 || 0,
    attributes.Vu5 || 0
  ];
  vuChart.update();
  
  // Exposure Polar Chart
  const epChart = createPolarChart(
    document.getElementById("ep-chart-node"),
    ["Roads", "Schools", "Hospitals", "Bridges", "Utilities"]
  );
  epChart.data.datasets[0].data = [
    attributes.Ep1 || 0,
    attributes.Ep2 || 0,
    attributes.Ep3 || 0,
    attributes.Ep4 || 0,
    attributes.Ep5 || 0
  ];
  epChart.update();
}

function initializeMaps(feature) {
  createRiskLayerAndView("Risk", "viewRisk", "legendRisk", feature);
  createRiskLayerAndView("Hazard", "viewHZ", "legendHZ", feature);
  createRiskLayerAndView("Vulnerabil", "viewVU", "legendVU", feature);
  createRiskLayerAndView("Exposure", "viewEP", "legendEP", feature);
}

function createRiskLayerAndView(field, viewDiv, legendDiv, feature) {
  const layer = new FeatureLayer({
    url: fsURL,
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
    layerInfos: [{
      layer: layer,
      title: "Legend",
    }],
  });

  view.when(() => {
    disableZooming(view);
    generateRenderer(view, layer, field);
    view.goTo({
      target: feature.geometry,
      zoom: 10
    });
    view.whenLayerView(layer).then((layerView) => {
      layerView.highlight(feature.attributes.OBJECTID);
    });
  });
}

function disableZooming(view) {
  view.popup.actions = [];
  view.ui.components = [];

  function stopEvtPropagation(event) {
    event.stopPropagation();
  }

  view.on("mouse-wheel", stopEvtPropagation);
  view.on("double-click", stopEvtPropagation);
  view.on("double-click", ["Control"], stopEvtPropagation);
  view.on("drag", stopEvtPropagation);
  view.on("drag", ["Shift"], stopEvtPropagation);
  view.on("drag", ["Shift", "Control"], stopEvtPropagation);

  view.on("key-down", (event) => {
    const prohibitedKeys = ["+", "-", "Shift", "_", "=", "ArrowUp", "ArrowDown"];
    if (prohibitedKeys.includes(event.key)) {
      event.stopPropagation();
    }
  });
}

function generateRenderer(view, featureLayer, field) {
  const params = {
    view: view,
    layer: featureLayer,
    field: field,
    classificationMethod: "natural-breaks",
    numClasses: 5,
    defaultSymbolEnabled: false,
  };

  colorRendererCreator.createClassBreaksRenderer(params).then((rendererResponse) => {
    const newRenderer = rendererResponse.renderer;
    const breakInfos = newRenderer.classBreakInfos;
    
    breakInfos[0].label = `Very Low (${breakInfos[0].minValue.toFixed(2)} - ${breakInfos[0].maxValue.toFixed(2)})`;
    breakInfos[1].label = `Low (${breakInfos[1].minValue.toFixed(2)} - ${breakInfos[1].maxValue.toFixed(2)})`;
    breakInfos[2].label = `Medium (${breakInfos[2].minValue.toFixed(2)} - ${breakInfos[2].maxValue.toFixed(2)})`;
    breakInfos[3].label = `High (${breakInfos[3].minValue.toFixed(2)} - ${breakInfos[3].maxValue.toFixed(2)})`;
    breakInfos[4].label = `Very High (${breakInfos[4].minValue.toFixed(2)} - ${breakInfos[4].maxValue.toFixed(2)})`;

    const colorScheme = 
      field === "Risk" ? riskColor :
      field === "Hazard" ? hzColor :
      field === "Vulnerabil" ? vuColor : epColor;

    breakInfos.forEach((breakInfo, i) => {
      breakInfo.symbol.color = colorScheme[i];
    });

    featureLayer.renderer = newRenderer;
  });
}