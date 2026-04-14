import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-dashboard-p',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard-p.component.html',
  styleUrls: ['./dashboard-p.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardPComponent {

  painLevel: number = 5; 
  selectedMood: number | null = 5; 
  notes: string = ''; 
  sleepQuality: string = ''; 

  // مصفوفة الحالات المزاجية
  moods = [
    { id: 1, emoji: '🤩', level: 1 }, 
    { id: 3, emoji: '😃', level: 3 },
    { id: 5, emoji: '😊', level: 5 },
    { id: 7, emoji: '😔', level: 7 },
    { id: 10, emoji: '😠', level: 10 }, 
  ];

  // مصفوفة الأيام الأسبوعية
  week = [
    { day: 'S', taken: false },
    { day: 'M', taken: true },  // مثال ليوم مأخوذ مسبقاً
    { day: 'T', taken: false },
    { day: 'W', taken: false },
    { day: 'Th', taken: false },
    { day: 'F', taken: false },
    { day: 'Sa', taken: false },
  ];

  // حساب نسبة الالتزام بالأدوية (تتحدث تلقائياً عند تغيير حالة الأيام)
  get adherence(): number {
    const takenDays = this.week.filter(d => d.taken).length;
    return Math.round((takenDays / this.week.length) * 100);
  }

  // دالة أخذ الدواء (تؤثر على أول يوم متاح)
  onTakeMedication() {
    const nextDayToTake = this.week.find(d => !d.taken);
    if (nextDayToTake) {
      nextDayToTake.taken = true;
    } else {
      alert("All medications for this week are completed! 🎉");
    }
  }

  remindLater() {
    alert('Reminder snoozed for 30 minutes.');
  }

  setSleepQuality(value: string) {
    this.sleepQuality = value;
  }

  selectMood(mood: any) {
    this.selectedMood = mood.id;
    this.painLevel = mood.level;
  }

  updateMoodFromSlider() {
    const closest = this.moods.reduce((prev, curr) => {
      return (Math.abs(curr.level - this.painLevel) < Math.abs(prev.level - this.painLevel) ? curr : prev);
    });
    this.selectedMood = closest.id;
  }

  toggleDay(day: any) {
    day.taken = !day.taken;
  }

  submitCheckIn() {
    alert(`Submitted Successfully!
Pain Level: ${this.painLevel}
Mood: ${this.getMoodEmoji()}
Sleep Quality: ${this.sleepQuality}`);
  }

  getMoodEmoji(): string {
    const mood = this.moods.find(m => m.id === this.selectedMood);
    return mood ? mood.emoji : '';
  }
}