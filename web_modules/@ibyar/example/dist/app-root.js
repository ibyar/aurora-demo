import { __decorate } from "../../../tslib/tslib.es6.js";
import { Component } from '../../aurora/index.js';
import { TrackByComponent } from './directive/track-by-example.js';
import { FetchApp } from './fetch/fetch-app.js';
import { PersonApp } from './person-app/person-app.js';
import { PipeAppComponent } from './pipe-app/pipe-test.js';
import { Binding2Way } from './two-way/binding-2-way.js';
import { EditorApp } from './two-way/shared-model.js';
import { VideoPlayList } from './video-player/video.js';
let AppRoot = class AppRoot {
    constructor() {
        this.selectedComponent = TrackByComponent;
        this.appList = [
            {
                title: 'Track By Example',
                component: TrackByComponent,
            },
            {
                title: 'Directives',
                component: PersonApp,
            },
            {
                title: 'Pipes',
                component: PipeAppComponent,
            },
            {
                title: 'Two way Binding',
                component: Binding2Way,
            },
            {
                title: 'Edit',
                component: EditorApp,
            },
            {
                title: 'Play List',
                component: VideoPlayList,
            },
            {
                title: 'HTTP Fetch',
                component: FetchApp,
            },
        ];
    }
};
AppRoot = __decorate([
    Component({
        selector: 'app-root',
        template: `
	<div class="container-fluid" >
		<nav class="nav nav-pills nav-fill">
			<template *forOf="let app of appList">
				<li class="nav-item">
					<a  class="nav-link" href="javascript:void(0)" 
						[class]="{active: selectedComponent == app.component}"
						@click="selectedComponent = app.component"
					>{{app.title}}</a>
				</li>
			</template>
		</nav>
		<div class="row my-2">
			<div class="col-12">
				<component-outlet [component]="selectedComponent"></component-outlet>
			</div>
		</div>
	</div>`
    })
], AppRoot);
export { AppRoot };
//# app-root.js.map