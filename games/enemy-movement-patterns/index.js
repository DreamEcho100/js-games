import W from"../../libs/core/dom.js";import{adjustCanvas as R}from"../../libs/dom/index.js";import{roundToPrecision as C,scale2dSizeToFit as Y}from"../../libs/math.js";import{generateSpriteAnimationStates as L}from"../../libs/sprite.js";import"../../libs/class-names.js";import"../../libs/cleanup.js";const q=await W({assetsInfo:[{type:"image",src:import.meta.resolve("./assets/images/enemies/1.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/2.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/3.png",new URL(import.meta.url))},{type:"image",src:import.meta.resolve("./assets/images/enemies/4.png",new URL(import.meta.url))}],cb:({appId:P,assets:x,cleanupManager:s,createLayout:S})=>{const l=`${P}-canvas`,t={render:{width:500,height:700},dom:{}};S(`
			<canvas
				id="${l}"
				width="${t.render.width}"
				height="${t.render.height}"
				class="border border-solid border-gray-300 dark:border-gray-700 mx-auto max-w-full w-5xl"
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
			</fieldset>`);const d=document.getElementById(l),E=document.querySelectorAll("input[name='enemyType']");if(!d)throw new Error("Couldn't find the canvas!");const i=d.getContext("2d"),y=R({canvas:d,ctx:i,onUpdateCanvasSize:e=>{t.dom=e}});s.register(y),i.imageSmoothingEnabled=!0,i.imageSmoothingQuality="high";let h=0;const[A,I,F,b]=x;class H{constructor(a){this.img=a.img;const r=Y({containerWidth:a.spriteRenderBaseWidth,sourceWidth:a.spriteMeta.width,sourceHeight:a.spriteMeta.height});this.width=r.width,this.height=r.height,this.spriteWidth=a.spriteMeta.width,this.spriteHeight=a.spriteMeta.height,this.x=Math.random()*(t.render.width-this.width),this.y=Math.random()*(t.render.height-this.height),this.currentFrameX=0,this.spriteAnimationStates=L(a.spriteAnimationStates,a.spriteMeta),this.currentAnimationState=a.currentAnimationState,this.speed=0,this.speedModifier=0,this.movePatternHandler=a.movePatternHandler,this.movePatternMeta=a.createMovePatternMeta?.({img:this.img,width:this.width,height:this.height,spriteWidth:this.spriteWidth,spriteHeight:this.spriteHeight,currentFrameX:this.currentFrameX,x:this.x,y:this.y})??{},a.onInitEnd?.(this)}draw(){i.drawImage(this.img,this.spriteWidth*this.currentFrameX,0,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height),i.strokeRect(this.x,this.y,this.width,this.height)}update(){this.movePatternHandler(this);const a=this.spriteAnimationStates[this.currentAnimationState];h%this.speedModifier===0&&(this.currentFrameX=this.currentFrameX>=a.size-1?0:this.currentFrameX+1)}}const g=6,M=6,p=6,u=9;function n(e){const a=e.spriteMeta??{width:C(e.img.naturalWidth/e.frames,2),height:e.img.naturalHeight};return{img:e.img,frames:e.frames,spriteAnimationStates:e.spriteAnimationStates,spriteMeta:a,currentAnimationState:e.currentAnimationState,createMovePatternMeta:e.createMovePatternMeta,movePatternHandler:e.movePatternHandler,onInitEnd:e.onInitEnd}}const o={enemy1:n({img:A,frames:g,spriteAnimationStates:[{name:"default",frames:g}],currentAnimationState:"default",createMovePatternMeta:()=>({}),movePatternHandler:e=>{e.x+=Math.random()*5-2.5,e.y+=Math.random()*5-2.5},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy2:n({img:I,frames:M,spriteAnimationStates:[{name:"default",frames:M}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*0,angleSpeed:Math.random()*.2,curveY:Math.random()*.7-.35,curveX:Math.random()*.7-.35}),movePatternHandler:e=>{e.x-=e.speed,e.y+=e.movePatternMeta.curveY*Math.sin(e.movePatternMeta.angle),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy3:n({img:F,frames:p,spriteAnimationStates:[{name:"default",frames:p}],currentAnimationState:"default",createMovePatternMeta:()=>({angle:Math.random()*500,angleSpeed:Math.random()*.5+.5,curveY:t.render.width/2,curveX:t.render.height/2}),movePatternHandler:e=>{e.x=e.movePatternMeta.curveX*Math.sin(e.movePatternMeta.angle*Math.PI/45)+(t.render.width/2-e.width/2),e.y=e.movePatternMeta.curveY*Math.cos(e.movePatternMeta.angle*Math.PI/135)+(t.render.height/2-e.height/2),e.movePatternMeta.angle+=e.movePatternMeta.angleSpeed,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1)}}),enemy4:n({img:b,frames:u,spriteAnimationStates:[{name:"default",frames:u}],currentAnimationState:"default",createMovePatternMeta:e=>({destinationX:Math.random()*(t.render.height-e.height),destinationY:Math.random()*(t.render.width-e.width),destinationFrameMoveInterval:Math.floor(Math.random()*30+10)}),movePatternHandler:e=>{h%e.movePatternMeta.destinationFrameMoveInterval===0&&(e.movePatternMeta.destinationX=Math.random()*(t.render.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.render.height-e.height));let a=e.movePatternMeta.destinationX-e.x,r=e.movePatternMeta.destinationY-e.y;e.x+=a*.05,e.y+=r*.05,e.x+e.width<0&&(e.x=t.render.width,e.x=t.render.width,e.y=Math.random()*t.render.height)},onInitEnd:e=>{e.speed=Math.random()*4+1,e.speedModifier=Math.floor(Math.random()*3+1),e.movePatternMeta.destinationFrameMoveInterval=Math.floor(Math.random()*30+10),e.movePatternMeta.destinationX=Math.random()*(t.render.width-e.width),e.movePatternMeta.destinationY=Math.random()*(t.render.height-e.height)}})},m=20,v=new Array(m);let X="enemy1";function f(e,a){for(let r=0;r<a;r++)v[r]=new H({...e,spriteRenderBaseWidth:120})}f(o[X],m),E.forEach(e=>{s.registerEventListener({elem:e,type:"change",listener:a=>{const r=a.target.value;if(!(r in o))throw new Error(`Enemy type "${r}" not found!`);const T=o[r];f(T,m)}})});let c;function w(){i.clearRect(0,0,t.render.width,t.render.height);for(const e of v)e.update(),e.draw();h++,c=requestAnimationFrame(w)}s.register(()=>{c&&cancelAnimationFrame(c)}),w()}});export{q as default};
