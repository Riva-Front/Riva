import { Routes } from '@angular/router';
import { HomeComponent } from './features/components/home/home.component';
import { AboutComponent } from './features/components/about/about.component';
import { FeaturesComponent } from './features/components/features/features.component';
import { ReviewsComponent } from './features/components/reviews/reviews.component';
import { ContactComponent } from './features/components/contact/contact.component';
import { ChatComponent } from './features/components/chat/chat/chat.component';
import { DashboardComponent } from './features/components/dashboard/dashboard/dashboard.component';
import { ProfileComponent } from './features/components/profile/profile/profile.component';

export const routes: Routes = [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
     {path:'home', component:HomeComponent , title:'home'},
      {path:'about', component:AboutComponent , title:'About'},
       {path:'features', component:FeaturesComponent , title:'Feature'},
        {path:'reviews', component:ReviewsComponent , title:'Reviews'},
         {path:'contact', component:ContactComponent , title:'Contact Us'},
          {path:'Dashboard', component:DashboardComponent , title:'Dashboard' , data: { hideLayout: true }},
            {path:'Profile', component:ProfileComponent , title:'Profile', data: { hideLayout: true }},
           
             
];
