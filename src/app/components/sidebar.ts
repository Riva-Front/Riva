import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
   <aside class="fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 hidden md:flex flex-col items-center py-6 gap-8 shadow-sm z-50">
        <div class="text-blue-600 font-bold text-xl">
            <img src="/Picture1.png" routerLink="/dashboard-p" alt="RIVA Logo" class="w-12">
        </div>
        <div class="flex flex-col gap-6 text-gray-400">
            <button class="p-2 hover:text-blue-600" routerLink="/dashboard-p"><i class="fas fa-home"></i></button>
            <button class="p-2 hover:text-blue-600" routerLink="/add-new-medication"><i class="fas fa-pills"></i></button>
            <button class="p-2 hover:text-blue-600"><i class="fas fa-user"></i></button>
            <button class="p-2 hover:text-blue-600"><i class="fas fa-phone"></i></button>
            <button class="p-2 hover:text-blue-600" routerLink="/doctor-cards"><i class="fa-solid fa-user-doctor"></i></button>
            <button class="p-2 bg-blue-50 text-blue-600 rounded-lg" routerLink="/chat"><i class="fa-brands fa-rocketchat"></i></button>

        </div>
        <div class="mt-auto">
            <button class="p-2 text-gray-400 hover:text-gray-600"><i class="fas fa-cog"></i></button>
        </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 75px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      background: #ffffff;
      border-right: 1px solid #f0f0f0;
      z-index: 1000;
    }
    
    .logo { margin-bottom: 40px; cursor: pointer; }
    .logo-img { width: 32px; height: auto; }
    
    .nav-icons {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .icon-wrapper {
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%; /* دائرية تماماً مثل الصورة */
      color: #B0B7C3;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .icon-wrapper.active {
      background: #5D5FEF;
      color: #fff;
      box-shadow: 0 4px 15px rgba(93, 95, 239, 0.3);
    }

    .settings-container { margin-top: auto; }
    .settings-icon { color: #B0B7C3; }
  `]
})
export class SidebarComponent {}