"""Run Claude Code against loopback inference only. Store counts and hashes, never account state."""
import hashlib, json, os, pathlib, shutil, subprocess, tempfile, threading
from hosts import BRIEFS, HERE, ROOT, Proxy
from http.server import ThreadingHTTPServer

def run(persona,arm):
    with tempfile.TemporaryDirectory(prefix='skillkit-claude-') as name:
        base=pathlib.Path(name);project=base/'project';project.mkdir()
        if persona=='web':(project/'index.html').write_text('<title>Alma Park</title><main><h1>Alma Park</h1><p>Printmaker, editor and illustrator.</p></main>')
        if arm=='snippet':(project/'CLAUDE.md').write_bytes(subprocess.check_output(['node','bin/vibe-skills.js','agent-rule'],cwd=ROOT))
        label='web' if arm=='manual' else 'skillkit'
        script=HERE/'web-mcp.cjs' if arm=='manual' else ROOT/'bin/mcp-server.js'
        cfg=json.dumps({'mcpServers':{label:{'command':shutil.which('node'),'args':[str(script)]}}})
        env={k:v for k,v in os.environ.items() if k in ('PATH','TMPDIR','USER','LANG','SHELL')}
        env.update(HOME=str(base),CLAUDE_CONFIG_DIR=str(base/'cfg'),ANTHROPIC_BASE_URL='http://127.0.0.1:3897',ANTHROPIC_AUTH_TOKEN='local-test',CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC='1',DISABLE_TELEMETRY='1')
        policy=base/'sandbox';policy.write_text('(version 1) (allow default) (deny network*) (allow network-outbound (remote ip "localhost:3897") (remote ip "localhost:3898"))')
        cmd=['sandbox-exec','-f',str(policy),shutil.which('claude'),'-p','--verbose','--output-format','stream-json','--model','local','--no-session-persistence','--strict-mcp-config','--mcp-config',cfg,'--max-turns','5','--allowedTools','mcp__'+label+'__*','--',BRIEFS[persona]+(' using SkillKit (the connected MCP server).' if arm!='manual' else '. Find suitable skills and references using web search.')]
        def files():return {str(p.relative_to(project)):hashlib.sha256(p.read_bytes()).hexdigest() for p in project.rglob('*') if p.is_file()}
        before=files()
        try:
            proc=subprocess.run(cmd,cwd=project,env=env,capture_output=True,text=True,timeout=150)
            events=[json.loads(line) for line in proc.stdout.splitlines() if line.startswith('{')]
        except subprocess.TimeoutExpired as exc:
            partial=exc.stdout or b''
            if isinstance(partial,bytes):partial=partial.decode(errors='replace')
            events=[]
            for line in partial.splitlines():
                try:events.append(json.loads(line))
                except ValueError:pass
        res=next((e for e in reversed(events) if e['type']=='result'),{})
        blocks=[b for e in events if e['type']=='assistant' for b in e.get('message',{}).get('content',[]) if b.get('type')=='tool_use']
        success={b.get('tool_use_id') for e in events if e['type']=='user' for b in e.get('message',{}).get('content',[]) if isinstance(b,dict) and b.get('type')=='tool_result' and not b.get('is_error')}
        names=[b['name'] for b in blocks]
        loaded=[b['input'].get('id') for b in blocks if b['name'].endswith('__get_skill') and b['id'] in success]
        usage=res.get('usage',{});done=res.get('subtype')=='success' and not res.get('is_error')
        out=res.get('result','');after=files()
        return dict(persona=persona,arm=arm,host='Claude Code with local Qwen2.5-1.5B',realSession=True,localInference=True,completed=done,error=None if done else res.get('subtype','Incomplete session'),calledSkillKit=any(n.endswith('__find_kit') for n in names),workingKit=bool(loaded) if arm!='manual' else any(b['name'].endswith('__search_web') and b['id'] in success for b in blocks) and 'github.com/' in out,calls=len(names),toolNames=names,skillsLoaded=loaded,tokens=sum(usage.get(k,0) for k in ('input_tokens','output_tokens','cache_read_input_tokens','cache_creation_input_tokens')),usage=usage,projectFilesChanged=sorted(k for k in before.keys()|after.keys() if before.get(k)!=after.get(k)),responseHash=hashlib.sha256(out.encode()).hexdigest(),mcpStartup=next((e.get('mcp_servers') for e in events if e.get('subtype')=='init'),None))

if __name__=='__main__':
    with ThreadingHTTPServer(('127.0.0.1',3898),Proxy) as service:
        threading.Thread(target=service.serve_forever,daemon=True).start()
        p=HERE.parent/'claude-sessions.json';rows=json.loads(p.read_text()) if p.exists() else []
        for persona in BRIEFS:
            for arm in ('pointer','snippet','manual'):
                if any(r['persona']==persona and r['arm']==arm for r in rows):continue
                rows.append(run(persona,arm));p.write_text(json.dumps(rows,indent=2)+'\n')
        service.shutdown()
