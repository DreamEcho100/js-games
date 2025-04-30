import{buttonPrimaryClassName as r}from"../class-names.js";import{CleanupManager as u}from"../cleanup.js";import{injectStylesheetLink as d,loadManyAssets as f}from"../dom/index.js";import"../math.js";async function g(t){const o=`app-${Math.random().toString(36).slice(2)}`,n=`${o}-go-back-button`,a=new u;return t.stylesheetLink&&d(t.stylesheetLink,a),async e=>{function l(){e.handleGoPrevScreen?.(),a.cleanup()}let i;if(t.assetsInfo){document.startViewTransition(()=>{e.appElem.innerHTML=`
				<main class="flex justify-center items-center p-12 text-lg">
				Loading assets...
				</main>
				`});const[s,c]=await f(t.assetsInfo);if(s){console.error(s),document.startViewTransition(()=>{e.appElem.innerHTML=`<main
			class="p-8 bg-slate-50 dark:bg-slate-900 w-full min-h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
		>
			${e.handleGoPrevScreen?`<button id="${n}" class="${r}">Go Back</button><br /><br />`:""}
			<p class="text-center">Couldn't load the image!</p>
			<button id="reload" class="${r}">Reload</button>
		</main>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:l,silent:!1})}),a.registerEventListener({elem:document.getElementById("reload"),type:"click",listener:()=>{document.startViewTransition(()=>{e.appElem.innerHTML=""}),g(t)}});return}i=c}const m=async s=>document.startViewTransition(()=>{e.appElem.innerHTML=`<main
		class="p-8 bg-slate-50 dark:bg-slate-900 w-full h-full text-slate-900 dark:text-slate-50 flex flex-col gap-4 max-w-full"
	>
		${e.handleGoPrevScreen?`<button id="${n}" class="${r}">Go Back</button>`:""}
		${s}
	</main>`,a.registerEventListener({elem:document.getElementById(n),type:"click",listener:l,silent:!1})}).ready;return t.cb({assets:i,cleanupManager:a,appId:o,goBackButtonId:n,goBack:l,createLayout:m})}}export{g as default};
