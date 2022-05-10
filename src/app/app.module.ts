import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {BasicLinechartModule} from "../lib/basic-linechart.module";
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BasicLinechartModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
