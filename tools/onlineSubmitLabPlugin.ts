import type { Plugin } from 'vite'

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>L'ura local online submission lab</title>
<style>
body{margin:0;background:#080b16;color:#f6f4ee;font:16px system-ui,sans-serif}main{max-width:900px;margin:auto;padding:40px 24px}
h1{margin-bottom:6px}.warning{padding:12px;border:1px solid #ffcc68;border-radius:8px;color:#ffe5a6;background:#32260c}
form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px;padding:20px;border:1px solid #354361;border-radius:12px;background:#10172a}
label{display:grid;gap:5px;color:#aeb8d0}input,select,button{min-height:42px;padding:8px 10px;border:1px solid #405070;border-radius:8px;background:#0c1427;color:#edf7ff;font:inherit}
.wide{grid-column:1/-1}.checks{display:flex;gap:16px;flex-wrap:wrap}.checks label{display:flex;align-items:center}.checks input{min-height:0;width:18px}
button{cursor:pointer;background:#1b3a44;border-color:#73e0c1;font-weight:700}pre{min-height:120px;padding:16px;overflow:auto;border-radius:10px;background:#050812;color:#9ff0d8}
@media(max-width:650px){form{grid-template-columns:1fr}.wide{grid-column:auto}}
</style></head><body><main>
<p class="warning"><strong>Development-only test data.</strong> This page exists only under Vite dev and submits to the API running at 127.0.0.1:8787.</p>
<h1>Verified submission lab</h1><p>Uses the real attempt issue and completion endpoints. Log in and select a character in the trainer first.</p>
<form id="lab">
<label>Difficulty<select name="difficulty"><option>test</option><option>easy</option><option selected>normal</option><option>hard</option></select></label>
<label>Duty<select name="duty"><option value="crystal">Crystal</option><option value="non-crystal">Non-crystal</option></select></label>
<label>Duration (seconds)<input name="duration" type="number" min="60" max="3600" value="300"></label>
<label>Mistake penalty<input name="penalty" type="number" min="0" max="200" value="0"></label>
<label>Recovery passes (0–5)<input name="recovery" type="number" min="0" max="5" value="5"></label>
<label>Main Ability casts (0–200)<input name="casts" type="number" min="0" max="200" value="20"></label>
<label>Continuous penalty<input name="continuous" type="number" min="0" max="1000" value="0"></label>
<label>Calculated score<input name="score" readonly></label>
<div class="checks wide">
<label><input name="pause" type="checkbox">Paused and resumed</label>
<label><input name="early" type="checkbox">Early kill</label>
<label><input name="p3early" type="checkbox">P3 early clear</label>
<label><input name="crystalClean" type="checkbox" checked>No crystal failures</label>
<label><input name="runeClean" type="checkbox" checked>No rune failures</label>
</div>
<button class="wide" type="submit">Issue and submit verified test result</button>
</form>
<h2>Response</h2><pre id="output">Ready.</pre>
<script>
if(location.hostname==='localhost'){location.replace('http://127.0.0.1:'+location.port+location.pathname+location.search)}
const API='http://127.0.0.1:8787'; const form=document.querySelector('#lab'); const output=document.querySelector('#output');
const value=name=>form.elements[name]; const number=name=>Number(value(name).value);
function score(){const casts=number('casts'),result=Math.max(0,1000-number('penalty')-number('continuous')+number('recovery')*50+casts+Math.floor(casts/20)*50);value('score').value=result;return result}
form.addEventListener('input',score);score();
async function api(path,init={}){const response=await fetch(API+path,{credentials:'include',...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}});const body=await response.json();if(!response.ok)throw new Error(JSON.stringify(body));return body}
form.addEventListener('submit',async event=>{event.preventDefault();output.textContent='Submitting…';try{
 const me=await api('/v1/me'); if(!me.authenticated||!me.csrfToken)throw new Error('Log in through the trainer first.');
 const difficulty=value('difficulty').value,duty=value('duty').value,recovery=number('recovery'),casts=number('casts'),penalty=number('penalty'),durationMs=number('duration')*1000;
 const issued=await api('/v1/attempts',{method:'POST',headers:{'x-csrf-token':me.csrfToken},body:JSON.stringify({difficulty,duty,entryMode:'arena0',phaseScope:'full',trainerVersion:'0.3.0',buildId:'localhost-submit-lab',configurationFingerprint:'localhost-submit-lab',optionalChallenges:[...(recovery?['recovery']:[]),...(casts?['main-ability']:[])]})});
 const phaseKeys=['p1','intermission','p2','p3','p4'],base=Math.floor(durationMs/5),phaseResults=phaseKeys.map((key,index)=>({key,durationMs:index===4?durationMs-base*4:base,mistakes:index===0&&penalty?1:0,recovery:index<recovery?'passed':'missed'}));
 const completed=await api('/v1/attempts/'+encodeURIComponent(issued.attemptId)+'/complete',{method:'POST',headers:{'x-csrf-token':me.csrfToken},body:JSON.stringify({nonce:issued.nonce,durationMs,phaseResults,mistakes:penalty?[{penalty,timeMs:1000,code:'localhost-fixture'}]:[],actions:{recoveryPasses:recovery,mainAbilityCasts:casts,continuousPenalty:number('continuous')},achievementInputs:{wipeCount:0,crystalFailures:value('crystalClean').checked?0:1,runeFailures:value('runeClean').checked?0:1,pauseCycle:value('pause').checked,earlyKill:value('early').checked,p3EarlyClear:value('p3early').checked},submittedScore:score(),trainerVersion:'0.3.0',buildId:'localhost-submit-lab'})});
 const hall=await api('/v1/achievement-hall?limit=10'); output.textContent=JSON.stringify({issued,completed,hall},null,2);
}catch(error){output.textContent=String(error)}})
</script></main></body></html>`

export function onlineSubmitLabPlugin(): Plugin {
  return {
    name: 'lura-online-submit-lab',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/dev/online-submit', (request, response, next) => {
        if (request.url && request.url !== '/' && request.url !== '') return next()
        response.statusCode = 200
        response.setHeader('content-type', 'text/html; charset=utf-8')
        response.setHeader('cache-control', 'no-store')
        response.end(page)
      })
    },
  }
}
