"use strict";(self.webpackChunk_ibyar_webpack=self.webpackChunk_ibyar_webpack||[]).push([[624],{624:(t,e,o)=>{o.r(e),o.d(e,{Editor:()=>r,EditorApp:()=>s});var i=o(163),d=o(809);let r=class{constructor(){this.text=""}};(0,i.gn)([(0,d.IIB)(),(0,i.w6)("design:type",Object)],r.prototype,"text",void 0),r=(0,i.gn)([(0,d.wA2)({selector:"text-editor",template:'<input type="number" [(value)]="text" />'})],r);let s=class{constructor(){this.model={text:"25"}}};s=(0,i.gn)([(0,d.wA2)({selector:"app-edit",template:'\n\t<div>{{ model |> json }}</div>\n\t<text-editor id="editor_0" [(text)]="model.text" ></text-editor>\n\t<text-editor id="editor_1" [(text)]="model.text" *if="+model.text > 30"></text-editor>\n\t'})],s)}}]);