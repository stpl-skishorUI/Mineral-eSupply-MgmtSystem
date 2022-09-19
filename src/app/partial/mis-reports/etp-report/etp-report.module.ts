import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EtpReportRoutingModule } from './etp-report-routing.module';
import { EtpReportComponent } from './etp-report.component';


@NgModule({
  declarations: [
    EtpReportComponent
  ],
  imports: [
    CommonModule,
    EtpReportRoutingModule
  ]
})
export class EtpReportModule { }
