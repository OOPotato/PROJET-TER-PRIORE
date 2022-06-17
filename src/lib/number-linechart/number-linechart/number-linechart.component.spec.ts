import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberLinechartComponent } from './number-linechart.component';

describe('NumberLinechartComponent', () => {
  let component: NumberLinechartComponent;
  let fixture: ComponentFixture<NumberLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NumberLinechartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
