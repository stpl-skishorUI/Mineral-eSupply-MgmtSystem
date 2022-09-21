import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/configs/config.service';
import { CallApiService } from 'src/app/core/services/call-api.service';
import { CommonApiCallService } from 'src/app/core/services/common-api-call.service';
import { CommonMethodsService } from 'src/app/core/services/common-methods.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { FormsValidationService } from 'src/app/core/services/forms-validation.service';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { AddUserComponent } from './add-user/add-user.component';
@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss']
})
export class RegisterUserComponent implements OnInit {
  displayedColumns: string[] = ['srno', 'fullName', 'mobileNo', 'designation', 'userType', 'userSubType','districtName','action'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource: any;
  filterForm!: FormGroup;
  totalRows: number = 0;
  pageNumber: number = 1;
  stateArray: any[] =[];
  usertypearray: any[]=[];
  constructor(private fb: FormBuilder,
    public commonMethod: CommonMethodsService,
    public apiService: CallApiService,
    public validation: FormsValidationService,
    public error: ErrorHandlerService,
    public dialog: MatDialog,
    public configService:ConfigService,
    public commonService: CommonApiCallService,
    private spinner: NgxSpinnerService, private router: Router) { }

  ngOnInit(): void {
    this.defaultForm();
    this.getData();
  }

  defaultForm() {
    this.filterForm = this.fb.group({
      stateId: [0],
      UserTypeId: [0],
      Search: [''],
      pageno: [''],
      pagesize: [''],
    })
    this.getState();
  }

  getData() {
    this.spinner.show()
    let formValue = this.filterForm.value;
    let paramList: string = "stateId=" + formValue.stateId + "&UserTypeId=" + formValue.UserTypeId + "&pageno=" + this.pageNumber + "&pagesize=" + 10 ;
    this.commonMethod.checkDataType(formValue.Search.trim()) == true ? paramList += "&Search=" + formValue.Search : '';
    this.apiService.setHttp('get', "UserRegistration?" + paramList, false, false, false, 'WBMiningService');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.responseData.responseData1) {
          this.dataSource = new MatTableDataSource(res.responseData.responseData1);
          this.dataSource.sort = this.sort;
          this.totalRows = res.responseData.responseData2.pageCount;
          this.totalRows > 10 && this.pageNumber == 1 ? this.paginator?.firstPage() : '';
          this.spinner.hide();

        } else {
          this.spinner.hide();
          this.dataSource = []
          this.totalRows = 0;
          if (res.statusCode != "404") {
            this.commonMethod.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.commonMethod.matSnackBar(res.statusMessage, 1);
          }
        }
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    });
  }

  searchData(){
    this.pageNumber = 1;
    this.getData();
  }

  pageChanged(event: any) {
    this.pageNumber = event.pageIndex + 1;
    this.getData();
  }

  deleteUser(id:any){
    let obj:any = ConfigService.dialogObj;
    obj['p1'] = 'Are you sure you want to delete this record?';
    obj['cardTitle'] = 'Delete';
    obj['successBtnText'] = 'Delete';
    obj['cancelBtnText'] =  'Cancel';

    const dialog = this.dialog.open(ConfirmationComponent, {
      width:this.configService.dialogBoxWidth[0],
      data: obj,
      disableClose: this.configService.disableCloseBtnFlag,
    })
    dialog.afterClosed().subscribe(res => {
     if(res == 'Yes'){
      let obj ={
        "id":id,
        "deletedBy": 1
      }
      this.apiService.setHttp('DELETE', "UserRegistration/DeleteUSer" , false, obj, false, 'WBMiningService');
      this.apiService.getHttp().subscribe({
        next: (responseData: any) => {
          if (res.statusCode == 200 ) {
            this.commonMethod.matSnackBar(responseData.statusMessage,0);
            this.getData();
          } else {
              this.commonMethod.checkDataType(responseData.statusMessage) == false ? this.error.handelError(responseData.statusCode) : this.commonMethod.matSnackBar(responseData.statusMessage, 1);
          }
        },
        error: ((error: any) => { this.error.handelError(error.status) })
      });
     }
    })
  }

  openUserModal(obj?: any) {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '600px',
      height: 'auto',
      disableClose: true,
      data: obj ? obj : '',
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result == 'post') {

      }
    });
  }

  getState(){
    this.stateArray =[];
    this.commonService.getState().subscribe({
      next: (response: any) => {
       this.stateArray.push({ 'value': 0, 'text': 'All State' }, ...response);
       this.getusertype()
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

  getusertype(){
    this.commonService.getuserType().subscribe({
      next: (response: any) => {
       this.usertypearray.push({ 'value': 0, 'text': 'All User Type' }, ...response);
      },
      error: ((error: any) => { this.error.handelError(error.status) })
    })
  }

}
