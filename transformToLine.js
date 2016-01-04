// works its way through a JSON file and creates a LineString out of historical data
var fs = require('fs');

var source = "wagens.json";
// resultfile name/folder
var result = "wagens_bewerkt.json";

// read in
var geoJSON = JSON.parse(fs.readFileSync(source, 'utf8'));
var counter = 0;

geoJSON.features.forEach(function(element) {
    console.log(counter)
    element.geometry.coordinates = element.sensors.pastCoordinates;
    element.geometry.type = "LineString";
    element.type = "Feature";
    delete element.sensors;
    counter++;
});

fs.writeFile(result, JSON.stringify(geoJSON), function(err) {
      if (err) throw err;
      console.log("Renamed "+counter + " entries.");
      console.log('file written.');
});
