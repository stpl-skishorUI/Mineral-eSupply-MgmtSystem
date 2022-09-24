import { Component, OnInit } from '@angular/core';
import { ConfigService } from 'src/app/configs/config.service';
import { TravelMarker, TravelMarkerOptions } from 'travel-marker';
import { locationData }  from '../../../loc';

@Component({
  selector: 'app-vehicle-tracking',
  templateUrl: './vehicle-tracking.component.html',
  styleUrls: ['./vehicle-tracking.component.scss']
})
export class VehicleTrackingComponent implements OnInit {
  lat!: number;
  long!: number;
  zoom!: number;
  viewType: any;
  map: any;
  line: any;
  directionsService: any;
  marker!: TravelMarker;
  speedMultiplier = 1;

  constructor(public configService: ConfigService) { }

  ngOnInit(): void {
    this.setMapData();
    this.bindTable();
  }

  setMapData() {
    this.lat = 23.680899;
    this.long =  86.927182;
    this.zoom = 11;
    this.viewType = this.configService.viewType;
  }

  onMapReady(map: any) {
    this.map = map;
    this.mockDirections();
  }

  bindTable() {

  }
  // 23.680899,86.937182
  //------------------------------------------------------ agm mrker controls start heare --------------------------------------------------//

  mockDirections() {
    const locationArray = locationData.map(
      (l:any) => new google.maps.LatLng(l[0], l[1])
    );
    this.line = new google.maps.Polyline({
      strokeOpacity: 0.5,
      path: [],
      map: this.map,
    });
    locationArray.forEach((l:any) => this.line.getPath().push(l));
 
    const start = new google.maps.LatLng(23.8153288,86.9947152);
    const end = new google.maps.LatLng(23.680899,86.937182);

    const startMarker = new google.maps.Marker({
      position: start,
      map: this.map,
      icon: "assets/images/s.png"
    });
    const endMarker = new google.maps.Marker({
      position: end,
      map: this.map,
      icon: "assets/images/e.png"
    });
    this.initRoute();
  }

  calcRoute() {
    this.line = new google.maps.Polyline({
      strokeOpacity: 0.5,
      path: [],
      map: this.map,
    });

    const start = new google.maps.LatLng(23.8153288,86.9947152);
    const end = new google.maps.LatLng(23.680899,86.937182);

    const request = {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.BICYCLING,
    };
    this.directionsService = new google.maps.DirectionsService();
    this.directionsService.route(request, (response: any, status: any) => {
      // Empty response as API KEY EXPIRED
      console.log(response);
      if (status == google.maps.DirectionsStatus.OK) {
        var legs = response.routes[0].legs;
        for (let i = 0; i < legs.length; i++) {
          var steps = legs[i].steps;
          for (let j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            for (let k = 0; k < nextSegment.length; k++) {
              this.line.getPath().push(nextSegment[k]);
            }
          }
        }
        this.initRoute();
      }
    });
  }

  initRoute() {
    const route = this.line.getPath().getArray();

    // options
    const options: TravelMarkerOptions = {
      map: this.map, // map object
      speed: 50, // default 10 , animation speed
      interval: 10, // default 10, marker refresh time
      speedMultiplier: this.speedMultiplier,
      markerOptions: {
        title: 'Travel Marker',
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'https://i.imgur.com/eTYW75M.png',
          // This marker is 20 pixels wide by 32 pixels high.
          animation: google.maps.Animation.DROP,
          // size: new google.maps.Size(256, 256),
          scaledSize: new google.maps.Size(128, 128),
          // The origin for this image is (0, 0).
          origin: new google.maps.Point(0, 0),
          // The anchor for this image is the base of the flagpole at (0, 32).
          anchor: new google.maps.Point(53, 110),
        },
      },
    };

    // define marker
    this.marker = new TravelMarker(options);

    // add locations from direction service
    this.marker.addLocation(route);

    setTimeout(() => this.play(), 2000);
  }

  // play animation
  play() {
    this.marker.play();
  }

  // pause animation
  pause() {
    this.marker.pause();
  }

  // reset animation
  reset() {
    this.marker.reset();
  }

  // fast forward
  fast() {
    this.speedMultiplier *= 2;
    this.marker.setSpeedMultiplier(this.speedMultiplier);
  }

  // slow motion
  slow() {
    this.speedMultiplier /= 2;
    this.marker.setSpeedMultiplier(this.speedMultiplier);
  }
  //------------------------------------------------------ agm mrker controls end heare ----------------------------------------------------//


}
