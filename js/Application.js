import AppBase from "./support/AppBase.js";
import AppLoader from "./loaders/AppLoader.js";
import SignIn from "./apl/SignIn.js";
import ViewLoading from "./apl/ViewLoading.js";
import MapScale from './apl/MapScale.js';
import { createBarChart } from "./apl/CreateChart.js";
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
        // PORTAL //
        this.portal = portal;

        // SET APPLICATION DETAILS //
        this.setApplicationDetails({map, group});

        // VIEW SHAREABLE URL PARAMETERS //
        this.initializeViewShareable({view});

        // USER SIGN-IN //
        this.configUserSignIn();

        // APPLICATION //
        this.applicationReady({portal, group, map, view}).catch(this.displayError).then(() => {
          // HIDE APP LOADER //
          document.getElementById('app-loader').toggleAttribute('hidden', true);
        });
      }).catch(this.displayError);
    }).catch(this.displayError);
  }

  /**
   * Initialize panel toggle functionality
   */
  initializePanelToggle() {
    const actionBar = document.getElementById('side-panel-action-bar');
    const panels = document.querySelectorAll('.toggle-panel');
    
    actionBar.addEventListener('click', (event) => {
      const action = event.target.closest('calcite-action');
      if (!action) return;
      
      const panelName = action.dataset.toggle;
      if (!panelName) return;
      
      // Hide all panels first
      panels.forEach(panel => {
        panel.hidden = true;
      });
      
      // Show the selected panel
      const targetPanel = document.querySelector(`.toggle-panel[data-toggle="${panelName}"]`);
      if (targetPanel) {
        targetPanel.hidden = false;
      }
      
      // Ensure the shell panel is expanded when an action is clicked
      const shellPanel = document.querySelector('calcite-shell-panel[slot="panel-start"]');
      shellPanel.collapsed = false;
    });
    
    // Add click handler for close buttons
    document.querySelectorAll('.toggle-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        const panelName = closeBtn.dataset.toggle;
        const targetPanel = document.querySelector(`.toggle-panel[data-toggle="${panelName}"]`);
        if (targetPanel) {
          targetPanel.hidden = true;
        }
      });
    });
  }

  /**
   * Initialize panel state management
   */
  initializePanelState() {
    const leftPanel = document.querySelector('calcite-shell-panel[slot="panel-start"]');
    const rightStatsPanel = document.getElementById('panel-stats-end');
    
    //Check screen size and set initial state
    const isMoble = window.matchMedia('max-width: 768px').matches;

    // Load saved states from localStorage
    const leftPanelCollapsed = localStorage.getItem('leftPanelCollapsed') === 'true';
    const rightStatsCollapsed = localStorage.getItem('rightStatsCollapsed') !== 'false';
    
    leftPanel.collapsed = leftPanelCollapsed;
    rightStatsPanel.collapsed = rightStatsCollapsed;
    
    // Save states when changed
    leftPanel.addEventListener('calciteShellPanelToggle', () => {
      localStorage.setItem('leftPanelCollapsed', leftPanel.collapsed);
    });
    
    rightStatsPanel.addEventListener('calciteShellPanelToggle', () => {
      localStorage.setItem('rightStatsCollapsed', rightStatsPanel.collapsed);
    });

    //Handle window resize
    window.addEventListener('resize', () => {
      const isNowMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isNowMobile !== isMoble) {
        leftPanel.collapsed = isNowMobile;
        rightStatsPanel.collapsed = isNowMobile;
      }
    });
  }

  /**
   * Configure user sign-in
   */
  configUserSignIn() {
    const signInContainer = document.getElementById("sign-in-container");
    if (signInContainer) {
      const signIn = new SignIn({container: signInContainer, portal: this.portal});
    }
  }

  /**
   * Configure the map view
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
              fillOpacity: 0,
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
            visibleElements: {
              statusIndicators: true,
              legends: false
            },
            listItemCreatedFunction: (evt) => {
              const item = evt.item;
              if (item.layer.type !== "group") {
                item.panel = {
                  content: "legend",
                  className: "esri-icon-legend",
                  title: "Legend"
                };
                
                item.actionsSections = [{
                  title: "Layer options",
                  items: [{
                    title: "Opacity",
                    className: "esri-icon-sliders-horizontal",
                    id: "opacity"
                  }]
                }];
              }
            }
          });

          // Handle opacity actions
          layerList.on("trigger-action", (event) => {
            if (event.action.id === "opacity") {
              const slider = new Slider({
                min: 0,
                max: 100,
                values: [event.item.layer.opacity * 100],
                container: document.createElement("div")
              });

              view.ui.add(slider, "top-right");
              
              slider.on("thumb-drag", () => {
                event.item.layer.opacity = slider.values[0] / 100;
              });
              
              slider.on("thumb-change", () => {
                view.ui.remove(slider);
              });
            }
          });

          // LEGEND //
          const legendPanel = new Legend({
            container: "legend-container",
            view: view,
          });

          // LEGEND ON MAP //
          const riskLayer = view.map.allLayers.find((layer) => layer.title === 'INDEX_INFO');
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
          const basemapGallery = new BasemapGallery({
            view: view, 
            container: 'basemap-gallery-container',
            source: {
              query: {
                title: '"World Basemaps for Developers" AND owner:esri'
              }
            }
          });

          // VIEW LOADING INDICATOR //
          const viewLoading = document.createElement('apl-viewloading');
          viewLoading.view = view;
          view.ui.add(viewLoading, "bottom-right");

          resolve();
        });
      } else { resolve(); }
    });
  }

  /**
   * Initialize upload data functionality
   */
  initializeUploadData({ portal, map, view }) {
    const uploadForm = document.getElementById('uploadForm');
    const inFile = document.getElementById('inFile');
    const uploadBtn = document.getElementById('upload-btn');
    const removeBtn = document.getElementById('remove-btn');
    const uploadLoader = document.getElementById('upload-loader');
    const appAddData = document.getElementById('app-add-data');
    
    // Store uploaded layers
    let uploadedLayers = [];
    
    // Enable/disable upload button based on file selection
    inFile.addEventListener('change', (event) => {
      uploadBtn.disabled = !event.target.files.length;
    });
    
    // Upload button click handler
    uploadBtn.addEventListener('click', async () => {
      const file = inFile.files[0];
      if (!file) return;
      
      try {
        // Show loading state
        uploadLoader.hidden = false;
        uploadBtn.disabled = true;
        removeBtn.disabled = true;
        
        // Process the file
        const result = await uploadData(portal, map, view, file);
        
        // Store the uploaded layers
        uploadedLayers = result.layers;
        
        // Show success message
        appAddData.slot = 'title';
        appAddData.slot = 'message';
        appAddData.icon = 'upload';
        appAddData.kind = 'success';
        appAddData.message = 'Data uploaded successfully!';
        appAddData.autoClose = true;
        appAddData.open = true;
        
        // Reset form
        uploadForm.reset();
        uploadBtn.disabled = true;
        removeBtn.disabled = false;
      } catch (error) {
        appAddData.kind = 'danger';
        appAddData.message = `Upload failed: ${error.message}`;
        appAddData.open = true;
      } finally {
        uploadLoader.hidden = true;
        uploadBtn.disabled = false;
        removeBtn.disabled = false;
      }
    });
    
    // Remove button click handler
    removeBtn.addEventListener('click', () => {
      try {
        if (uploadedLayers.length > 0) {
          // Show loading state
          uploadLoader.hidden = false;
          removeBtn.disabled = true;
          
          // Remove all uploaded layers
          map.removeMany(uploadedLayers);
          uploadedLayers = [];
          
          // Show success message
          appAddData.kind = 'success';
          appAddData.message = 'Uploaded data removed successfully!';
          appAddData.autoClose = true;
          appAddData.open = true;
          
          // Reset form
          uploadForm.reset();
          uploadBtn.disabled = true;
        } else {
          appAddData.kind = 'warning';
          appAddData.message = 'No uploaded data to remove';
          appAddData.open = true;
        }
      } catch (error) {
        appAddData.kind = 'danger';
        appAddData.message = `Failed to remove data: ${error.message}`;
        appAddData.open = true;
      } finally {
        uploadLoader.hidden = true;
        removeBtn.disabled = false;
      }
    });
  }

  /**
   * Initialize charts (only bar chart)
   */
  initializeCharts() {
    // DIMENSIONS BAR CHART //
    const dimensionsChartNode = document.getElementById("dimensions-bar-chart");
    this.barChart = createBarChart(dimensionsChartNode);


    /**
     * Clear chart data
     */
    this.clearCharts = () => {
      this.barChart.clearData();
    };

    /**
     * Update chart with feature data
     */
    this.updateCharts = (feature) => {
      if (!feature) {
        this.clearCharts();
        return;
      }

      //Get Values 
      const hazardValue = feature.getAttribute("Hazard") || 0;
      const vulnerabilityValue = feature.getAttribute("Vulnerabil") || 0;
      const exposureValue = feature.getAttribute("Exposure") || 0;

      //Update charts
      this.barChart.updateData([hazardValue, vulnerabilityValue,exposureValue ]);
    };
  }

  /**
   * Initialize display details functionality
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
        const layerTitle = "INDEX_INFO";
        const featureLayer = view.map.allLayers.find((layer) => layer.title === layerTitle);

        const adminNameNode = document.getElementById('admin-name');
        const adminTitleNode = adminNameNode.querySelector('[slot="title"]');
        const adminMessageNode = adminNameNode.querySelector('[slot="message"]');
        const adminDescriptiveNode = document.getElementById('admin-descriptive');

        const populationLabel = document.getElementById('total-population-label');
        const maleLabel = document.getElementById('male-population-label');
        const femaleLabel = document.getElementById('female-population-label');
        const householdLabel = document.getElementById('total-household-label');
        const key1Label = document.getElementById('key1-label');
        const key2Label = document.getElementById('key2-label');
        const key3Label = document.getElementById('key3-label');
        const key4Label = document.getElementById('key4-label');
        const key5Label = document.getElementById('key5-label');
        const key6Label = document.getElementById('key6-label');
        const key7Label = document.getElementById('key7-label');
        const key8Label = document.getElementById('key8-label');

        const createReportBtn = document.getElementById("create-report-btn");

        /**
         * Clear details display
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
          populationLabel.innerHTML = "-.-";
          maleLabel.innerHTML = "-.-";
          femaleLabel.innerHTML = "-.-";
          householdLabel.innerHTML = "-.-";
          key1Label.innerHTML = "-.-";
          key2Label.innerHTML = "-.-";
          key3Label.innerHTML = "-.-";
          key4Label.innerHTML = "-.-";
          key5Label.innerHTML = "-.-";
          key6Label.innerHTML = "-.-";
          key7Label.innerHTML = "-.-";
          key8Label.innerHTML = "-.-";
          createReportBtn.setAttribute('href','');
        };

        /**
         * Update details with feature data
         */
        this.updateDetails = (feature, layerView) => {
          // APPLY EFFECTS TO SELECTED FEATURE //
          layerView.featureEffect = {
            filter: {
              where: `ID_2 = ${feature.getAttribute("ID_2")}`
            },
            excludedLabelsVisible: true,
            includedEffect: "opacity(30%)",
          };

          // ZOOM TO SELECTED ADMIN //
          view.goTo({
              center: feature.geometry.extent,
              center: feature.geometry.centroid,
              zoom: 11
            },{
              animate: true,
              duration: 1000
            }
          );

          //Get the risk score 
          const riskScore = feature.getAttribute("Risk")

          //Classify the risk into 5 categories
          let riskClass;
          if (riskScore <= 0.2) riskClass = "Very Low";
          else if (riskScore <= 0.4) riskClass = "Low";
          else if (riskScore <= 0.6) riskClass = "Moderate";
          else if (riskScore <= 0.8) riskClass = "High";
          else riskClass = "Very High";

          //Convert risk score to scale
          const riskScoureOutof10 = (riskScore*9+1).toFixed(1);

          // UPDATE RISK SCORE AND ADMIN NAME//
          adminTitleNode.innerHTML = `Risk Index is <b>${riskClass}</b> (Score: <b>${riskScoureOutof10}</b> out of 10)`
          let adminName = [];
          adminName.push(feature.getAttribute("NAME_2"));
          adminName.push(feature.getAttribute("NAME_1"));
          adminMessageNode.innerHTML = adminName.join(", ");

          // UPDATE KEY INDICATORS //
          adminDescriptiveNode.innerHTML = `The risk index rating is <b>${riskClass} (Score: ${riskScoureOutof10} out of 10)</b> for <b>${adminName.slice(0, 3).join(", ")}</b> when compared to the rest of the gewogs in ${feature.getAttribute("NAME_1")}.`
          populationLabel.innerHTML = numberFormatter.format(feature.getAttribute("Total_popu"));
          maleLabel.innerHTML = numberFormatter.format(feature.getAttribute("Male"));
          femaleLabel.innerHTML = numberFormatter.format(feature.getAttribute("Female"));
          householdLabel.innerHTML = numberFormatter.format(feature.getAttribute("Total_HH"));

          let hasValue = (val) =>  val ? val.toFixed(2) : "NoData"; 
          key1Label.innerHTML = hasValue(feature.getAttribute("Age___5"));
          key2Label.innerHTML = hasValue(feature.getAttribute("Age__65"));
          key3Label.innerHTML = hasValue(feature.getAttribute("HH_WOE"));
          key4Label.innerHTML = hasValue(feature.getAttribute("WO_Net_Mob"));
          key5Label.innerHTML = hasValue(feature.getAttribute("key5"));
          key6Label.innerHTML = hasValue(feature.getAttribute("key6"));
          key7Label.innerHTML = hasValue(feature.getAttribute("key7"));
          key8Label.innerHTML = hasValue(feature.getAttribute("key8"));

          // UPDATE REPORT LINK //
          createReportBtn.setAttribute('href', `./report/?id=${feature.getAttribute("ID_2")}`);
        };
      });
    }
  }

  /**
   * Initialize map display functionality
   */
  initializeMapDisplay({view}) {
    if (view) {
      require([
        "esri/core/reactiveUtils",
        "esri/smartMapping/renderers/color",
      ], (reactiveUtils, colorRendererCreator) => {
        // FEATURE LAYER //
        const layerTitle = "INDEX_INFO";
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
          const hzColor =["#FFFDFB", "#FFF1E2", "#FEDCBA", "#FCB16C", "#F78721"];
          const vuColor =["#FCFBFD", "#EDE8F4", "#CFC4E0", "#A68FC5", "#75559B"];
          const ccColor =["#F0F8FF", "#C2E0FF", "#7EB8FF", "#3A8CFF", "#0062CC"];

          const generateRenderer = (thematicField) => {
            let fieldSelect = thematicField || "Risk";
  
            const params = {
              layer: featureLayer,
              view: view,
              field: fieldSelect,              
              classificationMethod: "natural-breaks",
              numClasses: 5,
              defaultSymbolEnabled: false
            };
  
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
                  case "Risk":
                    assignColorToClassBreaksRenderer(breakInfosLength, riskColor);
                    break;
                  case "Hazard":
                    assignColorToClassBreaksRenderer(breakInfosLength, hzColor);
                    break;
                  case "Vulnerabil":
                    assignColorToClassBreaksRenderer(breakInfosLength, vuColor);
                    break;
                  case "Exposure":
                    assignColorToClassBreaksRenderer(breakInfosLength, ccColor);
                }
                featureLayer.renderer = newRenderer;
              });
          }

          const thematicDisplay = document.getElementById("thematic-display");
          thematicDisplay.addEventListener('calciteChipGroupSelect', (evt) => {
            const thematicField = evt.target.selectedItems[0].value;
              switch (thematicField) {
                case "risk":
                  generateRenderer("Risk");
                  break;
                case "hz":
                  generateRenderer("Hazard");
                  break;
                case "vu":
                  generateRenderer("Vulnerabil");
                  break;
                case "ep":
                  generateRenderer("Exposure");
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
   * Initialize map action functionality
   */
  initializeMapAction({view}) {
    if (view) {
      require([
        "esri/core/reactiveUtils"
      ], (reactiveUtils) => {
        // FEATURE LAYER //
        const layerTitle = "INDEX_INFO";
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
                        
                        // Ensure left panel is visible
                        const leftPanel = document.querySelector('calcite-shell-panel[slot="panel-start"]');
                          if (leftPanel.collapsed) {
                          leftPanel.collapsed = false;
                        }

                        // HIGHLIGHT CLICKED FEATURE //
                        if (highlightHandle) {
                          highlightHandle.remove();
                          highlightHandle = null;
                        }
                        highlightHandle = layerView.highlight(feature);
                        this.updateCharts(feature);
                        this.updateDetails(feature, layerView);
                        document.getElementById("panel-stats-end").collapsed = false;

                      } else {
                          this.clearCharts()
                          this.clearDetails(view, layerView);
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
   * Initialize ranking functionality
   */
  initializeRank({view}) {
    if (view) {
      const numberFormatter = new Intl.NumberFormat('en-US');

      // FEATURE LAYER //
      const layerTitle = "INDEX_INFO";
      const featureLayer = view.map.allLayers.find(layer => layer.title === layerTitle);
      if (featureLayer) {
        featureLayer.load().then(() => {
          featureLayer.set({ outFields: ["*"] });

          // GET NUMBER OF ALL FEATURES FROM THE SERVICE AND USE THE COUNT //            
          featureLayer.queryFeatureCount().then((featureCount) => {
            document.getElementById("tablePager").setAttribute("total-items", featureCount);
          });

          const adminRankResultNode = document.getElementById("admin-rank-results");
          let page = 0;
          let graphics;
          let highlight;

          const updateRankList = async (rankField) => {
            let selectRankField = rankField || "Risk";

            // GET THE INSTANCE OF THE LAYERVIEW //
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
                const riskInfo = `Score: ${(feature.getAttribute(selectRankField)*9+1).toFixed(1)} out of 10`
                const adminName = `${feature.getAttribute("NAME_2")}, ${feature.getAttribute("NAME_1")}`;

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
                chipState.innerText = numberFormatter.format(feature.getAttribute("Total_popu"));
                itemCard.appendChild(chipState);

                const chip = document.createElement("calcite-chip");
                chip.icon = "locator";
                chip.slot = "footer-end";
                chip.scale = "s";
                chip.innerText = numberFormatter.format(feature.getAttribute("Total_HH"));
                itemCard.appendChild(chip);

                adminRankResultNode.appendChild(itemButton);
              });
            }

            // FETCH THE FIRST 10 ADMINS //
            queryPage(page);

            // USER CLICKED ON THE PAGE NUMBER //
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
                updateRankList("Risk");
                break;
              case "hz-rank":
                updateRankList("Hazard");
                break;
              case "vu-rank":
                updateRankList("Vulnerabil");
                break;
              case "ep-rank":
                updateRankList("Exposure");
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

  /**
   * Application ready handler
   */
  applicationReady({ portal, group, map, view }) {
    return new Promise(async (resolve, reject) => {
      // VIEW READY //
      this.configView({view}).then(() => {
        // Initialize all components
        this.initializePanelToggle();
        this.initializePanelState();
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
}

export default new Application();