"use strict";(self.webpackChunk_ibyar_webpack=self.webpackChunk_ibyar_webpack||[]).push([[209],{6209:(t,e,s)=>{s.r(e),s.d(e,{FetchApp:()=>n});var l=s(2970),i=s(8558);let n=(()=>{let t,e,s=[(0,i.wA2)({selector:"fetch-app",zone:"manual",template:'\t<div class="row gx-5">\n\t\t<div class="col">\n\t\t\t<ul class="list-group">\n\t\t\t\t<li *for="let item of list" class="list-group-item" [class]="{\'active\': selected === item}" @click="selected = item">\n\t\t\t\t\t{{item}}\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t</div>\n\t\t<div class="col">\n\t\t\t<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), -1)">UP</button>\n\t\t\t<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), +1)">Down</button>\n\t\t\t<button type="button" class="btn btn-link" @click="sortItems(+1)">SORT</button>\n\t\t\t<button type="button" class="btn btn-link" @click="sortItems(-1)">Reverse SORT</button>\n\t\t\t<button type="button" class="btn btn-link" @click="delete(list.indexOf(selected))">DELETE</button>\n\t\t\t<button type="button" class="btn btn-link" @click="appendItem()">APPEND</button>\n\t\t</div>\n\t</div>'})],n=[];return class{static{e=this}static{const i="function"==typeof Symbol&&Symbol.metadata?Object.create(null):void 0;(0,l.xE)(null,t={value:e},s,{kind:"class",name:e.name,metadata:i},null,n),e=t.value,i&&Object.defineProperty(e,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:i}),(0,l.Co)(e,n)}_cd;list=[];selected=1;constructor(t){this._cd=t}onInit(){fetch("https://raw.githubusercontent.com/ibyar/aurora/dev/example/src/fetch/data.json").then((t=>t.json())).then((t=>this.list=t.map((t=>+t)))).then((()=>this._cd.markForCheck()))}move(t,e){this.list&&(-1==e&&t>0?this.list.splice(t+e,2,this.list[t],this.list[t+e]):1==e&&t<this.list.length-1&&this.list.splice(t,2,this.list[t+e],this.list[t]))}delete(t){return this.selected=this.list.at(t-1)??0,this.list.splice(t,1)[0]}appendItem(){this.list.push(this.list.length>0?Math.max.apply(Math,this.list)+1:0),this.selected=this.list.length-1}sortItems(t){this.list.sort(((e,s)=>(e-s)*t))}},e})()}}]);