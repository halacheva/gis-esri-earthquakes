dojo.ready(function() {
  // init arcgis map
  ArcGis.init();
  dojo.query("ul#menu").on("click", clickOnMenuItem);
  dojo.query("span#search_button").on("click", function(e) {
    ArcGis.locate(dojo.byId("search_query").value);
  });
  dojo.query("li#change_map span.button").on("click", function(e) {
    dojo.query("li#change_map span").removeClass("current-map");
    this.className = "button current-map";
    ArcGis.changeBasemap(this.attributes["data-basemap-id"].value);
  });
  dojo.query("span#find_button").on("click", function(e) {
    ArcGis.find(dojo.byId("find_query").value);
  });
  dojo.query("li#analyze span#draw_button").on("click", function(e) {
    ArcGis.draw();
  });
  dojo.query("li#analyze span#anlyze_button").on("click", function(e) {
    ArcGis.analyze();
  });
  dojo.query("li#analyze span#toggle_button").on("click", function(e) {
    ArcGis.toggleLayerVisiblity();
  });
  dojo.query("li#analyze span#clear_button").on("click", function(e) {
    ArcGis.clearMap();
  });
});

function clickOnMenuItem(e) {
  if (e.target.nodeName.toLowerCase() === 'li') {
    var expand_item = !(e.target.className == "active");
    if (expand_item) {
      var height;
      var width = null;
      switch (e.target.id) {
        case "search" :
          height = 72;
          break;
        case "change_map" :
          height = 166;
          break;
        case "find" :
          height = 72;
          break;
        case "analyze" :
          height = 100;
          width = 640;
          break;
      }
      e.target.className = "active";
      effect = dojo.animateProperty({
        node : e.target,
        properties : {
          height : height,
          width : width
        },
        onEnd : function() {
          dojo.query("ul#menu li.active *").forEach(function(e) {
            if (e.id !== "search_error") {
              dojo.fadeIn({
                node : e
              }).play();
            }
          })
        }
      }).play();
    }
  } else if (e.target.nodeName.toLowerCase() === 'span' && e.target.className == "close") {
    var width = (e.target.parentNode.id == "analyze") ? 162 : null;
    dojo.animateProperty({
      node : e.target.parentNode,
      properties : {
        height : 17,
        width : width
      }
    }).play();
    e.target.parentNode.className = "";
    dojo.query("#" + e.target.parentNode.id + " *").style("opacity", "0");
    dojo.query("#" + e.target.parentNode.id + " input").forEach(function(e) {
      e.value = "";
      e.checked = undefined;
    });
    ArcGis.map.toolbar.deactivate();
  }
}
