"""Run Codex with OS-enforced local inference. Manual web queries are fixed category strings."""
import hashlib, http.server, json, os, pathlib, shutil, subprocess, tempfile, threading, urllib.parse, urllib.request

HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]
BRIEFS={'web':'Redesign my portfolio website','video':'Edit my interview in DaVinci Resolve and deliver an editable timeline','motion':'Make animated captions for my launch video in Remotion','design':'Design a printable poster for the neighborhood jazz night','copy':'Write a newsletter from my notes about our new Sunday opening'}
TERMS={'web':'frontend design','video':'video editing','motion':'remotion captions','design':'graphic design','copy':'newsletter writing'}
class Proxy(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        cat=self.path[1:]
        if cat not in TERMS:self.send_error(404);return
        url='https://api.github.com/search/repositories?'+urllib.parse.urlencode(dict(q='topic:agent-skills '+TERMS[cat],per_page=5))
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'SkillKit-GAT'}),timeout=12) as r:raw=json.load(r)
            data=json.dumps([{k:item[k] for k in ['full_name','html_url','description']} for item in raw['items']]).encode()
            self.send_response(200);self.end_headers();self.wfile.write(data)
        except Exception:self.send_error(503)
    def log_message(self,*args):pass

def run(cat,arm):
    with tempfile.TemporaryDirectory(prefix='skillkit-session-') as temp:
        base=pathlib.Path(temp);proj=base/'project';proj.mkdir()
        if cat=='web':(proj/'index.html').write_text('<title>Alma Park</title><main><h1>Alma Park</h1><p>Printmaker, editor and illustrator.</p></main>')
        if arm=='snippet':(proj/'AGENTS.md').write_text(subprocess.check_output(['node','bin/vibe-skills.js','agent-rule'],cwd=ROOT,text=True))
        sb=base/'policy';sb.write_text('(version 1) (allow default) (deny network*) (allow network-outbound (remote ip "localhost:3897") (remote ip "localhost:3898"))')
        env={k:v for k,v in os.environ.items() if k in ['PATH','HOME','TMPDIR','LANG','USER','SHELL']};env['CODEX_HOME']=str(base/'config');(base/'config').mkdir()
        cmd=['sandbox-exec','-f',str(sb),'codex','exec','--ephemeral','--ignore-user-config','--ignore-rules','--skip-git-repo-check','-s','read-only','--json','-m','local','-C',str(proj)]
        tool='web' if arm=='manual' else 'skillkit'
        script=HERE/'web-mcp.cjs' if arm=='manual' else ROOT/'bin/mcp-server.js'
        for cfg in ['model_provider="gat_local"','model_providers.gat_local={name="Local",base_url="http://127.0.0.1:3897/v1",wire_api="responses",requires_openai_auth=false}','analytics.enabled=false','otel.exporter="none"','web_search="disabled"',f'mcp_servers.{tool}.command='+json.dumps(shutil.which('node')),f'mcp_servers.{tool}.args='+json.dumps([str(script)])]:cmd.extend(['-c',cfg])
        brief=BRIEFS[cat]+(' using SkillKit (the connected MCP server).' if arm!='manual' else '. Find suitable skills and references using web search.')
        def files():return {str(p.relative_to(proj)):hashlib.sha256(p.read_bytes()).hexdigest() for p in proj.rglob('*') if p.is_file()}
        before=files()
        try:r=subprocess.run(cmd+[brief],env=env,capture_output=True,text=True,timeout=100);events=[json.loads(l) for l in r.stdout.splitlines() if l.startswith('{')]
        except subprocess.TimeoutExpired:r=None;events=[]
        items=[e['item'] for e in events if e['type']=='item.completed' and 'item' in e]
        done=next((e['usage'] for e in events if e['type']=='turn.completed'),{})
        tools=[i for i in items if i['type'] in ['mcp_tool_call','command_execution','web_search']]
        names=[i.get('tool',i['type']) for i in tools]
        loaded=[i.get('arguments',{}).get('id') for i in tools if i.get('tool')=='get_skill' and not i.get('error')]
        final=' '.join(i.get('text','') for i in items if i['type']=='agent_message')
        return dict(persona=cat,arm=arm,host='Codex CLI with local Qwen2.5-1.5B',realSession=True,localInference=True,completed=bool(done),error=None if done else ('Timeout' if r is None else (r.stderr[-300:] or 'Session did not complete')),calledSkillKit='find_kit' in names,
            workingKit=bool(loaded) if arm!='manual' else bool('search_web' in names and 'github.com/' in final),calls=len(names),toolNames=names,skillsLoaded=loaded,
            tokens=done.get('input_tokens',0)+done.get('output_tokens',0),usage=done,projectFilesChanged=[n for n in set(files())|set(before) if before.get(n)!=files().get(n)],responseHash=hashlib.sha256(final.encode()).hexdigest())

if __name__=='__main__':
    service=http.server.ThreadingHTTPServer(('127.0.0.1',3898),Proxy);threading.Thread(target=service.serve_forever,daemon=True).start()
    p=HERE.parent/'sessions.json';rows=json.loads(p.read_text()) if p.exists() else []
    for cat in BRIEFS:
        for arm in ['pointer','snippet','manual']:
            if any(r['arm']==arm and r['persona']==cat and r['completed'] for r in rows):continue
            rows=[r for r in rows if (r['arm'],r['persona'])!=(arm,cat)]+[run(cat,arm)]
            p.write_text(json.dumps(rows,indent=2)+'\n')
    service.shutdown()
