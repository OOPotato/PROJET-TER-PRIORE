import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicLinechartComponent } from './basic-linechart.component';

describe('BasicLinechartComponent', () => {
  let component: BasicLinechartComponent;
  let fixture: ComponentFixture<BasicLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicLinechartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
