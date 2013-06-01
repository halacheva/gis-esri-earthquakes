dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.dijit.AttributeInspector-all");
dojo.require("dojo.number");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.toolbars.draw");
dojo.require("esri.toolbars.edit");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.query");
dojo.require("esri.tasks.identify");

var ArcGis = {
  map : undefined,
  basemapGallery : undefined,
  locator : undefined,
  locatorErrorDivId : "search_error",
  drawToolbar : undefined,
  editToolbar : undefined,
  isEditToolbarActive : false,
  earthquakesLayer : undefined,
  queryUrl : "http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Earthquakes/Since_1970/MapServer/0",
  layerUrl : "http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Earthquakes/EarthquakesFromLastSevenDays/MapServer",
  featureLayerUrl : "http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Earthquakes/EarthquakesFromLastSevenDays/FeatureServer/0",
  locatorUrl : "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
  updateFeature : undefined,
  selectors : {
    name : "location",
    tsunami : "tsunami",
    magnitude : "magnitude",
    deaths : "deaths",
    injured : "injured",
    year : "year"
  },
  init : function() {
    esri.config.defaults.io.proxyUrl = "proxy.php";
    this.map = new esri.Map("map", {
      basemap : "streets",
      zoom : 2
    });

    this.locator = new esri.tasks.Locator(this.locatorUrl);
    this.basemapGallery = new esri.dijit.BasemapGallery({
      showArcGISBasemaps : true,
      map : this.map
    });

    this.earthquakesLayer = new esri.layers.ArcGISDynamicMapServiceLayer(this.layerUrl);
    this.earthquakesLayer.setDisableClientCaching(true);
    this.map.addLayer(this.earthquakesLayer);

    this.earthquakesFeatureLayer = new esri.layers.FeatureLayer(this.featureLayerUrl, {
      mode : esri.layers.FeatureLayer.MODE_SELECTION,
      outFields : ["*"]
    });
    this.map.addLayer(this.earthquakesFeatureLayer);

    dojo.connect(this.earthquakesFeatureLayer, "onEditsComplete", function() {
      ArcGis.earthquakesLayer.refresh();
    });
    dojo.connect(this.map.infoWindow, "onHide", function() {
      ArcGis.earthquakesFeatureLayer.clearSelection();
      dojo.query(".contentPane").style("height", "100%");
    });

    this.map.identifyUrl = this.layerUrl;
    this.map.mapOnClick = dojo.connect(this.map, "onClick", this._identifyFeature);

    this.drawToolbar = new esri.toolbars.Draw(this.map);
    dojo.connect(this.drawToolbar, "onDrawEnd", this._onDrawEnd);
    this.map.drawToolbar = this.drawToolbar;

    dojo.connect(this.map, "onDblClick", this._onPolygonDblClick);

  },
  locate : function(query) {
    this.map.infoWindow.hide();
    dojo.connect(this.locator, "onAddressToLocationsComplete", ArcGisTemplateHelper.geocoderTemplate);

    this.map.graphics.graphics.forEach(function(g) {
      if (g.attributes != undefined && g.attributes.type == "location") {
        g.hide();
      }
    });

    var address = {
      "SingleLine" : query
    };
    this.locator.outSpatialReference = this.map.spatialReference;
    var options = {
      address : address,
      outFields : ["Loc_name"]
    }
    this.locator.addressToLocations(options);
  },
  changeBasemap : function(basemapId) {
    this.basemapGallery.select(basemapId);
  },
  toggleLayerVisiblity : function() {
    this.map.infoWindow.hide();
    if (this.earthquakesLayer.visible) {
      this.earthquakesLayer.hide();
    } else {
      this.earthquakesLayer.show();
    }
  },
  clearMap : function() {
    this.map.infoWindow.hide();
    this.map.graphics.clear();
  },
  _identifyFeature : function(event) {
    if (!ArcGis.isEditToolbarActive) {
      var identifyTask = new esri.tasks.IdentifyTask(this.identifyUrl);
      var identifyParams = new esri.tasks.IdentifyParameters();
      identifyParams.tolerance = 3;
      identifyParams.returnGeometry = true;
      identifyParams.layerIds = [0];
      identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
      identifyParams.width = this.width;
      identifyParams.height = this.height;
      identifyParams.geometry = event.mapPoint;
      identifyParams.mapExtent = this.extent;

      ArcGisTemplateHelper.attributeInspectorTemplate();
      identifyTask.execute(identifyParams, ArcGisTemplateHelper.earthquakeSevenDaysTemplate);
    }
  },
  find : function(region) {
    this.map.infoWindow.hide();
    this.map.graphics.graphics.forEach(function(g) {
      if (g.geometry.type == "polygon") {
        g.hide();
      }
    });
    var findTask = new esri.tasks.FindTask(this.layerUrl);
    var findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = [0];
    findParams.searchFields = ["Region"];
    findParams.outSpatialReference = this.map.spatialReference;
    findParams.searchText = region;
    findTask.execute(findParams, ArcGisTemplateHelper.findByRegionTemplate);
  },
  draw : function() {
    this.map.infoWindow.hide();
    this.map.graphics.graphics.forEach(function(g) {
      if (g.geometry.type == "polygon" || (g.attributes != undefined && g.attributes.type == 'earthquake')) {
        g.hide();
      }
    });
    dojo.disconnect(this.map.mapOnClick);
    this.drawToolbar.activate(esri.toolbars.Draw.POLYGON);
  },
  _onDrawEnd : function(geometry) {
    var symbol = new esri.symbol.SimpleFillSymbol();
    this.map.drawToolbar.deactivate();
    var graphic = new esri.Graphic(geometry, symbol);
    this.map.graphics.add(graphic);
    this.map.mapOnClick = dojo.connect(this.map, "onClick", ArcGis._identifyFeature);
    this.map.queryGeometry = esri.geometry.webMercatorToGeographic(geometry);
    ArcGis.editToolbar = new esri.toolbars.Edit(this.map);
  },
  analyze : function() {
    if (this.isEditToolbarActive) {
      alert("Please, finish the editing before the anlysis.");
      return;
    }
    this.map.infoWindow.hide();
    var queryTask = new esri.tasks.QueryTask(this.queryUrl);
    var query = new esri.tasks.Query();
    if (this.map.queryGeometry != null) {
      query.geometry = this.map.queryGeometry;
    }

    var re = new RegExp(/^[0-9]{4}$/);
    var name = dojo.byId(this.selectors.name).value.toUpperCase();
    var tsunami = (dojo.byId(this.selectors.tsunami).checked) ? " AND Tsu = 'Tsu' " : " ";
    var magnitude = (Number(dojo.byId(this.selectors.magnitude).value)) ? dojo.byId(this.selectors.magnitude).value : 0;
    var deaths = (Number(dojo.byId(this.selectors.deaths).value)) ? dojo.byId(this.selectors.deaths).value : 0;
    var injured = (Number(dojo.byId(this.selectors.injured).value)) ? dojo.byId(this.selectors.injured).value : 0;
    var year = (re.test(dojo.byId(this.selectors.year).value)) ? dojo.byId(this.selectors.year).value : "";

    var where = "Name LIKE '%" + name + "%'" + tsunami + "AND Magnitude >= " + magnitude + " AND Num_Deaths >= " + deaths + " " + "AND Num_Injured >= " + injured + " AND YYYYMMDD LIKE '%" + year + "%'";
    query.where = where;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.outSpatialReference = new esri.SpatialReference({
      wkid : 102100
    });

    this.map.graphics.graphics.forEach(function(g) {
      if (g.attributes != undefined && g.attributes.type == "earthquake") {
        g.hide();
      }
    });

    queryTask.execute(query, ArcGisTemplateHelper.earthquakeTemplate);
  },
  _onPolygonDblClick : function(evt) {
    if (ArcGis.editToolbar != undefined && evt.graphic != undefined && evt.graphic.geometry.type == "polygon") {
      dojo.stopEvent(evt);
      if (ArcGis.isEditToolbarActive) {
        ArcGis.editToolbar.deactivate();
        ArcGis.isEditToolbarActive = false;
        ArcGis.map.queryGeometry = esri.geometry.webMercatorToGeographic(evt.graphic.geometry);
        ArcGis.map.mapOnClick = dojo.connect(ArcGis.map, "onClick", ArcGis._identifyFeature);
      } else {
        ArcGis.activateEditToolbar(evt.graphic);
        ArcGis.isEditToolbarActive = true;
        dojo.disconnect(ArcGis.map.mapOnClick);
      }
    }
  },
  activateEditToolbar : function(graphic) {
    var tool = 0;
    tool = tool | esri.toolbars.Edit.MOVE;
    tool = tool | esri.toolbars.Edit.EDIT_VERTICES;
    tool = tool | esri.toolbars.Edit.SCALE;
    tool = tool | esri.toolbars.Edit.ROTATE;
    tool = tool | esri.toolbars.Edit.EDIT_VERTICES;
    var options = {
      allowAddVertices : true,
      allowDeleteVertices : true,
      uniformScaling : true
    };

    ArcGis.editToolbar.activate(tool, graphic, options);
  }
}

var ArcGisTemplateHelper = {
  attributeInspectorTemplate : function() {
    layerInfos = [{
      'featureLayer' : ArcGis.earthquakesFeatureLayer,
      'showAttachments' : false,
      'isEditable' : true,
      'fieldInfos' : [{
        'fieldName' : 'region',
        'isEditable' : true,
        'tooltip' : 'Edit region here',
        'label' : 'Region:'
      }, {
        'fieldName' : 'magnitude',
        'isEditable' : true,
        'tooltip' : 'Edit magnitude here',
        'label' : 'Magnitude:'
      }, {
        'fieldName' : 'depth',
        'isEditable' : true,
        'tooltip' : 'Edit depth here',
        'label' : 'Depth:'
      }, {
        'fieldName' : 'datetime',
        'isEditable' : true,
        'tooltip' : 'Edit date here',
        'label' : 'Date:'
      }]
    }];
    attInspector = new esri.dijit.AttributeInspector({
      layerInfos : layerInfos
    }, dojo.create("div"));

    //add a save button next to the delete button
    var saveButton = new dijit.form.Button({
      label : "Save",
      "class" : "saveButton"
    });
    dojo.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");

    dojo.connect(saveButton, "onClick", function() {
      ArcGis.updateFeature.getLayer().applyEdits(null, [ArcGis.updateFeature], null);
      alert("Feature edited successfuly");
    });

    dojo.connect(attInspector, "onAttributeChange", function(feature, fieldName, newFieldValue) {
      //store the updates to apply when the save button is clicked
      ArcGis.updateFeature.attributes[fieldName] = newFieldValue;
    });

    dojo.connect(attInspector, "onNext", function(feature) {
      ArcGis.updateFeature = feature;
    });

    dojo.connect(attInspector, "onDelete", function(feature) {
      feature.getLayer().applyEdits(null, null, [feature]);
      ArcGis.map.infoWindow.hide();
      alert("Feature deleted successfuly");
    });
    ArcGis.map.infoWindow.setContent(attInspector.domNode);
    ArcGis.map.infoWindow.resize(300, 300);
    dojo.query(".contentPane").style("height", "105px");
  },
  geocoderTemplate : function(candidates) {
    var candidate;
    var symbol = new esri.symbol.SimpleMarkerSymbol();
    var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");

    symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
    symbol.setColor(new dojo.Color([252, 2, 2, 0.75]));

    var geom;

    dojo.every(candidates, function(candidate) {
      if (candidate.score > 80) {
        var attributes = {
          type : "location",
          address : candidate.address,
          score : candidate.score,
          locatorName : candidate.attributes.Loc_name
        };
        geom = candidate.location;
        var graphic = new esri.Graphic(geom, symbol, attributes, infoTemplate);

        //add a graphic to the map at the geocoded location
        ArcGis.map.graphics.add(graphic);
        return false;
        //break out of loop after one candidate with score greater  than 80 is found.
      }
    });

    if (geom !== undefined) {
      ArcGis.map.centerAndZoom(geom, 6);
      ArcGis.map.infoWindow.resize(350, 200);
    } else {
      alert("Sorry, no location found :(");
    }
  },
  earthquakeTemplate : function(results) {
    var infoTemplate = new esri.InfoTemplate("Infomation", "<b>Location:</b> ${location}<br /><b>Magnitude:</b> ${magnitude}<br /><b>Damages (Millions &#36;):</b> ${damages}<br/><b>Number of Deaths:</b> ${deaths}<br/><b>Number of Injured:</b> ${injured}<br/><b>Number of damaged houses:</b> ${houses_damaged}<br/><b>Number of destroyed houses:</b> ${houses_destroyed}<br/><b>Tsunami: </b>${tsunami}<br/><b>Date: </b>${date}");
    if (results.features.length == 0) {
      alert("Sorry, no results found :(");
      return;
    }

    results.features.forEach(function(feature) {
      var symbol = new esri.symbol.SimpleMarkerSymbol();
      if (feature.attributes.Magnitude < 4.9) {
        symbol.setColor(new dojo.Color([245, 245, 0, 0.75]));
      } else if (feature.attributes.Magnitude < 5.9) {
        symbol.setColor(new dojo.Color([245, 163, 0, 0.75]));
      } else if (feature.attributes.Magnitude < 6.9) {
        symbol.setColor(new dojo.Color([245, 81, 0, 0.75]));
      } else {
        symbol.setColor(new dojo.Color([245, 0, 0, 0.75]));
      }

      var attributes = {
        type : "earthquake",
        location : feature.attributes.Name,
        magnitude : feature.attributes.Magnitude,
        damages : (feature.attributes.Mill_Damages) ? feature.attributes.Mill_Damages : "0 or unknown",
        deaths : (feature.attributes.Num_Deaths) ? feature.attributes.Num_Deaths : "0 or unknown",
        injured : (feature.attributes.Num_Injured) ? feature.attributes.Num_Injured : "0 or unknown",
        houses_damaged : (feature.attributes.Num_Houses_Dam) ? feature.attributes.Num_Houses_Dam : "0 or unknown",
        houses_destroyed : (feature.attributes.Num_Houses_Dest) ? feature.attributes.Num_Houses_Dest : "0 or unknown",
        tsunami : (feature.attributes.Tsu) ? "Yes" : "No",
        date : feature.attributes.YYYYMMDD.substring(6) + "-" + feature.attributes.YYYYMMDD.substring(4, 6) + "-" + feature.attributes.YYYYMMDD.substring(0, 4)
      };

      var graphic = new esri.Graphic(feature.geometry, symbol, attributes, infoTemplate);
      ArcGis.map.graphics.add(graphic);
    });
  },
  earthquakeSevenDaysTemplate : function(results) {
    if (results.length > 0) {
      var symbol = new esri.symbol.SimpleMarkerSymbol();
      symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE);
      var feature = results[0].feature;

      if (feature.attributes.Magnitude < 4.9) {
        symbol.setColor(new dojo.Color([245, 245, 0, 0.75]));
      } else if (feature.attributes.Magnitude < 5.9) {
        symbol.setColor(new dojo.Color([245, 163, 0, 0.75]));
      } else if (feature.attributes.Magnitude < 6.9) {
        symbol.setColor(new dojo.Color([245, 81, 0, 0.75]));
      } else {
        symbol.setColor(new dojo.Color([245, 0, 0, 0.75]));
      }
      ArcGis.earthquakesFeatureLayer.setSelectionSymbol(symbol);
      var selectQuery = new esri.tasks.Query();
      selectQuery.geometry = results[0].feature.geometry;
      ArcGis.earthquakesFeatureLayer.selectFeatures(selectQuery, esri.layers.FeatureLayer.SELECTION_NEW, function(features) {
        if (features.length > 0) {
          //store the current feature
          ArcGis.updateFeature = features[0];
          ArcGis.map.infoWindow.setTitle(features[0].getLayer().name);
          ArcGis.map.infoWindow.show(features[0].geometry, ArcGis.map.getInfoWindowAnchor(features[0].geometry));
        }
      });
    } else {
      alert("Sorry, no information found :(");
    }
  },
  findByRegionTemplate : function(results) {
    if (results.length > 0) {
      var multipoint = new esri.geometry.Multipoint(ArcGis.map.spatialReference);
      results.forEach(function(r) {
        multipoint.addPoint(r.feature.geometry);
      });
      var extent = multipoint.getExtent();
      var point1 = new esri.geometry.Point(extent.xmin, extent.ymin, ArcGis.map.spatialReference);
      var point2 = new esri.geometry.Point(extent.xmin, extent.ymax, ArcGis.map.spatialReference);
      var point3 = new esri.geometry.Point(extent.xmax, extent.ymax, ArcGis.map.spatialReference);
      var point4 = new esri.geometry.Point(extent.xmax, extent.ymin, ArcGis.map.spatialReference);
      var polygon = new esri.geometry.Polygon(ArcGis.map.spatialReference);
      polygon.addRing([point1, point2, point3, point4, point1]);
      var symbol = new esri.symbol.SimpleFillSymbol();
      var graphic = new esri.Graphic(polygon, symbol);
      ArcGis.map.graphics.add(graphic);
      ArcGis.map.setExtent(extent);
    } else {
      alert("Sorry, no results found :(");
    }
  }
}