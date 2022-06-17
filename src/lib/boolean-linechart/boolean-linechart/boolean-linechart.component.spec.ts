import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanLinechartComponent } from './boolean-linechart.component';

describe('BooleanLinechartComponent', () => {
  let component: BooleanLinechartComponent;
  let fixture: ComponentFixture<BooleanLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BooleanLinechartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
