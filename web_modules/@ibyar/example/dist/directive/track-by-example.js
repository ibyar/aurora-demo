import { __decorate } from "../../../../tslib/tslib.es6.js";
import { Component } from '../../../aurora/index.js';
let TrackByComponent = class TrackByComponent {
    constructor() {
        this.heros = [
            {
                "id": 1,
                "title": "Super Man"
            },
            {
                "id": 2,
                "title": "Spider Man"
            },
            {
                "id": 3,
                "title": "Aladdin"
            },
            {
                "id": 4,
                "title": "Downton Abbey"
            }
        ];
    }
    onInit() {
    }
    trackById(index, hero) {
        return hero.id;
    }
    trackByTitle(index, hero) {
        return hero.title;
    }
    changeIds() {
        const heros = this.heros.map(h => Object.assign({}, h));
        heros.forEach((h, i) => h.id += this.getRandomInt(0, 3));
        this.heros = heros;
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    ;
};
TrackByComponent = __decorate([
    Component({
        selector: 'track-by-component',
        template: `
		<div class="row">
			<div class="col-10">
				<div class="row p-2">
					*for="const hero of heros; trackBy trackById; let i = index;"
					<div *for="const hero of heros; trackBy trackById; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
				<div class="row p-2">
					*for="const hero of heros; trackBy: trackByTitle; let i = index;"
					<div *for="const hero of heros; trackBy: trackByTitle; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
				<div class="row p-2">
					*for="const hero of heros; trackBy = (index, heroRef) => heroRef.id; let i = index;"
					<div *for="const hero of heros; trackBy = (index, heroRef) => heroRef.id; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
			</div>
			<div class="col-2">
				<div class="btn-group-vertical">
					<button type="button" class="btn btn-outline-primary" @click="changeIds()">Change IDS</button>
				</div>
			</div>
		</div>
	`
    })
], TrackByComponent);
export { TrackByComponent };
//# sourceMappingURL=track-by-example.js.map