"use strict";
var request = require('request');
var fs = require('fs');
/**
*	This is a web scraper tool to collect data from Rijkswaterstaatstrooit. The code pulls an existing JSON document
*   from the web, parses it as GeoJSON and updates it every x seconds.
*	For more information see the Common Sense project by TNO, the Dutch Institute for Applied Scientific Research.
*	https://github.com/TNOCS/csWeb
*/
//------------------------- GeoJSON --------------------
/**
 * Geojson definition
 */
var FeatureCollection = (function () {
    function FeatureCollection() {
        this.features = [];
    }
    return FeatureCollection;
})();
exports.FeatureCollection = FeatureCollection;
/**
 * Geojson geometry definition
 */
var Geometry = (function () {
    function Geometry() {
    }
    return Geometry;
})();
exports.Geometry = Geometry;
/**
 * Properties definition
 */
var Properties = (function () {
    function Properties() {
    }
    return Properties;
})();
exports.Properties = Properties;
/**
 * Geojson feature definition
 */
var Feature = (function () {
    function Feature() {
    }
    return Feature;
})();
exports.Feature = Feature;
/**
 * Sensor data definition
 */
var Sensors = (function () {
    function Sensors() {
    }
    return Sensors;
})();
exports.Sensors = Sensors;
var Wagens = (function () {
    function Wagens() {
    }
    return Wagens;
})();
exports.Wagens = Wagens;
var Wagen = (function () {
    function Wagen() {
    }
    return Wagen;
})();
exports.Wagen = Wagen;
//------------------ End of GeoJSON -------
var fetchData = (function () {
    function fetchData() {
    }
    fetchData.prototype.init = function (url) {
        console.log("Initialized fetcher");
        this.url = url;
        this.fetchAndTransform();
    };
    fetchData.prototype.fetchAndTransform = function () {
        console.time("Exectime");
        console.log("GET " + this.url);
        request(this.url, function (err, res, body) {
            // fetch what we have on disk
            var geoJSON = new FeatureCollection();
            try {
                //try obtaining the file we created before, if it is there
                geoJSON = JSON.parse(fs.readFileSync('wagens.json', 'utf8'));
            }
            catch (error) {
                console.log("first time encountering this data source - creating it from scratch!");
            }
            var wagens = new Wagens();
            //console.log(body);
            wagens.wagens = JSON.parse(body);
            if (geoJSON.hasOwnProperty("timestamps")) {
                //not dealing with a fresh file
                console.log("Updating features..");
                // for each wagen, check if there is a feature that corresponds to it - and add the data 
                wagens.wagens.forEach(function (w) {
                    geoJSON.features.forEach(function (f) {
                        if (w.id === f.Id) {
                            f.properties.workcode_id = w.workcode_id;
                            f.geometry.coordinates = [Number(w.longitude), Number(w.latitude)];
                            f.sensors.pastCoordinates.push([Number(w.longitude), Number(w.latitude)]);
                            f.sensors.workcode_id.push(w.workcode_id);
                        }
                    });
                });
                geoJSON.timestamps.push(Date.now());
            }
            else {
                // Oh snap, let's build our GeoJSON then.
                geoJSON.url = this.url;
                geoJSON.type = "FeatureCollection";
                geoJSON.timestamps = [Date.now()];
                console.log("Populating features..");
                wagens.wagens.forEach(function (w) {
                    var feature = new Feature();
                    feature.properties = new Properties();
                    feature.geometry = new Geometry();
                    feature.sensors = new Sensors();
                    feature.Id = w.id;
                    feature.type = "feature";
                    feature.properties.workcode_id = w.workcode_id;
                    feature.geometry.type = "Point";
                    feature.geometry.coordinates = [Number(w.longitude), Number(w.latitude)];
                    feature.sensors.pastCoordinates = [[Number(w.longitude), Number(w.latitude)]];
                    feature.sensors.workcode_id = [w.workcode_id];
                    geoJSON.features.push(feature);
                });
            }
            fs.writeFile('wagens.json', JSON.stringify(geoJSON), function (err) {
                if (err)
                    throw err;
                console.log("Data has been saved to disk!");
                console.timeEnd("Exectime");
            });
        });
    };
    return fetchData;
})();
exports.fetchData = fetchData;
var fetcher = new fetchData();
var url;
var refreshRate;
// settings
url = "http://rijkswaterstaatstrooit.nl//home/wagens";
refreshRate = 10000; // milliseconds
// calling init every time seems pretty silly, would rather do this inside init
fetcher.init(url);
setInterval(function () { fetcher.init(url); }, refreshRate);
//# sourceMappingURL=server.js.map