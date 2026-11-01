const player=document.getElementById('comparison'),names={adl:'AdLib',rld:'LAPC-I / CM-32L',scc:'SCC-1A',sc55:'SC-55'};
let change=0;
for(const button of document.querySelectorAll('[data-sound]'))button.addEventListener('click',()=>{
 const generation=++change,time=player.currentTime||0,playing=!player.paused;
 for(const other of document.querySelectorAll('[data-sound]'))other.setAttribute('aria-pressed',String(other===button));
 player.pause();player.src=`../audio/title-${button.dataset.sound}.ogg`;
 document.getElementById('sound-label').textContent=names[button.dataset.sound]+' · 18-second excerpt';
 player.addEventListener('loadedmetadata',()=>{if(generation!==change)return;player.currentTime=Math.min(time,Math.max(0,player.duration-.1));if(playing)player.play().catch(()=>{});},{once:true});player.load();
});
