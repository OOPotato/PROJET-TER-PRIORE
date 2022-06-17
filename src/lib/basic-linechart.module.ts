import { NgModule } from '@angular/core';
import { NumberLinechartComponent } from './number-linechart/number-linechart/number-linechart.component';
import { EnumLinechartComponent } from './enum-linechart/enum-linechart/enum-linechart.component';
import { BooleanLinechartComponent } from './boolean-linechart/boolean-linechart/boolean-linechart.component';



@NgModule({
  declarations: [
    NumberLinechartComponent,
    EnumLinechartComponent,
    BooleanLinechartComponent,
  ],
  imports: [
  ],
  exports: [
    NumberLinechartComponent,
    EnumLinechartComponent,
    BooleanLinechartComponent,
  ]
})
export class BasicLinechartModule { }
