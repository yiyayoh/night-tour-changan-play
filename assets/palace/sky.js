(function(root){
'use strict';
function create(THREE,hex,rain=false){
 const geometry=new THREE.SphereGeometry(1800,40,24);
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,toneMapped:false,uniforms:{horizonColor:{value:new THREE.Color(/^[a-f0-9]{6}$/i.test(hex)?"#"+hex:"#1b2c3a").convertLinearToSRGB()},cloudCover:{value:rain?1:0}},
 vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}',
 fragmentShader:'precision highp float;uniform vec3 horizonColor;uniform float cloudCover;varying vec3 skyDirection;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+1.0),f.x),f.y);}void main(){vec3 d=normalize(skyDirection);float h=max(0.0,d.y);vec3 color=mix(horizonColor,vec3(.018,.035,.070),pow(h,.48));vec2 uv=vec2(atan(d.x,d.z),asin(clamp(d.y,-1.0,1.0)));vec2 cell=floor(uv*120.0),local=fract(uv*120.0)-.5;float star=step(.992,hash(cell))*(1.0-smoothstep(0.0,.075,length(local)))*.45*smoothstep(.07,.4,h);vec3 moonDir=normalize(vec3(-.45,.40,-.72));float dist=length(d-moonDir);float disc=1.0-smoothstep(.017,.019,dist);float craters=.86+.08*noise(d.xz*480.0);float halo=exp(-dist*36.0)*.055;float cloud=noise(uv*vec2(5.0,18.0))*.65+noise(uv*vec2(12.0,32.0))*.35;color+=vec3(.30,.34,.39)*smoothstep(.67,.90,cloud)*.10*smoothstep(0.0,.08,h);color+=(vec3(star)+vec3(.63,.66,.63)*disc*craters+vec3(.55,.59,.64)*halo)*(1.0-cloudCover);gl_FragColor=vec4(color,1.0);}'});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='palace-night-sky';mesh.frustumCulled=false;mesh.renderOrder=-1000;
 return{mesh,update(camera){mesh.position.copy(camera.position);},dispose(){geometry.dispose();material.dispose();}};
}
root.ChanganPalaceSky={create};
})(typeof window!=='undefined'?window:globalThis);

