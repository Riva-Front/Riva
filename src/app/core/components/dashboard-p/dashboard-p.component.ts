import { Component, ElementRef, OnInit, ViewChild, HostListener, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HealthDetail {
  title: string;
  text: string;
  color: string;
  location: THREE.Vector3;
}

@Component({
  selector: 'app-dashboard-p',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-p.component.html',
  styleUrls: ['./dashboard-p.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardPComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(); 
  private hotspots: THREE.Object3D[] = [];

  public activeSection: 'Fatigue' | 'Heart' | 'Lungs' | null = null;
  
  public healthData: Record<'Fatigue' | 'Heart' | 'Lungs', HealthDetail> = {
    'Fatigue': { 
      title: 'Brain & Fatigue', 
      text: 'Cognitive load is stable. Fatigue detected: Low (24%).', 
      color: 'text-purple-400',
      location: new THREE.Vector3(0, 1.3, 0.1)
    },
    'Heart': { 
      title: 'Heart Health Check', 
      text: 'BPM: 72. Rhythmic pattern is optimal. Heart health is normal.', 
      color: 'text-red-400',
      location: new THREE.Vector3(0.1, 0.45, 0.2)
    },
    'Lungs': { 
      title: 'Lung Condition', 
      text: 'Oxygen saturation: 98%. Breathing rate: 14/min.', 
      color: 'text-blue-400',
      location: new THREE.Vector3(-0.15, 0.45, 0.2)
    }
  };

  ngOnInit() {
    this.initThreeJS();
    this.loadModel();
    this.animate();
  }

  private initThreeJS() {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5); // تقريب الكاميرا للمجسم

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;

    // إضاءة قوية جداً لظهور المجسم
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // زيادة السطوع
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(0, 5, 5);
    this.scene.add(mainLight);
  }

  private loadModel() {
    const loader = new GLTFLoader();
    // تأكدي من وجود الملف في public/assets/models/human.glb
    loader.load('assets/models/human.glb', (gltf: GLTF) => {
      const model = gltf.scene;
      model.position.y = -1.6;
      model.scale.set(1.5, 1.5, 1.5);
      
      // جعل خامة المجسم تتفاعل مع الضوء بقوة
      model.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          (mesh.material as THREE.MeshStandardMaterial).roughness = 0.3;
        }
      });

      this.scene.add(model);
      Object.entries(this.healthData).forEach(([key, data]) => {
        this.addHotspot(key, data.location);
      });
    });
  }

  private addHotspot(name: string, pos: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.12, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(pos);
    sphere.name = name;
    this.scene.add(sphere);
    this.hotspots.push(sphere);
  }

  @HostListener('click', ['$event'])
  onMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspots);
    if (intersects.length > 0) {
      this.activeSection = intersects[0].object.name as any;
    } else {
      this.activeSection = null;
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    this.renderer.dispose();
  }
}