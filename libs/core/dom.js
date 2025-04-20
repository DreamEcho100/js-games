import{buttonPrimaryClassName as r}from"../class-names.js";import{CleanUpManager as d}from"../cleanup.js";import{injectStylesheetLink as u,loadManyAssets as f}from"../dom.js";import"../math.js";async function g(t){const c=`app-${Math.random().toString(32)}`,l=`go-back-${c}`,a=new d;return t.stylesheetLink&&u(t.stylesheetLink,a),async e=>{function s(){e.handleGoPrevScreen?.(),a.cleanUp()}let o;if(t.assetsInfo){const[n,m]=await f(t.assetsInfo);if(e.appElem.innerHTML=`
			<section class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</section>
			`,n){console.error(n),e.appElem.innerHTML=`<section
				class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
			>
				${e.handleGoPrevScreen?`<button id="${l}" class="${r}">Go Back</button><br /><br />`:""}
				<p class="text-center">Couldn't load the image!</p>
				<button id="reload" class="${r}">Reload</button>
			</section>`,a.registerEventListener({elem:document.getElementById(l),type:"click",listener:s,silent:!1}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",g(t)}});return}o=m}const i=n=>{e.appElem.innerHTML=`<section
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${e.handleGoPrevScreen?`<button id="${l}" class="${r}">Go Back</button>`:""}
		${n}
	</section>`,a.registerEventListener({elem:document.getElementById(l),type:"click",listener:s,silent:!1})};return t.cb({assets:o,cleanUpManager:a,appId:c,goBackButtonId:l,goBack:s,createLayout:i})}}export{g as default};
