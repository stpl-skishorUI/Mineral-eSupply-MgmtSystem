import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { ConfigService } from 'src/app/configs/config.service';
import { CallApiService } from 'src/app/core/services/call-api.service';
import { CommonMethodsService } from 'src/app/core/services/common-methods.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { FormsValidationService } from 'src/app/core/services/forms-validation.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { WebStorageService } from 'src/app/core/services/web-storage.service';

@Component({
  selector: 'app-register-collary',
  templateUrl: './register-collary.component.html',
  styleUrls: ['./register-collary.component.scss']
})
export class RegisterCollaryComponent implements OnInit {
  
  displayedColumns: string[] = ['rowNumber', 'collieryName', 'districtName', 'collieryAddress', 'action',];
  @ViewChild(MatPaginator, {static:false}) paginator!: MatPaginator;
  dataSource: any;
  frm!: FormGroup;
  frmCollary!: FormGroup;
  isfilterSubmit: boolean = false;
  districtNameArr: any [] = [];
  get f() { return this.frm.controls };
  selectedCustomer:any;
  get fc() { return this.frmCollary.controls };
  isEdit: boolean = false;
  updateId: any;

  constructor(public configService:ConfigService,
    private fb: FormBuilder,
    public apiService: CallApiService,
    public frmValid: FormsValidationService,
    public commonMethod: CommonMethodsService,
    public error: ErrorHandlerService, 
    private webStorageService:WebStorageService,
    private shareDataService: ShareDataService) { }

  ngOnInit(): void {
    this.createFilterForm();
    this.createCollaryForm();
    this.getDistrictName();
    this.getCollaryList();
  }

  createFilterForm(){
    this.frm = this.fb.group({
      districtIdFltr: [''],
      collaryNameFltr: ['', [Validators.pattern(this.frmValid.alphabetsWithSpace)]]
    })

  }

  createCollaryForm(){
    this.frmCollary = this.fb.group({
      districtId: ['', [Validators.required]],
      collieryName: ['', [Validators.required, Validators.pattern(this.frmValid.alphabetsWithSpace)]],
      collieryAddress: ['', [Validators.required]],
      latitude: ['', [Validators.required]],
      polygonText: ['', [Validators.required]],
      geofenceType: ['', [Validators.required]],
      distance: ['', [Validators.required]],
      createdBy: [this.webStorageService.getUserId(), [Validators.required]],
    })
  }

  getDistrictName(){
    this.apiService.setHttp('get', "DropdownService/GetDistrictDetails?stateId=36", false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.districtNameArr = res.responseData;
        }
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  getQueryString(){
    let str = "?pageno=" + 1 + "&pagesize=" + 10;
    this.frm && this.frm.value.districtIdFltr && (str += "&DistrictId=" + this.frm.value.districtIdFltr);
    this.frm && this.frm.value.collaryNameFltr && (str += "&Search=" + this.frm.value.collaryNameFltr);
    return str;
  }

  getCollaryList(){
    this.apiService.setHttp('get', "CollieryMaster" + this.getQueryString(), false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.dataSource = res.responseData.responseData1;
          this.dataSource.paginator = this.paginator;
        } else {
          // this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 1);
        }
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  onSearch(){
    this.isfilterSubmit = true;
    if(this.frm.valid){
      this.isfilterSubmit = false;
      this.getCollaryList();
    }
  }

  editCollaryRecord(rowId: any){
    this.apiService.setHttp('get', "CollieryMaster/" + rowId, false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.isEdit = true;
          this.shareDataService.setGeofence(res.responseData);
          this.updateId = res.responseData.id;
          this.frmCollary.patchValue({
            collieryName: res.responseData.collieryName,
            districtId: res.responseData.districtId
          })
        }
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  deleteCollaryRecord(row: any){
    // this.apiService.setHttp('delete', "CollieryMaster" + this.getQueryString(), false, false, false, 'WBMiningService');
    // this.apiService.getHttp().subscribe({
    //   next: (res: any) => {
    //     if (res.statusCode === 200) {
    //       this.dataSource = res.responseData.responseData1;
    //       this.dataSource.paginator = this.paginator;
    //     }
    //   },
    //   error: ((error: any) => { this.error.handelError(error.status) })
    // })
  }

  onSubmitCollary(){
    if (this.frmCollary.invalid) {
      console.log(this.frmCollary.value)
      return;
    }else{
      var req = {
        "id" : this.isEdit == true ? this.updateId : 0,
        ...this.frmCollary.value
      }
      this.apiService.setHttp((this.isEdit == true ? 'put' : 'post'), "CollieryMaster", false, req, false, 'WBMiningService');
      this.apiService.getHttp().subscribe({
        next: (res: any) => {
          if (res.statusCode === 200) {
            this.dataSource = res.responseData.responseData1;
            this.dataSource.paginator = this.paginator;
          } else {
            // this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 1);
          }
        },
        error: ((error: any) => { this.error.handelError(error.status) })
      })
    }
  }

  getSelFanceData(data:any) {
    this.frmCollary.patchValue({
      latitude:data.latitude,
      polygonText:data.polygonText,
      geofenceType:data.geofenceType,
      distance:data.distance,
      collieryAddress:data.collieryAddress
    })
  }

}
