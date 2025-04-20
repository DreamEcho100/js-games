import X from"../../libs/core/dom.js";import{adjustCanvas as T}from"../../libs/dom.js";import{roundToPrecision as W,scale2dSizeToFit as R}from"../../libs/math.js";import{generateSpriteAnimationStates as Y}from"../../libs/sprite.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";const k=await X({assetsInfo:[{type:"image",src:import.meta.resolve("./assets/images/enemies/1.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/2.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/3.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/4.png",new URL(import.meta.url))}],cb:({assets:w,cleanUpManager:s,createLayout:P})=>{const t={render:{width:500,height:700},dom:{}};P(`
			<canvas
				id="vanillaJavascriptSpriteAnimationTechniques"
				width="${t.render.width}"
				height="${t.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 max-w-full mx-auto"
			></canvas>
	
			<fieldset class="flex flex-wrap gap-4 justify-center items-center">
				<legend class="text-center font-medium">Choose Enemy Type</legend>
	
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="enemyType"
						value="enemy1"
						class="accent-blue-500"
						checked
					/>
					<span>Enemy 1</span>
				</label>
	
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="enemyType"
						value="enemy2"
						class="accent-blue-500"
					/>
					<span>Enemy 2</span>
				</label>
	
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="enemyType"
						value="enemy3"
						class="accent-blue-500"
					/>
					<span>Enemy 3</span>
				</label>
	
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="radio"
						name="enemyType"
						value="enemy4"
						class="accent-blue-500"
					/>
					<span>Enemy 4</span>
				</label>
			</fieldset>`);const d=document.getElementById("vanillaJavascriptSpriteAnimationTechniques"),S=document.querySelectorAll("input[name='enemyType']");if(!d)throw new Error("Couldn't find the canvas!");const i=d.getContext("2d"),x=T({canvas:d,ctx:i,onUpdateCanvasSize:e=>{t.dom=e}});s.register(x),i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high";let h=0;const[A,E,y,I]=w;class F{constructor(a){this.img=a.img;const r=R({containerWidth:a.spriteRenderBaseWidth,sourceWidth:a.spriteMeta.width,sourceHeight:a.spriteMeta.height});this.width=r.width,this.height=r.height,this.spriteWidth=a.spriteMeta.width,this.spriteHeight=a.spriteMeta.height,this.x=Math.random()*(t.render.width-this.width),this.y=Math.random()*(t.render.height-this.height),this.currentFrameX=0,this.spriteAnimationStates=Y(a.spriteAnimationStates,a.spriteMeta),this.currentAnimationState=a.currentAnimationState,this.speed=0,this.speedModifier=0,this.movePatternHandler=a.movePatternHandler,this.movePatternMeta=a.createMovePatternMeta?.({img:this.img,width:this.width,height:this.height,spriteWidth:this.spriteWidth,spriteHeight:this.spriteHeight,currentFrameX:this.currentFrameX,x:this.x,y:this.y})??{},a.onInitEnd?.(this)}update(){this.movePatternHandler(this);const a=this.spriteAnimationStates[this.currentAnimationState];h%this.speedModifier===0&&(this.currentFrameX=this.currentFrameX>=a.size-1?0:this.currentFrameX+1)}draw(){i.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),i.strokeRect(this.x,this.y,this.width,this.height)}}const l=6,g=6,M=6,p=9;function n(e){const a=e.spriteMeta??{width:W(e.img.naturalWidth/e.frames,2),height:e.img.naturalHeight};return{img:e.img,frames:e.frames,spriteAnimationStates:e.spriteAnimationStates,spriteMeta:a,currentAnimationState:e.currentAnimationState,createMovePatternMeta:e.createMovePatternMeta,movePatternHandler:e.movePatternHandler,onInitEnd:e.onInitEnd}}const o={enemy1:n({img:A,frames:l,spriteAnimationStates:[{name:"default",frames:l}],currentAnimationState:"default",createMovePatternMeta:()=>({}),movePatternHandler:e=>{e.x+=Math.random()*5-2.5,e.y+=Math.random()*5-2.5},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy2:n({img:E,frames:g,spriteAnimationStates:[{name:"default",frames:g}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*0,angleSpeed:Math.random()*.2,curveY:Math.random()*.7-.35,curveX:Math.random()*.7-.35}),movePatternHandler:e=>{e.x-=e.speed,e.y+=e.movePatternMeta.curveY*Math.sin(e.movePatternMeta.angle),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy3:n({img:y,frames:M,spriteAnimationStates:[{name:"default",frames:M}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*500,angleSpeed:Math.random()*.5+.5,curveY:t.render.width/2,curveX:t.render.height/2}),movePatternHandler:e=>{e.x=e.movePatternMeta.curveX*Math.sin(e.movePatternMeta.angle*Math.PI/45)+(t.render.width/2-e.width/2),e.y=e.movePatternMeta.curveY*Math.cos(e.movePatternMeta.angle*Math.PI/135)+(t.render.height/2-e.height/2),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy4:n({img:I,frames:p,spriteAnimationStates:[{name:"default",frames:p}],currentAnimationState:"default",createMovePatternMeta:e=>({destinationX:Math.random()*(t.render.height-e.height),destinationY:Math.random()*(t.render.width-e.width),destinationFrameMoveInterval:Math.floor(Math.random()*30+10)}),movePatternHandler:e=>{h%e.movePatternMeta.destinationFrameMoveInterval===0&&(e.movePatternMeta.destinationX=Math.random()*(t.render.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.render.height-e.height));let a=e.movePatternMeta.destinationX-e.x,r=e.movePatternMeta.destinationY-e.y;e.x+=a*.05,e.y+=r*.05,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1),e.movePatternMeta.destinationFrameMoveInterval=Math.floor(Math.random()*30+10),e.movePatternMeta.destinationX=Math.random()*(t.render.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.render.height-e.height)}})},m=20,u=new Array(m);let b="enemy1";function v(e,a){for(let r=0;r<a;r++)u[r]=new F({...e,spriteRenderBaseWidth:120})}v(o[b],m),S.forEach(e=>{s.registerEventListener({elem:e,type:"change",listener:a=>{const r=a.target.value;if(!(r in o))throw new Error(`Enemy type "${r}" not found!`);const H=o[r];v(H,m)}})});let c;function f(){i.clearRect(0,0,t.render.width,t.render.height);for(const e of u)e.update(),e.draw();h++,c=requestAnimationFrame(f)}s.register(()=>{c&&cancelAnimationFrame(c)}),f()}});export{k as default};
