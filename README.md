# PROJETTER

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
# BasicLinechart

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.3.

## Installation

- Run `npm install https://github.com/OOPotato/PROJET-TER-PRIORE` to install.

- Run `npm install d3` and `npm install @types/d3` to install pearDependencies.

## Summary

This package contains, a linechart component and some data's examples to try it.

On the linechart component you can :
- zoom with ctrl+wheel
- move the horizontal scrollbar, scroll the time
- move the vertical current time line

You can synchronize the time range and the current time line on several components.

## How to use

- In your app.module.ts, you must add ```BasicLinechartModule``` to imports of ```@NgModule```.

- In your app.component.html, you can add the component :
```html
<number-linechart></number-linechart>
<boolean-linechart></boolean-linechart>
<enum-linechart></enum-linechart>
```
