import { Component, OnInit } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
@Component({
  selector: 'app-consumer-details',
  templateUrl: './consumer-details.component.html',
  styleUrls: ['./consumer-details.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ConsumerDetailsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  dataSource = ELEMENT_DATA;
  columnsToDisplay = ['srno', 'Challan_No', 'Vehicle_No', 'Mineral','Grade','Colliery_Name','Destination','Quantity'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: PeriodicElement | any;
}

export interface PeriodicElement {
  srno: number;
  Challan_No: number;
  Vehicle_No: number;
  Mineral: string;
  Grade: string;
  Colliery_Name: string;
  Destination: string;
  Quantity: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    srno: 1,
    Challan_No: 123625658,
    Vehicle_No: 1.0079,
    Mineral: 'H',
    Grade:'G3',
        Colliery_Name: 'dsfhsdhfjsdhf',
        Destination: 'djfhsdhfshfsofh',
        Quantity: 123333
  }
];