 import AppBase from "./support/AppBase.js";
 import AppLoader from "./loaders/AppLoader.js";
 import SignIn from "./apl/SignIn.js";
 import ViewLoading from "./apl/ViewLoading.js";
 import MapScale from './apl/MapScale.js';
 import { createGaugeChart, createBarChart, createPolarChart } from "./apl/CreateChart.js";
 import { uploadData } from "./apl/UploadData.js";
 
 class Application extends AppBase {
 
   // PORTAL //
   portal;
 
   constructor() {
     super();
 
     // LOAD APPLICATION BASE //
     super.load().then(() => {
 
         // APPLICATION LOADER //
         const applicationLoader = new AppLoader({ app: this });
         applicationLoader.load().then(({ portal, group, map, view }) => {
             //console.info(portal, group, map, view);
 
             // PORTAL //
             this.portal = portal;
 
             // SET APPLICATION DETAILS //
             this.setApplicationDetails({map, group});
 
             // VIEW SHAREABLE URL PARAMETERS //
             this.initializeViewShareable({view});
 
             // USER SIGN-IN //
             //this.configUserSignIn();
 
             // APPLICATION //
             this.applicationReady({portal, group, map, view}).catch(this.displayError).then(() => {
               // HIDE APP LOADER //
               document.getElementById('app-loader').toggleAttribute('hidden', true);
             });
 
           }).catch(this.displayError);
       }).catch(this.displayError);
 
   }
 
   /**
    *
    */
   configUserSignIn() {
 
     const signInContainer = document.getElementById("sign-in-container");
     if (signInContainer) {
       const signIn = new SignIn({container: signInContainer, portal: this.portal});
     }
 
   }
 
   /**
    *
    * @param view
    */
   configView({view}) {
     return new Promise((resolve, reject) => {
       if (view) {
         require([
           'esri/core/reactiveUtils',
           'esri/widgets/Popup',
           'esri/widgets/Home',
           'esri/widgets/Search',
           'esri/widgets/Compass',
           'esri/widgets/LayerList',
           'esri/widgets/Slider',
           'esri/widgets/Legend',
           'esri/widgets/BasemapGallery',
           'esri/widgets/Expand',
         ], (reactiveUtils, Popup, Home, Search, Compass, LayerList, Slider, Legend, BasemapGallery, Expand) => {
 
           // VIEW AND POPUP //
           view.set({
             constraints: { snapToZoom: false },
             highlightOptions: {
               //color: '#ffffff',
               fillOpacity: 0,
               //haloColor: '#3E8EDE',
               //haloOpacity: 0.5
             },
             popup: new Popup({
               dockEnabled: true,
               dockOptions: {
                 buttonEnabled: false,
                 breakpoint: false,
                 position: "top-right",
               },
             }),          
           });
 
           // SEARCH //
           const search = new Search({
             view: view,
             locationEnabled: false,
             resultGraphicEnabled: false,
             popupEnabled: false,
           });
 
           const searchExpand = new Expand({
             expandTooltip: "Search",
             view: view,
             content: search
           });
           view.ui.add(searchExpand, { position: "top-left", index: 0 });
 
           // HOME //
           const home = new Home({ view });
           view.ui.add(home, { position: "top-left", index: 1 });
 
           // COMPASS //
           const compass = new Compass({view: view});
           view.ui.add(compass, {position: 'top-left', index: 2});
           reactiveUtils.watch(() => view.rotation, rotation => {
             compass.set({visible: (rotation > 0)});
           }, {initial: true});
 
           // MAP SCALE //
           const mapScale = new MapScale({view});
           view.ui.add(mapScale, {position: 'bottom-right', index: 0});
 
           // LAYER LIST //
           const layerList = new LayerList({
             container: "layer-list-container",
             view: view,
             visibleElements: { statusIndicators: true },
             listItemCreatedFunction: (evt) => {
               const item = evt.item;
               item.actionsSections = [
                 {
                   title: "Opacity",
                   className: "esri-icon-up",
                   id: "increase-opacity"
                 }
               ];
   
               const slider = new Slider({
                 min: 0,
                 max: 100,
                 values: [100],
                 steps: [0, 25, 50, 75, 100],
                 snapOnClickEnabled: true,
                 tickConfigs: [{
                   mode: "position",
                   values: [0, 25, 50, 75, 100],
                   labelsVisible: false
                 }],
                 visibleElements: {
                   labels: false,
                   rangeLabels: true
                 }
               });
   
               item.panel = {
                 content: slider,
                 className: "esri-icon-sliders-horizontal",
                 title: "Change layer opacity",
                 open: false
               };
   
               slider.on("thumb-drag", (evt) => {
                 const { value } = evt;
                 item.layer.opacity = value / 100;
               });
               slider.labelFormatFunction = (value, type) => {
                 return (type === "value") ? value : parseFloat(value) +"%";
               }
             }            
           });
 
           // LEGEND //
           const legendPanel = new Legend({
             container: "legend-container",
             view: view,
           });
 
           // LEGEND ON MAP //
           const riskLayer = view.map.allLayers.find((layer) => layer.title === 'Risk_Index');
           const legend = new Legend({
             view: view,
             layerInfos: [
               {
                 layer: riskLayer
               }
             ]
           });
 
           const legendExpand = new Expand({
             expandTooltip: "Legend",
             view: view,
             content: legend,
             expanded: true
           });
           view.ui.add(legendExpand, { position: "bottom-left", index: 0 });
           
           // BASEMAP Gallery //
           const basemapGallery = new BasemapGallery({view: view, container: 'basemap-gallery-container'});
 
           // VIEW LOADING INDICATOR //
           const viewLoading = new ViewLoading({ view: view });
           view.ui.add(viewLoading, "bottom-right");
 
           resolve();
         });
       } else { resolve(); }
     });
   }
 
   /**
    *
    * @param portal
    * @param group
    * @param map
    * @param view
    * @returns {Promise}
    */
   applicationReady({ portal, group, map, view }) {
     return new Promise(async (resolve, reject) => {
       // VIEW READY //
       this.configView({view}).then(() => {
         
         this.initializeUploadData({ portal, map, view });
         this.initializeCharts();
         this.initializeDisplayDetails({view});
         this.initializeMapDisplay({view});
         this.initializeMapAction({view});
         this.initializeRank({view});
 
         resolve();
       }).catch(reject);
     });
   }
 
   /**
    *
    */
   initializeUploadData({ portal, map, view }) {
     uploadData(portal, map, view);
   }
 
   /**
    *
    */
   initializeCharts() {
 
     //
     // CREATE RISK GAUGE CHART //
     //
 
     // RISK GAUGE CHART //
     const riskChartNode = document.getElementById("risk-gauge-chart");
     const riskGaugeChart = createGaugeChart(riskChartNode);
     riskGaugeChart.update();
 
     //
     // CREATE DIMENSIONS BAR CHART //
     //
 
     // DIMENSIONS BAR CHART //
     const dimensionsChartNode = document.getElementById("dimensions-bar-chart");
     const dimensionsBarChart = createBarChart(dimensionsChartNode);
     dimensionsBarChart.update();
 
     //
     // CREATE POLAR CHARTS AND SET LABEL //
     //
 
     // SUSCEPTIBILITY CHART //
     const susceptibilityChartNode = document.getElementById('susceptibility-chart-node');
     const susceptibilityLabels = [
       "Slope Angle",
       "Soil Type",
       "Rainfall",
       "Land Use",
       "Geology",
       "Vegetation Cover"
     ];
     const susceptibilityPolarChart = createPolarChart(susceptibilityChartNode, susceptibilityLabels);
     susceptibilityPolarChart.data.datasets[0].backgroundColor = "rgba(247, 135, 33, 0.5)";
     susceptibilityPolarChart.data.datasets[0].borderColor = "rgba(247, 135, 33, 1)";
     susceptibilityPolarChart.update();
 
     // EXPOSURE CHART //
     const exposureChartNode = document.getElementById('exposure-chart-node');
     const exposureLabels = [
       "Population",
       "Buildings",
       "Roads",
       "Schools",
       "Health Facilities",
       "Water Sources"
     ];
     const exposurePolarChart = createPolarChart(exposureChartNode, exposureLabels);       
     exposurePolarChart.data.datasets[0].backgroundColor = "rgba(117, 85, 115, 0.5)";
     exposurePolarChart.data.datasets[0].borderColor = "rgba(117, 85, 115, 1)";
     exposurePolarChart.update();
 
     // MITIGATION CHART //
     const mitigationChartNode = document.getElementById('mitigation-chart-node');
     const mitigationLabels = [
       "Drainage Systems",
       "Retaining Walls",
       "Vegetation Planting",
       "Early Warning Systems",
       "Land Use Planning",
       "Community Awareness"
     ];
     const mitigationPolarChart = createPolarChart(mitigationChartNode, mitigationLabels);
     mitigationPolarChart.data.datasets[0].backgroundColor = "rgba(150, 108, 54, 0.5)";
     mitigationPolarChart.data.datasets[0].borderColor = "rgba(150, 108, 54, 1)";
     mitigationPolarChart.update();
 
     /**
      *
      */
     this.clearCharts = () => {
 
       // CLEAR RISK CHART //
       riskGaugeChart.data.datasets[0].data = [];
       riskGaugeChart.update();
 
       // CLEAR DIMENSIONS CHART //
       dimensionsBarChart.data.datasets[0].data = [];
       dimensionsBarChart.update();
 
       // CLEAR SUSCEPTIBILITY CHART //
       susceptibilityPolarChart.data.datasets[0].data = [];
       susceptibilityPolarChart.update();
 
       // CLEAR EXPOSURE CHART //
       exposurePolarChart.data.datasets[0].data = [];
       exposurePolarChart.update();
 
       // CLEAR MITIGATION CHART //
       mitigationPolarChart.data.datasets[0].data = [];
       mitigationPolarChart.update();
 
     };
 
     /**
      *
      * @param {Object} feature
      */
     this.updateCharts = (feature) => {
 
       // UPDATE RISK CHART //
       riskGaugeChart.data.datasets[0].data = [feature.getAttribute("N_RI"), 10-feature.getAttribute("N_RI")];
       riskGaugeChart.update();
 
       // UPDATE DIMENSION CHART //
       let dimensionStats = [
         feature.getAttribute("susceptibility_score"),
         feature.getAttribute("exposure_score"),
         feature.getAttribute("mitigation_score")
       ];
       dimensionsBarChart.data.datasets[0].data = dimensionStats;
       dimensionsBarChart.update();
 
       // UPDATE SUSCEPTIBILITY CHART //
       susceptibilityPolarChart.data.datasets[0].data = [
         feature.getAttribute("slope_angle"),
         feature.getAttribute("soil_type"),
         feature.getAttribute("rainfall"),
         feature.getAttribute("land_use"),
         feature.getAttribute("geology"),
         feature.getAttribute("vegetation_cover")
       ];
       susceptibilityPolarChart.update();
 
       // UPDATE EXPOSURE CHART //
       exposurePolarChart.data.datasets[0].data = [
         feature.getAttribute("population"),
         feature.getAttribute("buildings"),
         feature.getAttribute("roads"),
         feature.getAttribute("schools"),
         feature.getAttribute("health_facilities"),
         feature.getAttribute("water_sources")
       ];
       exposurePolarChart.update();
 
       // UPDATE MITIGATION CHART //
       mitigationPolarChart.data.datasets[0].data = [
         feature.getAttribute("drainage_systems"),
         feature.getAttribute("retaining_walls"),
         feature.getAttribute("vegetation_planting"),
         feature.getAttribute("early_warning"),
         feature.getAttribute("land_use_planning"),
         feature.getAttribute("community_awareness")
       ];
       mitigationPolarChart.update();
 
     };    
 
   }
 
   /**
    *
    * @param view
    */
   initializeDisplayDetails({view}) {
     if (view) {
       require([
         "esri/core/reactiveUtils"
       ], (reactiveUtils) => {
 
         // DEFAULT EXTENT //
         const defaultView = view.center;
         const defaultZoom = view.zoom;
 
         const numberFormatter = new Intl.NumberFormat('en-US');
 
         // FEATURE LAYER //
         const layerTitle = "Risk_Index";
         const featureLayer = view.map.allLayers.find((layer) => layer.title === layerTitle);
 
         const adminNameNode = document.getElementById('admin-name');
         const adminTitleNode = adminNameNode.querySelector('[slot="title"]');
         const adminMessageNode = adminNameNode.querySelector('[slot="message"]');
         const adminDescriptiveNode = document.getElementById('admin-descriptive');
 
         const populationAtRiskLabel = document.getElementById('population-at-risk-label');
         const buildingsAtRiskLabel = document.getElementById('buildings-at-risk-label');
         const roadsAtRiskLabel = document.getElementById('roads-at-risk-label');
         const schoolsAtRiskLabel = document.getElementById('schools-at-risk-label');
         const healthFacilitiesLabel = document.getElementById('health-facilities-label');
         const waterSourcesLabel = document.getElementById('water-sources-label');
 
         const createReportBtn = document.getElementById("create-report-btn");
 
         /**
          *
          */
         this.clearDetails = (view, layerView) => {
 
           // CLEAR EFFECTS //
           layerView.featureEffect = null;
 
           // ZOOM TO DEFAULT EXTENT //
           view.goTo(
             {
               center: defaultView,
               zoom: defaultZoom
             },
             { 
               animate: true,
               duration: 1000 
             }
           );
 
           adminTitleNode.innerHTML = "Click on the map to get information";
           adminMessageNode.innerHTML = "";
           adminDescriptiveNode.innerHTML = "";
           populationAtRiskLabel.innerHTML = "--,---";
           buildingsAtRiskLabel.innerHTML = "--,---";
           roadsAtRiskLabel.innerHTML = "--.-";
           schoolsAtRiskLabel.innerHTML = "--";
           healthFacilitiesLabel.innerHTML = "--";
           waterSourcesLabel.innerHTML = "--";
           createReportBtn.setAttribute('href','');
         };
 
         /**
          *
          * @param {Object} feature
          * @param layerView
          */
         this.updateDetails = (feature, layerView) => {
 
           // APPLY EFFECTS TO SELECTED FEATURE //
           layerView.featureEffect = {
             filter: {
               where: `ID_2 = ${feature.getAttribute("ID_2")}`
             },
             excludedLabelsVisible: true,
             includedEffect: "opacity(0%)",
           };
 
           // ZOOM TO SELECTED ADMIN //
           view.goTo({
               center: feature.geometry.extent,
             },{
               animate: true,
               duration: 1000
             }
           );
 
           // UPDATE RISK SCORE AND ADMIN NAME//
           adminTitleNode.innerHTML = `Risk Index is <b>${feature.getAttribute("ID_2")}</b> (Score: <b>${feature.getAttribute("N_RI")}</b> out of 10)`
           
           let adminName = [
             feature.getAttribute("NAME_2"),
             feature.getAttribute("NAME_1"),
           ];
           adminMessageNode.innerHTML = adminName.join(", ");
 
           // UPDATE KEY INDICATORS //
           adminDescriptiveNode.innerHTML = `The risk index rating is <b>${feature.getAttribute("ID_2")} (Score: ${feature.getAttribute("N_RI")} out of 10)</b> for <b>${adminName.slice(0, 3).join(", ")}</b> when compared to the rest of ${adminName[3]}.`
           
           populationAtRiskLabel.innerHTML = numberFormatter.format(feature.getAttribute("population_at_risk"));
           buildingsAtRiskLabel.innerHTML = numberFormatter.format(feature.getAttribute("buildings_at_risk"));
           roadsAtRiskLabel.innerHTML = feature.getAttribute("roads_at_risk").toFixed(1);
           schoolsAtRiskLabel.innerHTML = feature.getAttribute("schools_at_risk");
           healthFacilitiesLabel.innerHTML = feature.getAttribute("health_facilities_at_risk");
           waterSourcesLabel.innerHTML = feature.getAttribute("water_sources_at_risk");
           
           // UPDATE REPORT LINK //
           createReportBtn.setAttribute('href', `./report/?id=${feature.getAttribute("Name_2")}`);
 
         };
 
 
       });
     }
   }
 
   /**
    *
    * @param view
    */
   initializeMapDisplay({view}) {
     if (view) {
       require([
         "esri/core/reactiveUtils",
         "esri/smartMapping/renderers/color",
       ], (reactiveUtils, colorRendererCreator) => {
 
         // FEATURE LAYER //
         const layerTitle = "Risk_Index";
         const featureLayer = view.map.allLayers.find((layer) => layer.title === layerTitle);
         featureLayer.opacity = 1;
         featureLayer.popupEnabled = false;
 
         if (featureLayer) {
 
           view.whenLayerView(featureLayer).then((layerView) => {
             reactiveUtils
               .whenOnce(() => !layerView.updating)
               .then(() => {
                 generateRenderer();
               });
           });
           
           // SET COLOR THEME //
           const riskColor =["#FFFDFB", "#F5C5AB", "#E19884", "#DB6857", "#C93636"];
           const susceptibilityColor =["#FFFDFB", "#FFF1E2", "#FEDCBA", "#FCB16C", "#F78721"];
           const exposureColor =["#FCFBFD", "#EDE8F4", "#CFC4E0", "#A68FC5", "#75559B"];
           const mitigationColor =["#FEFDFB", "#F2E7D9", "#DCC19D", "#C08F4E", "#966C36"];
 
           const generateRenderer = (thematicField) => {
             const fieldSelect = thematicField || "N_RI";
   
             const params = {
               layer: featureLayer,
               view: view,
               field: fieldSelect,              
               classificationMethod: "natural-breaks",
               numClasses: 5,
               defaultSymbolEnabled: false
             };
   
             // WHEN THE PROMISE RESOLVES, APPLY THE RENDERER TO THE LAYER //
             colorRendererCreator.createClassBreaksRenderer(params)
               .then((rendererResponse) => {
                 const newRenderer = rendererResponse.renderer;
                 newRenderer.backgroundFillSymbol = {
                   type: "simple-fill",
                   outline: {
                     width: 1,
                     color: "gray"
                   }
                 };
                 const breakInfos = newRenderer.classBreakInfos;
                 const breakInfosLength = breakInfos.length;
 
                 breakInfos[0].label = `Very Low Risk (${breakInfos[0].minValue} - ${breakInfos[0].maxValue})`
                 breakInfos[1].label = `Low Risk (${breakInfos[1].minValue} - ${breakInfos[1].maxValue})`
                 breakInfos[2].label = `Medium Risk (${breakInfos[2].minValue} - ${breakInfos[2].maxValue})`
                 breakInfos[3].label = `High Risk (${breakInfos[3].minValue} - ${breakInfos[3].maxValue})`
                 breakInfos[4].label = `Very High Risk (${breakInfos[4].minValue} - ${breakInfos[4].maxValue})`
 
                 const assignColorToClassBreaksRenderer = (nClass, colorList) => {
                   for (let i = 0; i < nClass; i++) {
                     breakInfos[i].symbol.color = colorList[i];
                   }
                 };
                 // ASSIGN INFORM RISK COLOR AS DEFAULT //
                 assignColorToClassBreaksRenderer(breakInfosLength, riskColor);
 
                 switch (thematicField) {
                   case "N_RI":
                     assignColorToClassBreaksRenderer(breakInfosLength, riskColor);
                     break;
                   case "N_H":
                     assignColorToClassBreaksRenderer(breakInfosLength, susceptibilityColor);
                     break;
                   case "N_E":
                     assignColorToClassBreaksRenderer(breakInfosLength, exposureColor);
                     break;
                   case "N_PV":
                     assignColorToClassBreaksRenderer(breakInfosLength, mitigationColor);
                 }
                 featureLayer.renderer = newRenderer;
               });
           }
 
           const thematicDisplay = document.getElementById("thematic-display");
           thematicDisplay.addEventListener('calciteChipGroupSelect', (evt) => {
             const thematicField = evt.target.selectedItems[0].value;
               switch (thematicField) {
                 case "risk":
                   generateRenderer("N_RI");
                   break;
                 case "Hazard Index":
                   generateRenderer("N_H");
                   break;
                 case "Physical vulnerability":
                   generateRenderer("N_PV");
                   break;
                 case "Exposure":
                   generateRenderer("N_Exposure");
               }
           });
           thematicDisplay.loading = false;
           
         } else {
           this.displayError({
             name: `Can't Find Layer`,
             message: `The layer '${layerTitle}' can't be found in this map.`,
           });
         }
       });
     }
   }
 
   /**
    *
    * @param view
    */
   initializeMapAction({view}) {
     if (view) {
       require([
         "esri/core/reactiveUtils"
       ], (reactiveUtils) => {
 
         // FEATURE LAYER //
         const layerTitle = "Risk_Index";
         const featureLayer = view.map.allLayers.find((layer) => layer.title === layerTitle);
 
         if (featureLayer) {
 
           let highlightHandle = null;
 
           view.whenLayerView(featureLayer).then((layerView) => {
             reactiveUtils
               .whenOnce(() => !layerView.updating)
               .then(() => {
 
                 view.on("click", (event) => {
                     view.hitTest(event, {include: featureLayer}).then((response) => {
 
                       // ONLY GET THE GRAPHICS RETURNED FROM FEATURELAYER //
                       const graphicHits = response.results?.filter((hitResult) => 
                         hitResult.type === "graphic" && hitResult.graphic.layer === featureLayer
                       );
                       if (graphicHits?.length > 0) {
                         let feature = graphicHits[0].graphic;
 
                         // HIGHLIGHT CLICKED FEATURE //
                         if (highlightHandle) {
                           highlightHandle.remove();
                           highlightHandle = null;
                         }
                         highlightHandle = layerView.highlight(feature);
                         this.updateCharts(feature);
                         this.updateDetails(feature, layerView);
                         document.getElementById("panel-chart-end").collapsed = false;
                         document.getElementById("panel-stats-end").collapsed = false;
 
                       } else {
                           this.clearCharts()
                           this.clearDetails(view, layerView);
                           document.getElementById("panel-chart-end").collapsed = true;
                           document.getElementById("panel-stats-end").collapsed = true;
 
                           // CLEAR HIGHLIGHT //
                           if (highlightHandle) {
                             highlightHandle.remove();
                             highlightHandle = null;
                           }
                       }
 
                     })
                     .catch((error) => {
                       if (error.name !== "AbortError") {
                         console.error(error);
                       }
                     });
                 });
               });
           });        
           
         } else {
           this.displayError({
             name: `Can't Find Layer`,
             message: `The layer '${layerTitle}' can't be found in this map.`,
           });
         }
       });
     }
   }
 
   /**
    *
    * @param view
    */
   initializeRank({view}) {
     if (view) {
       
       const numberFormatter = new Intl.NumberFormat('en-US');
 
       // FEATURE LAYER //
       const layerTitle = "Risk_Index";
       const featureLayer = view.map.allLayers.find(layer => layer.title === layerTitle);
       if (featureLayer) {
         featureLayer.load().then(() => {
           featureLayer.set({ outFields: ["*"] });
 
           // GET NUMBER OF ALL FEATURES FROM THE SERVICE AND USE THE COUNT //
           // TO SET THE NUMBER OF PAGES IN THE CALCITE-PAGINATION COMPONENT //            
           featureLayer.queryFeatureCount().then((featureCount) => {
             document.getElementById("tablePager").setAttribute("total-items", featureCount);
           });
 
           const adminRankResultNode = document.getElementById("admin-rank-results");
           let page = 0;
           let graphics;
           let highlight;
 
           const updateRankList = async (rankField) => {
 
             let selectRankField = rankField || "N_RI";
 
             // GET THE INSTANCE OF THE LAYERVIEW REPRESENTING THE COUNTIES FEATURE LAYER //
             const layerView = await view.whenLayerView(featureLayer);
 
             const queryPage = async (page) => {
               const query = {
                 start: page,
                 num: 10,
                 outFields: ["*"],
                 returnGeometry: true,
                 orderByFields: [`${selectRankField} DESC`]
               };
               const featureSet = await featureLayer.queryFeatures(query)
               convertFeatureSetToRows(featureSet, query);
               adminRankResultNode.loading = false;
             }
 
             const convertFeatureSetToRows = (featureSet) => {
               adminRankResultNode.innerHTML = "";
               graphics = featureSet.features;
               graphics.forEach((feature, index) => {
                 const riskInfo = `Score: ${feature.getAttribute(selectRankField)} out of 1`
                 const adminName = `${feature.getAttribute("NAME_1")}, ${feature.getAttribute("NAME_2")}`;
 
                 const itemButton = document.createElement("button");
                 itemButton.className = "item-button";
                 const itemCard = document.createElement("calcite-card");
                 itemButton.appendChild(itemCard);
 
                 const title = document.createElement("span");
                 title.slot = "title";
                 title.innerText = riskInfo;
                 itemCard.appendChild(title);
 
                 const summary = document.createElement("span");
                 summary.slot = "subtitle";
                 summary.innerText = adminName;
                 itemCard.appendChild(summary);
 
                 const chipState = document.createElement("calcite-chip");
                 chipState.slot = "footer-start";
                 chipState.scale = "s";
                 chipState.icon = "group";
                 chipState.innerText = numberFormatter.format(feature.getAttribute("population_at_risk"));
                 itemCard.appendChild(chipState);
 
                 const chip = document.createElement("calcite-chip");
                 chip.icon = "locator";
                 chip.slot = "footer-end";
                 chip.scale = "s";
                 chip.innerText = numberFormatter.format(feature.getAttribute("buildings_at_risk"));
                 itemCard.appendChild(chip);
 
                 adminRankResultNode.appendChild(itemButton);
               });
             }
 
             // FETCH THE FIRST 10 ADMINS THAT HAVE THE HIGHEST RISK SCORE //
             queryPage(page);
 
             // USER CLICKED ON THE PAGE NUMBER ON THE CALCITE-PAGINATION //
             document.getElementById("tablePager").addEventListener("calcitePaginationChange", (event) => {
                 adminRankResultNode.loading = true
                 if (event.target.startItem === 1) {
                   page = 0;
                 } else {
                   page = event.target.startItem;
                 }
                 queryPage(page);
             });
 
           }
 
           const selectRankScore = document.getElementById("selectRankScore");
           selectRankScore.addEventListener("calciteRadioButtonGroupChange", () => {
             const rankField = selectRankScore.selectedItem.value;
             switch (rankField) {
               case "risk-rank":
                 updateRankList("risk_score");
                 break;
               case "susceptibility-rank":
                 updateRankList("susceptibility_score");
                 break;
               case "population-rank":
                 updateRankList("population_at_risk");
             }
           });
 
           updateRankList();
 
         });
 
       } else {
         this.displayError({
           name: `Can't Find Layer`,
           message: `The layer '${layerTitle}' can't be found in this map.`,
         });
       }
     }
   }
 }
 
 export default new Application();