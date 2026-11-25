import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { scoreSet } from '../score.mjs';
import cards from '../../../lib/kit-cards.js';

// Hardcoded loopback and no redirects. Never transmit a benchmark to a model provider.
function choose(task, options) {
  const payload = JSON.stringify({model:'local',temperature:0,max_tokens:2,
    grammar:'root ::= ' + options.map((_,i)=>JSON.stringify(String(i))).join(' | '),
    messages:[{role:'system',content:'Select the candidate index that best covers the user deliverable and exact constraints. Prefer the first candidate when equally suitable. Return its index.'},
      {role:'user',content:JSON.stringify({task,options})}]});
  return new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:3896,path:'/v1/chat/completions',method:'POST',
      headers:{'content-type':'application/json'},timeout:60000},res=>{
      let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{
        try {
          if(res.statusCode!==200) throw Error('Local chooser unavailable');
          const raw=JSON.parse(body).choices[0].message.content.trim();
          if(!options[Number(raw)] || !/^\d$/.test(raw)) throw Error('Invalid selection');
          resolve(Number(raw));
        } catch(err){reject(err);}
      });
    });
    req.on('timeout',()=>req.destroy(Error('Local chooser timed out')));
    req.on('error',reject);req.end(payload);
  });
}
globalThis.fetch=async()=>{throw Error('External requests disabled')};
const counts={confirmed:0,choices:0,changed:0,abstentions:0};
const histogram={};
const score=await scoreSet(async request=>{
  const first=cards.findKitCards(request);
  if(!first.kitId){counts.abstentions++;return first;}
  const options=[{...first,alternatives:undefined},...(first.alternatives||[])];
  histogram[options.length]=(histogram[options.length]||0)+1;
  const index=await choose(request.task,options);
  counts.confirmed++;if(options.length>1) counts.choices++;if(index) counts.changed++;
  return cards.getKit({request,kitId:options[index].kitId});
});
writeFileSync(new URL('../chooser.json',import.meta.url),JSON.stringify({model:'Qwen2.5-1.5B-Instruct Q4_K_M',counts,histogram,score},null,2)+'\n');
