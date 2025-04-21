import{buttonPrimaryClassName as r}from"../class-names.js";import{CleanupManager as u}from"../cleanup.js";import{injectStylesheetLink as d,loadManyAssets as f}from"../dom.js";import"../math.js";async function g(t){const c=`app-${Math.random().toString(36).slice(2)}`,l=`${c}-go-back-button`,a=new u;return t.stylesheetLink&&d(t.stylesheetLink,a),async e=>{function s(){e.handleGoPrevScreen?.(),a.cleanup()}let o;if(t.assetsInfo){e.appElem.innerHTML=`
			<main class="flex justify-center items-center p-12 text-lg">
			Loading assets...
			</main>
			`;const[n,m]=await f(t.assetsInfo);if(n){console.error(n),e.appElem.innerHTML=`<main
				class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
			>
				${e.handleGoPrevScreen?`<button id="${l}" class="${r}">Go Back</button><br /><br />`:""}
				<p class="text-center">Couldn't load the image!</p>
				<button id="reload" class="${r}">Reload</button>
			</main>`,a.registerEventListener({elem:document.getElementById(l),type:"click",listener:s,silent:!1}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{e.appElem.innerHTML="",g(t)}});return}o=m}const i=n=>{e.appElem.innerHTML=`<main
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${e.handleGoPrevScreen?`<button id="${l}" class="${r}">Go Back</button>`:""}
		${n}
	</main>`,a.registerEventListener({elem:document.getElementById(l),type:"click",listener:s,silent:!1})};return t.cb({assets:o,cleanupManager:a,appId:c,goBackButtonId:l,goBack:s,createLayout:i})}}export{g as default};
