"use strict";(self.webpackChunk_ibyar_webpack=self.webpackChunk_ibyar_webpack||[]).push([[516],{516:(t,e,s)=>{s.r(e),s.d(e,{JsxComponentTest:()=>f});var r=s(163),n=s(659),a=s(677);const i="fragment";class l extends n.Cl{createElement(t,e,...s){let r;if("string"==typeof t){if(i===t.toLowerCase())return this.createFragmentNode(...s);r=new n.V8(t,e?.is)}else if("function"==typeof t)if(e?.is)r=new n.V8(e.is);else{const e=a.aL.getComponentRef(t);r=new n.V8(e.selector)}if(e?.is&&delete e.is,!r)throw new Error("Invalid tag name.");if(e){const t=Object.keys(e);let s;s=t.find((t=>t.startsWith("#"))),s&&(r.setTemplateRefName(s.substring(1),e[s]),t.splice(t.indexOf(s),1),delete e[s]),s=t.filter((t=>{const s=e[t];return"string"==typeof s&&/\[\[(.+)\]\]/g.test(s)})),s?.length&&s.forEach((s=>{this.addTemplateAttr(r,s,e[s]),t.splice(t.indexOf(s),1),delete e[s]})),s=t.filter((t=>t.startsWith("on"))),s?.length&&s.forEach((s=>{r.addOutput(s.substring(2),e[s]),t.splice(t.indexOf(s),1),delete e[s]}))}const l=this.extractDirectiveNames(r);if(l.length){const t=[];l.forEach((e=>{if(e.startsWith("*"))throw new Error("Invalid attribute name. sx syntax can't support * directive shorthand syntax");const s=new n.kz(e);n.y$.get(e).hasAttributes()&&this.extractDirectiveAttributesFromNode(e,s,r),t.push(s)})),t.length&&(r.attributeDirectives=t)}if(n.y$.has("*"+r.tagName)){const t=new n.WS(r.children),e=new n.tS("*"+r.tagName,t);return e.inputs=r.inputs,e.outputs=r.outputs,e.attributes=r.attributes,e.templateAttrs=r.templateAttrs,e.attributeDirectives=r.attributeDirectives,e}return r}createFragmentNode(...t){let e=t.flatMap((t=>"string"==typeof t?this.parseTextChild(t):[t]));return new n.WS(e)}parseTextChild(t){let e,s=[],r=t,a=r.lastIndexOf("]]");for(;a>-1&&(e=t.lastIndexOf("[[",a),e>-1);){let t=r.substring(a+2);t&&s.push(new n.D7(t));const i=new n.kS(r.substring(e+2,a));s.push(i),r=r.substring(0,e),a=r.lastIndexOf("]]")}return r&&s.push(new n.D7(r)),s.reverse()}addTemplateAttr(t,e,s){if(s=s.trim(),/^\[\[(.+)\]\]$/g.test(s)){const r=s.substring(2,s.length-2);if(!/\[\[(.+)\]\]/g.test(r))return void t.addInput(e,r)}s=this.parseStringTemplate(s),t.templateAttrs?t.templateAttrs.push(new n.Rg(e,s)):t.templateAttrs=[new n.Rg(e,s)]}parseStringTemplate(t){return"`"+this.parseTextChild(t).map((t=>t instanceof n.kS?"${"+t.value+"}":t.value)).join("")+"`"}}const o=new l;var c=s(809);let u=o.createElement(i,null,"text",o.createElement("div",{id:"id"}));console.log(u);let p=class{constructor(){this.sss=""}};p=(0,r.gn)([(0,c.wA2)({selector:"my-component",template:""})],p);let d=o.createElement(i,null,"text1",o.createElement("div",{id:"id","#for":"dddd",for:"(ssss)",about:"[about]",key:"[(data)]"}),"text2",o.createElement(p,{foo:"",bar:""}),o.createElement("template",null),"text [[data]] text");console.log("t",d);let f=class{};f=(0,r.gn)([(0,c.wA2)({selector:"jsx-test",template:d})],f)}}]);