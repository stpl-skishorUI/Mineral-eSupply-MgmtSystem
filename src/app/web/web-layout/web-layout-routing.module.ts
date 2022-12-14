import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('../home/home.module').then(m => m.HomeModule),data: { title: ' Home' }},
  { path: 'login', loadChildren: () => import('../login/login.module').then(m => m.LoginModule), data: { title: 'Login' }},
  { path: 'forget-password', loadChildren: () => import('../../web/forget-password/forget-password.module').then(m => m.ForgetPasswordModule), data: { title: 'Forget Password' }},
  { path: 'about-us', loadChildren: () => import('../../web/about-us/about-us.module').then(m => m.AboutUsModule), data: { title: 'About Us' } },
  { path: 'screen-reader-access', loadChildren: () => import('../../web/screen-reader-access/screen-reader-access.module').then(m => m.ScreenReaderAccessModule), data: { title: 'Screen Reader Access' } },
  { path: 'coal-allocation-web', loadChildren: () => import('../../web/application/coal-allocation/coal-allocation.module').then(m => m.CoalAllocationModule), data: { title: 'Coal Allocation' }  },
  { path: 'contact-us', loadChildren: () => import('../../web/contact-us/contact-us.module').then(m => m.ContactUsModule), data: { title: 'Contact Us' }  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebLayoutRoutingModule { }
