"use strict";

import request = require('request');
import fs = require('fs');

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
export class FeatureCollection {
    public type: string;
    public timestamps: number[];
    public url: string;
    public features: Feature[] = [];
}
/**
 * Geojson geometry definition
 */
export class Geometry {
    public type: string;
    public coordinates: number[];
}
/**
 * Properties definition 
 */
export class Properties {
	public Name: string;
    public workcode_id: number;
}
/**
 * Geojson feature definition
 */
export class Feature {
    public Id: string;
    public type: string;
    public geometry: Geometry;
    public properties: Properties;
	public sensors: Sensors;
}
/**
 * Sensor data definition
 */
export class Sensors {
    public pastCoordinates: number[][];
    public workcode_id: number[];
}

export class Wagens {
    public wagens: Wagen[];
}

export class Wagen {
    public id: string;
    public workcode_id: any;
    public latitude: any;
    public longitude: any;
}

//------------------ End of GeoJSON -------

export class fetchData {
	public url: string;
	 
	public init(url: string) {
		console.log("Initialized fetcher");
		this.url = url;
		this.fetchAndTransform();
	}
	
	public fetchAndTransform() {
		console.time("Exectime")
		console.log("GET "+ this.url);
		request(this.url, function (err, res, body) {
			// fetch what we have on disk
			var geoJSON = new FeatureCollection();
			try {
				//try obtaining the file we created before, if it is there
				geoJSON = JSON.parse(fs.readFileSync('wagens.json', 'utf8'));
			} catch (error) {
				console.log("first time encountering this data source - creating it from scratch!");
			}
            var wagens = new Wagens();
            //console.log(body);
			wagens.wagens = JSON.parse(body);				

            if(geoJSON.hasOwnProperty("timestamps") ) {
                //not dealing with a fresh file
                console.log("Updating features..");
                // for each wagen, check if there is a feature that corresponds to it - and add the data 
                wagens.wagens.forEach((w: Wagen) => {
                    geoJSON.features.forEach((f: Feature) => {
                        if (w.id === f.Id) {
                            f.properties.workcode_id = Number(w.workcode_id);
                            f.geometry.coordinates = [Number(w.longitude), Number(w.latitude)];
                            f.sensors.pastCoordinates.push([Number(w.longitude), Number(w.latitude)]);
                            f.sensors.workcode_id.push(w.workcode_id);
                        }
                    });
                });
                geoJSON.timestamps.push(Date.now());
            } else {
                // Oh snap, let's build our GeoJSON then.
                geoJSON.url = this.url;
                geoJSON.type = "FeatureCollection";
                geoJSON.timestamps = [Date.now()];
                console.log("Populating features..");          
                wagens.wagens.forEach((w: Wagen) => {
                    var feature = new Feature();
                    feature.properties = new Properties();
                    feature.geometry = new Geometry();
                    feature.sensors = new Sensors();
                    feature.Id = w.id;
                    feature.type = "Feature";
                    feature.properties.workcode_id = w.workcode_id;
                    feature.geometry.type = "Point";
                    feature.geometry.coordinates = [Number(w.longitude), Number(w.latitude)];
                    feature.sensors.pastCoordinates = [[Number(w.longitude), Number(w.latitude)]];
                    feature.sensors.workcode_id = [w.workcode_id];
                    geoJSON.features.push(feature);
                });   
            }

			fs.writeFile('wagens.json', JSON.stringify(geoJSON), function(err) {
      			if (err) throw err;
      			console.log("Data has been saved to disk!");
				console.timeEnd("Exectime");
   		 });
		});	
	}
}


var fetcher = new fetchData();
var url: string;
var refreshRate: number;
// settings
url = "http://rijkswaterstaatstrooit.nl//home/wagens";
refreshRate = 10000; // milliseconds

// calling init every time seems pretty silly, would rather do this inside init
fetcher.init(url);
setInterval(function() { fetcher.init(url); }, refreshRate);
