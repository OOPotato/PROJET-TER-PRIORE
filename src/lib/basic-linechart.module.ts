import { NgModule } from '@angular/core';
import { BasicLinechartComponent } from './basic-linechart.component';
import { LinechartGroupComponent } from './linechart-group/linechart-group.component';



@NgModule({
  declarations: [
    BasicLinechartComponent,
    LinechartGroupComponent,
  ],
  imports: [
  ],
  exports: [
    BasicLinechartComponent
  ]
})
export class BasicLinechartModule { }
