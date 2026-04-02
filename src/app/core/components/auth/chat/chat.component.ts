import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SidebarComponent } from "../../../../components/sidebar";
import { ChatListComponent } from "../chat-list/chat-list.component";
import { ChatWindowComponent } from "../chat-window/chat-window.component";
import { FloatingRobotComponent } from "../../../../components/floating-robot";
import { RouterModule } from '@angular/router'; // لدعم الروترات


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [SidebarComponent, ChatListComponent, ChatWindowComponent, FloatingRobotComponent, RouterModule], // تأكد من استيراد RouterModule
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],  // صححت styleUrl → styleUrls
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // لدعم عناصر غير قياسية مثل spline-viewer

})
export class ChatComponent {}