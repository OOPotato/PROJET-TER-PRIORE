import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnumLinechartComponent } from './enum-linechart.component';

describe('EnumLinechartComponent', () => {
  let component: EnumLinechartComponent;
  let fixture: ComponentFixture<EnumLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnumLinechartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnumLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
