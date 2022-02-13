import { __decorate } from "../../../../tslib/tslib.es6.js";
import { Component } from '../../../aurora/index.js';
import { interval } from '../../../../rxjs/dist/esm5/index.js';
let PipeAppComponent = class PipeAppComponent {
    constructor() {
        this.text = 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups';
        this.obj = {
            a: [1, 2, 3],
            b: 'property b',
            c: {
                d: [],
                e: 4,
                f: [{ 5: 'g' }]
            }
        };
        this.keyValueObject = {
            1: 100,
            a: 'A00'
        };
        this.keyValueArray = [200, 300];
        this.keyValueMap = new Map([[1, 400], [2, 500], [3, 'B200']]);
        this.observable = interval(1000);
        this.array = ['a', 'b', 'c', 'd'];
        this.users = [
            { firstName: 'Tinu', lastName: 'Elejogun', age: 14 },
            { firstName: 'Mark', lastName: 'Kostrzewski', age: 25 },
            { firstName: 'Lily', lastName: 'McGarrett', age: 18 },
            { firstName: 'Adela', lastName: 'Athanasios', age: 22 },
        ];
        this.colors = [
            '--bs-blue',
            '--bs-indigo',
            '--bs-purple',
            '--bs-pink',
            '--bs-red',
            '--bs-orange',
            '--bs-yellow',
            '--bs-green',
            '--bs-teal',
            '--bs-cyan',
            '--bs-white',
            '--bs-gray',
            '--bs-gray-dark'
        ];
        this.currentColor = this.colors[0];
        this.heightPX = 10;
    }
    onInit() {
        let index = 0;
        this.subscription = this.observable.subscribe(() => {
            if (index === this.colors.length) {
                index = 0;
            }
            this.currentColor = this.colors[index++];
            this.heightPX += 10;
        });
    }
    onDestroy() {
        this.subscription.unsubscribe();
    }
};
PipeAppComponent = __decorate([
    Component({
        selector: 'pipe-app',
        template: `
	<style>.bs-color{color: var({{currentColor}});}</style>
	<div style="color: var({{currentColor}});"> set style color by style="color: var({{currentColor}});"</div>
	<div [style]="'color: var(' + currentColor + ');'"> set style color by [style]="'color: var(' + currentColor + ');'" </div>
	<div [style.color]="'var(' + currentColor + ')'"> set style color by [style.color]="'var(' + currentColor + ')'" </div>
	<div [style]="{color: 'var(' + currentColor + ')'}"> set style color by [style]="{color: 'var(' + currentColor + ')'}" </div>
	<!-- <div [class.bsColor]="currentColor === '--bs-red' "> set style color by [style.color]="'var(' + currentColor + ')'" </div> -->
	<div *for="var color of colors">
		color: {{color}} <span *if="color === currentColor" class="bs-color"> => Current Color ='{{currentColor}}'</span>
	</div>
    <table class="table">
        <thead>
            <tr>
                <th class="bs-color" scope="col">pipe</th>
                <th class="bs-color" scope="col">expression</th>
                <th class="bs-color" scope="col">view</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>async</td>
                <td>observable |> async</td>
                <td>{{observable |> async}}</td>
            </tr>
            <tr>
                <td>*</td>
                <td>text</td>
                <td>{{text}}</td>
            </tr>
            <tr>
                <td>lowercase</td>
                <td>text |> lowercase</td>
                <td>{{text |> lowercase}}</td>
            </tr>
            <tr>
                <td>titlecase</td>
                <td>text |> titlecase</td>
                <td>{{text |> titlecase}}</td>
            </tr>
            <tr>
                <td>uppercase</td>
                <td>text |> uppercase</td>
                <td>{{text |> uppercase}}</td>
            </tr>
            <tr>
                <td>json</td>
                <td>obj |> json</td>
                <td>{{obj |> json}}</td>
            </tr>
            <tr>
                <td>json <small>pre element</small></td>
                <td>obj |> json:undefined:2</td>
                <td>
                    <pre>{{obj |> json:undefined:2}}</pre>
                </td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueMap |> keyvalue</td>
                <td>{{keyValueMap |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>array |> slice:1:3</td>
                <td>{{array |> slice:1:3}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>slice(array, 1, 3)</td>
                <td>{{slice(array, 1, 3)}}</td>
            </tr>
            <tr>
                <td>call windows method directly</td>
                <td>3345.54645 |> Math.trunc</td>
                <td>{{3345.54645 |> Math.trunc}}</td>
            </tr>
        </tbody>
    </table>

	<table class="table" aria-label="table">
		<thead>
			<tr elHeight="350px">
				<th scope="col">#</th>
				<th scope="col">First</th>
				<th scope="col">Last</th>
				<th scope="col">Age</th>
			</tr>
		</thead>
		<tbody>
			<template *forOf="let user of users; index as idx; even as isEven; odd as isOdd; count as tableLength; first as isFirst; last as isLast">
				<tr [class]="{'table-info': isEven, 'table-danger': isOdd}">
					<th scope="row">{{ ({idx, tableLength, isEven, isOdd, isFirst, isLast }) |> json }}</th>
					<td>{{user.firstName}}</td>
					<td>{{user.lastName}}</td>
					<td>{{user.age}}<div *if="user.age > 18">🕺</div></td>
				</tr>
			</template>
		</tbody>
	</table>
    `
    })
], PipeAppComponent);
export { PipeAppComponent };
//# pipe-test.js.map