Earthquakes Analysis with ESRI JavaScript API
====================



Used layers:
===============
  1) Earthquakes from last 7 days. Both layers are displayed on the map when the application starts.Displaying all earthquakes from last seven days as points on the map.   
       - Earthquakes/EarthquakesFromLastSevenDays/MapServer
       - Earthquakes/EarthquakesFromLastSevenDays/FeatureServer  
  
  2) Earthquakes since 1970. This layers is used only for retreiving data.Practically only the retreived data is displayed on the map   
       - Earthquakes/Since_1970/MapServer

Functionlities:
================  
  1) Basic map controls for navigation and zoom  
  
  2) Location search using geocoding esri service  
  
  3) Change base map. Supported base map layers are:  
     - Open Street Maps  
     - Oceans  
     - National Geographic   
     - Terrain with Labels  
     - Topographics  
     - Streets  
     - Imagery with Labels  
  
  4) Identifying objects on map using IdentifyTask  
  
  5) When an object is identified its attribute table is displayed using AttributesInspector and map.infoWindow.It's possible to edit and delete the identified item.  
  
  6) Finding earthquakes by region using FindTask. The user have to specify a region and press Find button. If a region is found the map is zoomed to that reagon and its bounds are drawn with rectangular.
  
  7) Analysis of eartquakes from 1970 until 2009 using QueryTask and Earthquakes/Since_1970/MapServer layer. The user have to draw a polygon on the map in order to specify the region which will be analyzed. Then the user can specify the following filters:
      - if there was tsunami  
      - location  
      - min magnitude  
      - min number of deaths  
      - min number of injured  
      - year  
After pressing the analyzed button the results will be shown on the map like points for every earthqukae. Every point has different color depending of the magnitude. It's possible to toggle the posibility of the layer displaying the earthquakes from last seven days. It is possible to edit the polygon (manipulate vertices, move, rotate, resize) by double click on the polygon or to clear it completele and draw new one.
    
