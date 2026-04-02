import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'ar' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private platformId = inject(PLATFORM_ID);
  
  // 1. تغيير اللغة الافتراضية هنا من 'ar' إلى 'en'
  currentLang = signal<Language>('en');

  private translations: any = {
    ar: {
      messages: 'المحادثات',
      careTeam: 'فريق الرعاية الخاص بك',
      searchPlaceholder: 'ابحث عن محادثات...',
      selectSpecialty: 'اختر التخصص',
      noConversations: 'لا توجد محادثات',
      typeMessage: 'اكتب رسالتك هنا...',
      summarize: 'تلخيص المحادثة',
      summaryTitle: 'ملخص الاستشارة',
      online: 'متصل',
      offline: 'غير متصل',
      justNow: 'الآن',
      minutesAgo: 'دقيقة',
      hoursAgo: 'ساعة',
      daysAgo: 'يوم',
      tipTitle: 'نصيحة',
      tipText: 'كن دقيقاً في وصف أعراضك للحصول على أفضل توجيه.',
      welcomeLabel: 'مرحباً بك في',
      welcomeName: 'ريفا للذكاء الاصطناعي',
      welcomeSubtitle: 'رفيقك الذكي للرعاية الصحية. نماذجنا المتخصصة جاهزة لمساعدتك في التشخيص والنصائح والدعم النفسي.',
      selectStart: 'اختر تخصصاً من القائمة الجانبية للبدء',
      consultTitle: 'استشارة',
      consultText: 'احصل على نصيحة طبية فورية',
      analyzeTitle: 'تحليل',
      analyzeText: 'فحص التقارير والأعراض',
      supportTitle: 'دعم',
      supportText: 'رعاية نفسية وصحية 24/7',
      footerNote: 'الرسائل آمنة ومشفرة · بدعم من ريفا للذكاء الاصطناعي الطبي',
      clearHistory: 'مسح السجل',
      deleteChat: 'حذف المحادثة',
      confirmClear: 'تم مسح سجل المحادثة.',
      newChat: 'محادثة جديدة',
      langCode: 'AR'
    },
    en: {
      messages: 'Messages',
      careTeam: 'Your care team',
      searchPlaceholder: 'Search conversations...',
      selectSpecialty: 'Select Specialty',
      noConversations: 'No conversations found',
      typeMessage: 'Type your message here...',
      summarize: 'Summarize Conversation',
      summaryTitle: 'Consultation Summary',
      online: 'Online',
      offline: 'Offline',
      justNow: 'Just now',
      minutesAgo: 'm ago',
      hoursAgo: 'h ago',
      daysAgo: 'd ago',
      tipTitle: 'RIVA AI Assistant',
      tipText: '💡 Tip: Be specific about your symptoms for accurate guidance.',
      welcomeLabel: 'Welcome to',
      welcomeName: 'RIVA Medical AI',
      welcomeSubtitle: 'Your intelligent companion for healthcare. Our specialized AI models are ready to assist you with diagnostics, advice, and mental support.',
      selectStart: 'Select a specialty from the sidebar to begin',
      consultTitle: 'Consult',
      consultText: 'Get instant medical advice',
      analyzeTitle: 'Analyze',
      analyzeText: 'Scan reports and symptoms',
      supportTitle: 'Support',
      supportText: '24/7 mental & health care',
      footerNote: 'Messages are secure and encrypted · Powered by RIVA Medical AI',
      clearHistory: 'Clear History',
      deleteChat: 'Delete Chat',
      confirmClear: 'Chat history cleared.',
      newChat: 'New Chat',
      langCode: 'EN'
    }
  };

  t = computed(() => this.translations[this.currentLang()]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('appLang') as Language;
      // 2. إذا وجد لغة مخزنة استخدمها، وإلا استخدم 'en' كافتراضي
      if (saved) {
        this.setLanguage(saved);
      } else {
        this.setLanguage('en'); 
      }
    }
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('appLang', lang);
    }
    // 3. تحديث الاتجاه بناءً على اللغة
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'ar' ? 'en' : 'ar');
  }
}