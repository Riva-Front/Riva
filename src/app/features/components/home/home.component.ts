// import { Component } from '@angular/core';


// @Component({
//   selector: 'app-home',
//   imports: [],
//   templateUrl: './home.component.html',
//   styleUrl: './home.component.css',
// })
// export class HomeComponent {





// }





import { Component } from '@angular/core';

interface HealthTip {
  title: string;
  text: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  healthTips: HealthTip[] = [
    { title: 'Stay Hydrated!', text: 'Drinking 8 glasses of water daily helps regulate blood pressure.' },
    { title: 'Check Your Sugar', text: 'Regular monitoring helps you understand your body better.' },
    { title: 'Walk Regularly', text: 'A 15-minute walk after meals improves digestion significantly.' },
    { title: 'Sleep Well', text: '7-8 hours of sleep helps manage stress hormones.' },
  ];

  currentIndex = 0;

  // نغيّر النصيحة
  nextTip() {
    this.currentIndex = (this.currentIndex + 1) % this.healthTips.length;
  }

  // النصيحة الحالية
  get currentTip() {
    return this.healthTips[this.currentIndex];
  }
}