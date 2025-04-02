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

export const uploadData = (portal, map, view) => {
    require([
      'esri/request',
      'esri/layers/FeatureLayer',
      'esri/layers/support/Field',
      'esri/Graphic'
    ], (request, FeatureLayer, Field, Graphic) => {
      const portalUrl = portal.url;
      const appNotice = document.getElementById('app-notice');
      const noticeTitleNode = appNotice.querySelector('[slot="title"]');
      const noticeMessageNode = appNotice.querySelector('[slot="message"]');

      const appAddData = document.getElementById('app-add-data');
      const appAddDataTitleNode = appAddData.querySelector('[slot="title"]');
      const appAddDataMessageNode = appAddData.querySelector('[slot="message"]');
  
      const showError = (error) => {
        noticeTitleNode.innerHTML = error.name || 'Error';
        noticeMessageNode.innerHTML = error.message || JSON.stringify(error, null, 2) || 'Something went wrong...';
        appNotice.open = true;
        console.error(error);
      };
  
      const handleFileChange = (evt) => {
        const fileName = evt.target.value.toLowerCase();
  
        if (fileName.indexOf(".zip") !== -1) {
          generateFeatureCollection(fileName);
        } else {
          showError({
            name: `Unsupported File Type`,
            message: `Please ensure that you are uploading a valid shapefile in .zip format.`,
          });
        }
      };
  
      const generateFeatureCollection = (fileName) => {
        let name = fileName.split(".");
        name = name[0].replace("c:\\fakepath\\", "");
        console.log(`Loading: '${name}'`);
  
        const params = {
          name: name,
          targetSR: view.spatialReference,
          maxRecordCount: 1000,
          enforceInputFileSizeLimit: true,
          enforceOutputJsonSizeLimit: true,
          generalize: true,
          maxAllowableOffset: 10,
          reducePrecision: true,
          numberOfDigitsAfterDecimal: 0,
        };
  
        const myContent = {
          filetype: "shapefile",
          publishParameters: JSON.stringify(params),
          f: "json"
        };
  
        request(portalUrl + "/sharing/rest/content/features/generate", {
          query: myContent,
          body: document.getElementById("uploadForm"),
          responseType: "json"
        })
        .then((response) => {
          const layerName = response.data.featureCollection.layers[0].layerDefinition.name;
          console.log(`Loaded: '${layerName}'`);
          addShapefileToMap(response.data.featureCollection, layerName);
        })
        .catch(showError);
      };
  
      const addShapefileToMap = (featureCollection, layerName) => {
        let sourceGraphics = [];
  
        const layers = featureCollection.layers.map((layer) => {
          const graphics = layer.featureSet.features.map((feature) => {
            return Graphic.fromJSON(feature);
          });
          sourceGraphics = sourceGraphics.concat(graphics);
          const shapefileName = layer.layerDefinition.name;
          const featureLayer = new FeatureLayer({
            title: shapefileName,
            objectIdField: "FID",
            source: graphics,
            fields: layer.layerDefinition.fields.map((field) => {
              return Field.fromJSON(field);
            })
          });
          return featureLayer;
        });
  
        map.addMany(layers);
        view.goTo(sourceGraphics).catch((error) => {
          if (error.name !== "AbortError") {
            console.error(error);
          }
        });
        
        appAddDataTitleNode.innerHTML = `Data Added to Map`;
        appAddDataMessageNode.innerHTML = `The '${layerName}' layer has been successfully added to the map`;
        appAddData.open = true;
      };
  
      // Attach the file change event listener
      document.getElementById("uploadForm").addEventListener("change", handleFileChange);
    });
  }
  