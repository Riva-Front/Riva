import { Routes } from '@angular/router';
import { HomeComponent } from './features/components/home/home.component';
import { AboutComponent } from './features/components/about/about.component';
import { FeaturesComponent } from './features/components/features/features.component';
import { ReviewsComponent } from './features/components/reviews/reviews.component';
import { ContactComponent } from './features/components/contact/contact.component';

export const routes: Routes = [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
     {path:'home', component:HomeComponent , title:'home'},
      {path:'about', component:AboutComponent , title:'About'},
       {path:'features', component:FeaturesComponent , title:'Feature'},
        {path:'reviews', component:ReviewsComponent , title:'Reviews'},
         {path:'contact', component:ContactComponent , title:'Contact Us'},
];
