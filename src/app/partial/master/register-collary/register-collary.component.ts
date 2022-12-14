import { Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/configs/config.service';
import { CallApiService } from 'src/app/core/services/call-api.service';
import { CommonMethodsService } from 'src/app/core/services/common-methods.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { FormsValidationService } from 'src/app/core/services/forms-validation.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { WebStorageService } from 'src/app/core/services/web-storage.service';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { Subscription } from 'rxjs';
import { MapsAPILoader } from '@agm/core'
import { Router } from '@angular/router';
import { CommonApiCallService } from 'src/app/core/services/common-api-call.service';

@Component({
  selector: 'app-register-collary',
  templateUrl: './register-collary.component.html',
  styleUrls: ['./register-collary.component.scss']
})
export class RegisterCollaryComponent implements OnInit {
  @ViewChild('formGroupDirective') formGroupDirective!: FormGroupDirective;


  displayedColumns: string[] = ['rowNumber', 'collieryName', 'districtName', 'action',];
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  dataSource: any[] = [];
  frm!: FormGroup;
  frmCollary!: FormGroup;
  isfilterSubmit: boolean = false;
  districtNameArr: any[] = [];
  placeMarker: any;
  get f() { return this.frm.controls };
  selectedCustomer: any;
  get fc() { return this.frmCollary.controls };
  isEdit: boolean = false;
  updateId: any;
  totalRows: any;
  pageNo = 1;
  pageSize = 10;
  circle: any;
  existingMarker: any;


  // map var 
  lat =22.9868;
  long = 87.8550;
  map: any;
  drawingManager: any;
  centerMarker: any = undefined;
  centerMarkerLatLng: string = "";
  data: any;
  isHide: boolean = false;
  selectedRecord: any = null;
  subscribeCls!: Subscription;
  centerMarkerRadius = "";
  drawingContFlg: boolean = true;
  existingShape: any;
  setMarker: boolean = false;

  
  newRecord: any = {
    latLng: "",
    polygonText: "",
    geofenceType: 0,
    radius: 0,
    resetData: function () {
      this.latLng = "";
      this.latLng = "";
      this.polygonText = "";
      this.geofenceType = 0;
      this.radius = 0;
    }
  };

  isShapeDrawn: boolean = false;

  @ViewChild('search') public searchElementRef!: ElementRef;


  constructor(public configService: ConfigService,
    private fb: FormBuilder,
    public apiService: CallApiService,
    public commonMethod: CommonMethodsService,
    public error: ErrorHandlerService,
    private webStorageService: WebStorageService,
    private shareDataService: ShareDataService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    public commonService: CommonApiCallService,
    public validation: FormsValidationService,
    private ngZone: NgZone,
    private mapsAPILoader: MapsAPILoader,
  ) {
  }

  ngOnInit(): void {
    this.createFilterForm();
    this.createCollaryForm();
    this.getDistrictName();
    this.getCollaryList();
  }

  createFilterForm() {
    this.frm = this.fb.group({
      districtIdFltr: [''],
      collaryNameFltr: ['', [Validators.pattern(this.validation.alphabetsWithSpace)]]
    })
  }

  createCollaryForm() {
    this.frmCollary = this.fb.group({
      districtId: ['', [Validators.required]],
      collieryName: ['', [Validators.required, Validators.pattern(this.validation.alphaNumericWithSpace)]],
      collieryAddress: ['', [Validators.required]],
      latitude: ['', [Validators.required]],
      longitude: ['', [Validators.required]],
      polygonText: [''],
      geofenceType: [0],
      distance: [0],
      createdBy: [this.webStorageService.getUserId(), [Validators.required]],
      contactNo: ['', [Validators.pattern(this.validation.valMobileNo)]],
      emailId: ['', [Validators.email]],
      remark: [''],
    })
  }

  getDistrictName() {
    this.commonService.getDistrictByStateId(36).subscribe({
      next: (res: any) => {
        this.districtNameArr.push({ text: "All District", organizationId: 0 }, ...res);
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  getQueryString() {
    let str = "?pageno=" + this.pageNo + "&pagesize=" + this.pageSize;
    this.frm && this.frm.value.districtIdFltr && (str += "&DistrictId=" + this.frm.value.districtIdFltr);
    this.frm && this.frm.value.collaryNameFltr && (str += "&Search=" + this.frm.value.collaryNameFltr);
    return str;
  }

  getCollaryList() {
    this.spinner.show();
    this.apiService.setHttp('get', "CollieryMaster" + this.getQueryString(), false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.dataSource = res.responseData.responseData1;
          this.totalRows = res.responseData.responseData2.totalCount;
        } else {
          this.dataSource = [];
          this.totalRows = 0;
          this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 1);
        }
        this.spinner.hide();
      },
      error: ((error: any) => { this.error.handelError(error.status); this.spinner.hide(); })
    })
  }

  onSearch() {
    this.pageNo = 1;
    this.paginator.pageIndex = 0;
    this.isfilterSubmit = true;
    if (this.frm.valid) {
      this.isfilterSubmit = false;
      this.getCollaryList();
    }
  }

  pageChanged(pg: any) {
    this.pageNo = pg.pageIndex + 1;
    this.getCollaryList();
  }

  editCollaryRecord(rowId: any) {

    this.apiService.setHttp('get', "CollieryMaster/" + rowId, false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.isEdit = true;
          this.shareDataService.setGeofence(res.responseData);
          this.updateId = res.responseData.id;

          this.frmCollary.patchValue({
            collieryName: res.responseData.collieryName,
            districtId: res.responseData.districtId,
            collieryAddress: res.responseData.collieryAddress,
            contactNo: res.responseData.contactNo,
            emailId: res.responseData.emailId,
            remark: res.responseData.remark,
            latitude: res.responseData.latitude,
            longitude: res.responseData.longitude,
          })
        }


        this.data = {
          selectedRecord: {
            latLng: res.responseData.latitude + ',' + res.responseData.longitude,
            polygonText: res.responseData.polygonText,
            geofenceType: res.responseData?.geofenceType,
            distance: res.responseData.distance,
            collieryAddress: res.responseData.collieryAddress,
            collieryName: res.responseData.collieryName
          },
          isHide: true
        }
        this.onMapReady(this.map);
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  deleteCollaryRecord(row: any) {
    let obj: any = ConfigService.dialogObj;
    obj['p1'] = 'Are you sure you want to delete this record?';
    obj['cardTitle'] = 'Delete';
    obj['successBtnText'] = 'Delete';
    obj['cancelBtnText'] = 'Cancel';

    const dialog = this.dialog.open(ConfirmationComponent, {
      width: this.configService.dialogBoxWidth[0],
      data: obj,
      disableClose: this.configService.disableCloseBtnFlag,
    })
    dialog.afterClosed().subscribe(res => {
      if (res == "Yes") {
        var req = {
          "id": row.id,
          "deletedBy": this.webStorageService.getUserId()
        }
        this.apiService.setHttp('delete', "CollieryMaster", false, req, false, 'WBMiningService');
        this.apiService.getHttp().subscribe({
          next: (res: any) => {
            if (res.statusCode === 200) {
              this.getCollaryList();
              this.onCancelRecord();
              this.commonMethod.matSnackBar('Colliery record is deleted!', 0);
            }
          },
          error: ((error: any) => { this.error.handelError(error.status) })
        })
      } else {

      }
    })
  }

  onSubmitCollary() {

    this.spinner.show();
    if (this.frmCollary.invalid) {
      this.spinner.hide();
      return;
    } else {
      var req = {
        "id": this.isEdit == true ? this.updateId : 0,
        ...this.frmCollary.value
      }

      this.apiService.setHttp((this.isEdit == true ? 'put' : 'post'), "CollieryMaster", false, req, false, 'WBMiningService');
      this.apiService.getHttp().subscribe({
        next: (res: any) => {
          if (res.statusCode == 200) {
            this.spinner.hide();
            this.resetFullMap();
            this.onCancelRecord();
            this.getCollaryList();
          
            // added
            this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 0);
          } else {
            this.spinner.hide();
            this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 1);
          }
        },
        error: ((error: any) => { this.error.handelError(error.status); this.spinner.hide(); })
      })
    }
  }


  resetFullMap(){
    this.data = {
      selectedRecord: {
        latLng: '22.9868' + ',' + '87.8550'
      },
      isHide: true
    }
    this.onMapReady(this.map, true);
  }

  onCancelRecord() {
    this.frmCollary.reset();
    this.formGroupDirective.resetForm();
    this.frmCollary.reset({
      geofenceType: 0,
      distance: 0,
      createdBy: this.webStorageService.getUserId()
    })

    this.removeShape();
    this.isEdit = false;
    this.exiShapeRemove();
  }


  //-------------------------------------------- agm map fn start heare ------------------------------//


  onMapReady(map?: any, resetShape?:boolean) {
    this.isHide = this.data?.isHide || false;
    this.map = map;
    if (this.isEdit || resetShape) {
      this.exiShapeRemove();
    } else {
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: this.drawingContFlg,
        drawingControlOptions: {
          drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.CIRCLE],
        },
        circleOptions: {
          strokeColor: '#FF0000',
          fillColor: '#FF0000',
          clickable: false,
          editable: true,
          zIndex: 1,
          fillOpacity: 0.35,
        },
        polygonOptions: {
          strokeColor: '#FF0000',
          fillColor: '#FF0000',
          draggable: true,
          editable: true,
          fillOpacity: 0.35,
        },
        map: map
      });
    }

    if(!this.data?.selectedRecord.polygonText && this.data?.selectedRecord.latLng && this.isEdit){ // not pol text and then show marker
      const latLong = new google.maps.LatLng(this.data?.selectedRecord.latLng.split(',')[0],this.data?.selectedRecord.latLng.split(',')[1]);

      if (latLong) {
        this.placeMarker = new google.maps.Marker({
          position: latLong,
          draggable: true,
          map: map,
        });
  
        this.placeMarker.addListener('dragend',(e:any)=>{
          this.setLatLong(e.latLng.lat().toFixed(6), e.latLng.lng().toFixed(6)) // set lat long
          this.map?.panTo(e.latLng);
        });
        map.setZoom(8);
        map.setCenter({ lat:Number(this.data?.selectedRecord?.latLng.split(',')[0]), lng:Number(this?.data?.selectedRecord?.latLng.split(',')[1])})
      }
    }
    

    this.mapsAPILoader.load().then(() => {
      let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef?.nativeElement);
      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
          map.setZoom(16);
          map.setCenter({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
          if (this.centerMarker == undefined) {
            this.centerMarker = new google.maps.Marker({
              map: map,
              draggable: true
            })
            this.centerMarker.addListener('dragend', (evt: any) => {
              this.centerMarkerLatLng = "Long, Lat:" + evt.latLng.lng().toFixed(6) + ", " + evt.latLng.lat().toFixed(6);
              this.setLatLong(evt.latLng.lat().toFixed(6), evt.latLng.lng().toFixed(6)) // set lat long
              this.map?.panTo(evt.latLng);
            });
          }
          this.centerMarker.setPosition({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
          this.centerMarkerLatLng = "Long, Lat:" + place.geometry.location.lng().toFixed(6) + ", " + place.geometry.location.lat().toFixed(6);
          this.setLatLong(place.geometry.location.lat().toFixed(6), place.geometry.location.lng().toFixed(6)) // set lat long
        });
      });
    })

   
    if (this.data?.newRecord?.geofenceType == 1) {
      var OBJ_fitBounds = new google.maps.LatLngBounds();
      const path = this.data?.newRecord.polygonText.split(',').map((x: any) => { let obj = { lng: Number(x.split(' ')[1]), lat: Number(x.split(' ')[0]) }; OBJ_fitBounds.extend(obj); return obj });
      const existingShape = new google.maps.Polygon({ paths: path, strokeColor: "#00FF00", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#00FF00", fillOpacity: 0.35, editable: true, draggable: true });
      existingShape.setMap(map);
      map.setCenter(this.FN_CN_poly2latLang(existingShape));
      map.fitBounds(OBJ_fitBounds);

      google.maps.event.addListener(existingShape, 'dragend', (e) => {
        this.ngZone.run(() => {
          this.setSelection(existingShape, "polygon")
        })
      });
      google.maps.event.addListener(existingShape.getPath(), 'set_at', (e) => {
        this.ngZone.run(() => {
          this.setSelection(existingShape, "polygon")
        })
      })
      google.maps.event.addListener(existingShape.getPath(), 'insert_at', (e) => {
        this.ngZone.run(() => {
          this.setSelection(existingShape, "polygon")
        })
      })
      google.maps.event.addListener(existingShape.getPath(), 'remove_at', (e) => {
        this.ngZone.run(() => {
          this.setSelection(existingShape, "polygon")
        })
      })
    }

    if (this.data?.selectedRecord && this.data?.selectedRecord?.geofenceType == 1) { //for use edit

      try {
        var OBJ_fitBounds = new google.maps.LatLngBounds();
        const path = this.data.selectedRecord.polygonText.split(',').map((x: any) => { let obj = { lng: Number(x.split(' ')[0]), lat: Number(x.split(' ')[1]) }; OBJ_fitBounds.extend(obj); return obj });
        this.existingShape = new google.maps.Polygon({ paths: path, map: map, strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FF0000", fillOpacity: 0.35, editable: false });
        let latLng = this.FN_CN_poly2latLang(this.existingShape);
        map.setCenter(latLng); map.fitBounds(OBJ_fitBounds);
        this.existingMarker = new google.maps.Marker({ map: map, draggable: false, position: latLng });

        let hc = "<table><tbody>";
        hc += '<tr><td colspan="2"><h6>Colliery Details</h6></td></tr>';
        hc += '<tr><td>Colliery Name</td><td>: ' + (this.data.selectedRecord.collieryName || "-") + '</td></tr>';
        hc += '<tr><td>Colliery Address</td><td>: ' + (this.data.selectedRecord.collieryAddress || "-") + '</td></tr>';
        hc += "</tbody></table>";

        const info = new google.maps.InfoWindow({
          content: hc
        })
        this.existingMarker.addListener('click', () => {
          info.open(this.map, this.existingMarker);
        })

      } catch (e) { }
    }
    if (this.data?.newRecord?.geofenceType == 2) {
      let latlng = new google.maps.LatLng(this.data?.newRecord.latLng.split(",")[0], this.data?.newRecord.latLng.split(",")[1]);
      let circle = new google.maps.Circle({
        strokeColor: '#FF0000',
        fillColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillOpacity: 0.35,
        map: map,
        //position: latlng,
        center: latlng,
        radius: this.data?.newRecord.radius,
        draggable: true,
        editable: true
      });
      this.setZoomLevel(this.data?.newRecord.radius)
      map?.panTo(latlng);
      google.maps.event.addListener(circle, 'radius_changed', () => {
        this.ngZone.run(() => {
          this.setSelection(circle, "circle");
        })
      });
      google.maps.event.addListener(circle, 'dragend', (e) => {
        this.ngZone.run(() => {
          this.setSelection(circle, "circle");
        })
      });
      google.maps.event.addListener(circle, 'center_changed', (e) => {
        this.ngZone.run(() => {
          this.setSelection(circle, "circle");
        })
      });

    }

    if (this.data?.selectedRecord && this.data.selectedRecord?.geofenceType == 2) { //for use edit
      try {
        let latlng = new google.maps.LatLng(this.data.selectedRecord.polygonText.split(" ")[1], this.data.selectedRecord.polygonText.split(" ")[0]);
        this.existingMarker = new google.maps.Marker({ map: map, draggable: false, position: latlng });
        this.circle = new google.maps.Circle({
          strokeColor: '#FF0000',
          fillColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillOpacity: 0.35,
          map: map,
          //position: latlng,
          center: latlng,
          radius: this.data.selectedRecord.distance,
        });
        map.panTo(latlng);
        this.setZoomLevel(this.data.selectedRecord.distance);

        let hc = "<table><tbody>";
        hc += '<tr><td colspan="2"><h6>Colliery Details</h6></td></tr>';
        hc += '<tr><td>Colliery Name</td><td>: ' + (this.data.selectedRecord.collieryName || "-") + '</td></tr>';
        hc += '<tr><td>Colliery Address</td><td>: ' + (this.data.selectedRecord.collieryAddress || "-") + '</td></tr>';
        hc += "</tbody></table>";

        const info = new google.maps.InfoWindow({
          content: hc
        })
        this.existingMarker.addListener('click', () => {
          info.open(this.map, this.existingMarker);
        })

      } catch (e) { }
    }
    this.isHide && this.drawingManager.setDrawingMode(null);

    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (e) => {
        this.isShapeDrawn = true;
        var newShape = e.overlay;

        if (e.type == 'polygon' || e.type == 'circle') { this.drawingManager.setDrawingMode(null); }

        google.maps.event.addListener(newShape, 'radius_changed', () => {
          this.ngZone.run(() => {
            this.setSelection(newShape, "circle");
          })
        });
        google.maps.event.addListener(newShape, 'dragend', (e) => {
          this.ngZone.run(() => {
            this.setSelection(newShape, this.newRecord.geofenceType);
          })
        });
        //debugger
        this.setSelection(newShape, e.type);
      }
    );
  }

  exiShapeRemove(){
    this.existingShape?.setMap(null);
    this.circle?.setMap(null);
    this.existingMarker?.setMap(null);
    this.placeMarker?.setMap(null);
    this.drawingManager?.setDrawingMode(null);
  }

  FN_CN_poly2latLang(poly: any) {
    var lowx,
      highx,
      lowy,
      highy,
      lats = [],
      lngs = [],
      vertices = poly.getPath();
    for (var i = 0; i < vertices.length; i++) {
      lngs.push(vertices.getAt(i).lng());
      lats.push(vertices.getAt(i).lat());
    }
    lats.sort();
    lngs.sort();
    lowx = lats[0];
    highx = lats[vertices.length - 1];
    lowy = lngs[0];
    highy = lngs[vertices.length - 1];
    const center_x = lowx + ((highx - lowx) / 2);
    const center_y = lowy + ((highy - lowy) / 2);
    return (new google.maps.LatLng(center_x, center_y));
  }

  setSelection(shape: any, type: string) {
    this.clearSelection(false);
    this.newRecord.geofenceType = type;
    type == 'circle' && (this.newRecord.circle = shape, this.newRecord.circle.setMap(this.map), this.newRecord.circle.setEditable(true), this.newRecord.centerMarkerLatLng = this.getLanLongFromCircle(shape), this.newRecord.radius = +shape.getRadius().toFixed(2))
    type == 'polygon' && (this.newRecord.polygon = shape, this.newRecord.polygon.setMap(this.map), this.newRecord.polygon.setEditable(true), this.newRecord.centerMarkerLatLng = this.getCenterLanLongFromPolygon(shape), this.newRecord.radius = 0, this.centerMarkerRadius = '')
    try {
      var ll = new google.maps.LatLng(+this.centerMarkerLatLng.split(',')[1], +this.centerMarkerLatLng.split(',')[0]);
      this.map.panTo(ll);
    }
    catch (e) { }

    this.newRecord.latLng = this.newRecord?.centerMarkerLatLng;
    this.frmCollary.patchValue({
      latitude: +this.newRecord.latLng.split(",")[1],
      longitude: +this.newRecord.latLng.split(",")[0],
      polygonText: this.newRecord?.polygontext,
      geofenceType: this.newRecord?.geofenceType == "circle" ? 2 : 1,
      distance: this.newRecord?.geofenceType == "circle" ? this.newRecord?.radius : 0,
      collieryAddress: this.searchElementRef.nativeElement.value
    })
    this.searchElementRef.nativeElement.value = this.searchElementRef.nativeElement.value;
  }

  clearSelection(isAllClear: any) {
    this.newRecord.polygon && (this.newRecord.polygon.setEditable(false), this.newRecord.polygon.setMap(null), this.newRecord.polygon = undefined);
    this.newRecord.circle && (this.newRecord.circle.setEditable(false), this.newRecord.circle.setMap(null), this.newRecord.circle = undefined);
    this.centerMarkerLatLng = "";
    this.centerMarkerRadius = "";
    this.newRecord.geofenceType = "";
    this.newRecord.polygontext = "";
    this.newRecord.radius = 0;
    if (this.selectedRecord && !isAllClear) {
      if (this.selectedRecord.geofenceData) {
      }
    }
  }

  getLanLongFromCircle(circle: any) {
    var lat = circle.getCenter().lat().toFixed(8);
    var long = circle.getCenter().lng().toFixed(8);
    this.newRecord.polygontext = long + ' ' + lat;
    return long + ',' + lat;
  }

  getCenterLanLongFromPolygon(polygon: any) {
    let bounds = new google.maps.LatLngBounds();
    var paths = polygon.getPaths();
    this.newRecord.polygontext = "";
    var tempPolygonText: any[] = [];
    paths.forEach(function (path: any) {
      var ar = path.getArray();
      for (var i = 0, l = ar.length; i < l; i++) {
        tempPolygonText[tempPolygonText.length] = ar[i].lng().toFixed(8) + ' ' + ar[i].lat().toFixed(8);
        bounds.extend(ar[i]);
      }
    })
    tempPolygonText[tempPolygonText.length] = tempPolygonText[0];
    this.newRecord.polygontext = tempPolygonText.join();
    return bounds.getCenter().lng().toFixed(8) + ',' + bounds.getCenter().lat().toFixed(8);
  }

  setZoomLevel(radius: number) {
    let zoom = 8;
    if (radius < 500) {
      zoom = 16;
    }
    else if (radius < 1000) {
      zoom = 14;
    }
    else if (radius < 2000) {
      zoom = 14;
    }
    else if (radius < 3000) {
      zoom = 12;
    }
    else if (radius < 5000) {
      zoom = 10;
    }
    else if (radius < 15000) {
      zoom = 10;
    }
    this.map.setZoom(zoom)
  }

  removeShape() {
    this.isShapeDrawn = false;
    this.clearSelection(false);
    this.resetLatLong();
  }

  setLatLong(latitude: any, longitude: any) {
    this.frmCollary.controls['latitude'].setValue(latitude)
    this.frmCollary.controls['longitude'].setValue(longitude)
  }

  resetLatLong() {
    if (!this.isEdit) {
      this.frmCollary.controls['latitude'].setValue('')
      this.frmCollary.controls['longitude'].setValue('')
    }
  }

  //-------------------------------------------- agm map fn end heare ------------------------------//

}
