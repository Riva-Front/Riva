import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms'; // لدعم ngModel
import { CommonModule } from '@angular/common'; // لدعم توابع Angular الأساسية
import { RouterModule } from '@angular/router'; // لدعم الروترات

@Component({
  selector: 'app-dashboard-p', // اسم الـ component
  standalone: true, // Standalone component
  imports: [FormsModule, CommonModule, RouterModule], // الموديولات المستوردة
  templateUrl: './dashboard-p.component.html', // رابط ملف HTML
  styleUrls: ['./dashboard-p.component.css'], // رابط ملف CSS
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // لدعم عناصر غير قياسية مثل spline-viewer
})
export class DashboardPComponent {

  painLevel: number = 5; // مستوى الألم الحالي
  selectedMood: number | null = 5; // الحالة المزاجية المحددة (Emoji)
  notes: string = ''; // الملاحظات أو الأعراض

  // مصفوفة الحالات المزاجية + مستوى الألم المرتبط بكل واحد
  moods = [
    { id: 1, emoji: '🤩', level: 1 }, 
    { id: 3, emoji: '😃', level: 3 },
    { id: 5, emoji: '😊', level: 5 },
    { id: 7, emoji: '😔', level: 7 },
    { id: 10, emoji: '😠', level: 10 }, 
  ];

  // مصفوفة الأيام الأسبوعية مع حالة أخذ الدواء لكل يوم
  week = [
    {day: 'S', taken: false },
    { day: 'S', taken: false },
    { day: 'M', taken: false },
    { day: 'T', taken: false },
    { day: 'W', taken: false },
    { day: 'Th', taken: false },
    { day: 'F', taken: false },
  ];

  // حساب نسبة الالتزام بالأدوية (Adherence)
  get adherence(): number {
    const takenDays = this.week.filter(d => d.taken).length; // عدد الأيام التي أخذ فيها الدواء
    return Math.round((takenDays / this.week.length) * 100); // النسبة %
  }

  // عند الضغط على إيموجي لتحديد المزاج
  selectMood(mood: any) {
    this.selectedMood = mood.id; // حفظ الحالة المزاجية
    this.painLevel = mood.level; // تحديث مستوى الألم بناءً على المزاج
  }

  // عند تحريك Slider لتغيير مستوى الألم
  updateMoodFromSlider() {
    const closest = this.moods.reduce((prev, curr) => {
      // اختيار المزاج الأقرب لمستوى الألم الجديد
      return (Math.abs(curr.level - this.painLevel) < Math.abs(prev.level - this.painLevel) ? curr : prev);
    });
    this.selectedMood = closest.id; // تحديث المزاج
  }

  // قلب حالة اليوم (تم أخذ الدواء أو لا)
  toggleDay(day: any) {
    day.taken = !day.taken; // العكس
  }

  // عند الضغط على زر "أخذ الدواء" يتم تعيين جميع الأيام إلى true
  onTakeMedication() {
    this.week.forEach(d => d.taken = true);
  }

  // زر لتأجيل التذكير
  remindLater() {
    console.log('Reminder postponed'); // طباعة رسالة في الكونسول
  }

  // عند الضغط على زر "Submit Check-in"
  submitCheckIn() {
    alert(`Submitted Successfully!
Pain Level: ${this.painLevel}
Mood: ${this.getMoodEmoji()}`); // عرض رسالة للمستخدم بالمستوى الحالي والمزاج
  }

  // إرجاع إيموجي المزاج الحالي
  getMoodEmoji(): string {
    const mood = this.moods.find(m => m.id === this.selectedMood); // البحث عن المزاج
    return mood ? mood.emoji : ''; // إرجاع الإيموجي أو فارغ
  }

} // نهاية الكلاس