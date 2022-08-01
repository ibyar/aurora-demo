import { __decorate, __metadata } from "../../../../tslib/tslib.es6.js";
import { Component, Input, View, HostListener } from '../../../aurora/index.js';
// import structural directives first
// so it can register itself with the html parser as a node
export * from '../directive/add-note.directive.js';
export * from '../directive/notify-user.directive.js';
export * from '../directive/time.directive.js';
export * from './person.js';
let PersonApp = class PersonApp {
    constructor() {
        this.appVersion = '2022.08.01';
        this.title = 'Testing Components';
        this.appName = 'Ibyar Aurora';
        this.name = 'alice';
        this.people = [
            { name: 'alice', age: 39 },
            { name: 'alex', age: 46 },
            { name: 'delilah', age: 25 },
            { name: 'alice', age: 14 },
        ];
        this.i = 0;
        this.fruits = [
            'mangoes',
            'oranges',
            'apples',
            'bananas',
            'cherries',
        ];
        this.selectFruit = 'bananas';
        this.asyncIterable = {
            [Symbol.asyncIterator]() {
                return {
                    i: 0,
                    next() {
                        if (this.i < 3) {
                            return Promise.resolve({ value: this.i++, done: false });
                        }
                        return Promise.resolve({ done: true });
                    }
                };
            }
        };
        this.personUtils = {
            x: 3,
            getDetails(person) {
                return `${person.name} is ${person.age} years old.`;
            }
        };
    }
    onPersonEdit(event) {
        console.log('personEdit:input', event, this.view);
    }
    onPerson(person) {
        console.log('personEdit:person', person, this.view);
    }
    printPerson(person) {
        console.log('printPerson', person);
    }
    onPersonViewClick(event, person) {
        console.log(event, person);
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], PersonApp.prototype, "appVersion", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], PersonApp.prototype, "appName", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], PersonApp.prototype, "name", void 0);
__decorate([
    View(),
    __metadata("design:type", HTMLElement)
], PersonApp.prototype, "view", void 0);
__decorate([
    HostListener('personEdit:input', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Event]),
    __metadata("design:returntype", void 0)
], PersonApp.prototype, "onPersonEdit", null);
__decorate([
    HostListener('personEdit:person', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PersonApp.prototype, "onPerson", null);
PersonApp = __decorate([
    Component({
        selector: 'person-app',
        template: `
		<div *time></div>
		<template *time let-HH="hh" let-MM="mm" let-SS="ss">{{HH}}:{{MM}}:{{SS}}</template>
		<div *add-note>
			{{appVersion}}
			{{appName}}
		</div>
		<notify-user type="primary" message="A simple primary alert—check it out!"></notify-user>

		<h1 [textContent]="title"></h1>
		
		<red-note>text child in directive</red-note>

		<div class="row">
			<div class="col-4">
				{{personUtils.getDetails(people[0])}}
			</div>
			<template *forOf="let {key, value} of people[0] |> keyvalue">
				<div class="col-4">{{key}}: {{value}}</div>
			</template>
		</div>

		<person-edit #personEdit [(person)]="people[0]" (save)="printPerson($event)"></person-edit>

		<progress-bar [value]="+people[0].age" min="0" max="100"></progress-bar>

		
		<h6>if(...){template ref #1} else {template ref #2} else if(....){template ref #3} else {template ref #4}</h6>
		<template					*if="people[0].age < 20; else between_20_39"						>age is less than 20</template>
		<template #between_20_39	*if="people[0].age > 19 && people[0].age < 40; else between_40_79"	>age is between 20 and 39</template>
		<template #between_40_79	*if="people[0].age > 39 && people[0].age < 60; else between_80_100" >age is between 40 and 59</template>
		<template #between_80_100	*if="people[0].age > 59 && people[0].age < 80; else showTest" 		>age is between 60 and 79</template>
		<template #showTest																				>age is more than 80</template>

		<div class="row">
			<div class="col-3">
				<person-view #pm1 [(person)]="people[0]" name="dddddddd" age="34" allowed="true"
					@click="onPersonViewClick('person:clicked', people[0])"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm2 [(person)]="people[1]" name="alex2" age="19"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm3 [(person)]="people[2]" name="jones" age="25"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm4 person="{{people[3]}}" name="alex" age="29"></person-view>
			</div>
		</div>

		<hr>

		<h1>*For Of Directive</h1>
		<h5>*forOf="let user of people"</h5>
		<div class="row">
			<div class="col-3" *forOf="let user of people">
				<p>Name: <span>{{user.name}}</span></p>
				<p>Age: <span>{{user.age}}</span></p>
			</div>
		</div>

		<h1>*For In Directive</h1>
		<h5>*forIn="let key in people[0]"</h5>
		<div class="row">
			<div class="col-3" *forIn="let key in people[0]">
				<p>Key: <span>{{key}}</span></p>
				<p>Value: <span>{{people[0][key]}}</span></p>
			</div>
		</div>

		<h1>*For Await OF Directive</h1>
		<h5>*forAwait="let num of asyncIterable"</h5>
		<div class="row">
			<div class="col-3" *forAwait="let num of asyncIterable">
				<p>num = <span>{{num}}</span></p>
			</div>
		</div>

		<hr>

		<h1>Switch Case Directive</h1>
		<h5>*switch="selectFruit"</h5>
		<ul class="list-group">
			<li class="list-group-item row">
				<div class="col-3" *switch="selectFruit">
					<div *case="'oranges'">Oranges</div>
					<div *case="'apples'">Apples</div>
					<div *case="'bananas'">Bananas</div>
					<div *default>Not Found</div>
				</div>
			</li>
			<li class="list-group-item row">
				<select class="form-select col-3" (change)="selectFruit = this.value">
					<option *forOf="let fruit of fruits"
						[value]="fruit"
						>{{fruit |> titlecase}}</option>
				</select>
			</li>
		</ul>
		<hr>
		`
    })
], PersonApp);
export { PersonApp };
//# sourceMappingURL=person-app.js.map