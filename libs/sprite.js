function f(e,t){const r={};for(let n=0;n<e.length;n++){const i=e[n],s=r[i.name]={locations:new Array(i.frames)};if(t.width<=0||t.height<=0)throw new Error("Sprite dimensions must be positive numbers.");for(let o=0;o<i.frames;o++)s.locations[o]={x:(t.width+(t.offsetX??0))*o,y:(t.height+(t.offsetY??0))*n}}return r}export{f as generateSpriteAnimationStates};
