class t{cleanUpItems=[];cleanUp(){for(const e of this.cleanUpItems)e?.();this.cleanUpItems.length=0}register(e){return this.cleanUpItems.push(e)}registerEventListener(e){if(!e.elem){if(e.silent){console.error("Element is required");return}throw new Error("Element is required")}e.elem.addEventListener(e.type,e.listener,e.options),this.register(()=>{e.elem.removeEventListener(e.type,e.listener,e.options)})}}export{t as CleanUpManager};
