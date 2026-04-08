import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileServiceTsComponent } from './profile.service.ts.component';

describe('ProfileServiceTsComponent', () => {
  let component: ProfileServiceTsComponent;
  let fixture: ComponentFixture<ProfileServiceTsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileServiceTsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileServiceTsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
