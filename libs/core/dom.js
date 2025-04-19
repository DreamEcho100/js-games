import{buttonPrimaryClassName as r}from"../class-names.js";import{CleanUpManager as d}from"../cleanup.js";import{injectStylesheetLink as u,loadManyImageElement as f}from"../dom.js";async function g(t){const c=`app-${Math.random().toString(32)}`,a=`go-back-${c}`,l=new d;return t.stylesheetLink&&u(t.stylesheetLink,l),async e=>{function s(){e.handleGoPrevScreen?.(),l.cleanUp()}let o;if(t.assetsUrls){const[n,m]=await f(t.assetsUrls);if(e.appElem.innerHTML=`
			<section class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</section>
			`,n){console.error(n),e.appElem.innerHTML=`<section
				class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
			>
				${e.handleGoPrevScreen?`<button id="${a}" class="${r}">Go Back</button><br /><br />`:""}
				<p class="text-center">Couldn't load the image!</p>
				<button id="reload" class="${r}">Reload</button>
			</section>`,l.registerEventListener({elem:document.getElementById(a),type:"click",listener:s,silent:!1}),l.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",g(t)}});return}o=m}const i=n=>e.appElem.innerHTML=`<section
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${e.handleGoPrevScreen?`<button id="${a}" class="${r}">Go Back</button>`:""}
		${n}
	</section>`;return l.registerEventListener({elem:document.getElementById(a),type:"click",listener:s,silent:!1}),t.cb({assets:o,cleanUpManager:l,appId:c,goBackButtonId:a,goBack:s,createLayout:i})}}export{g as default};
