import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-web-layout',
  templateUrl: './web-layout.component.html',
  styleUrls: ['./web-layout.component.scss']
})
export class WebLayoutComponent implements OnInit {
  hideHeader: boolean = true;
  hideFooter: boolean = true;

  constructor(private router: Router) {
    if (this.router.url == '/login' || this.router.url == '/admin/login' || this.router.url == '/forget-password') {
      this.hideHeader = false;
      this.hideFooter = false;
    }
  }

  ngOnInit(): void {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
      if (event.url == '/login' || event.url == '/forget-password') {
        this.hideHeader = false;
        this.hideFooter = false;
      } else {
        this.hideHeader = true;
        this.hideFooter = true;
      }
    }
    })
  }

}
