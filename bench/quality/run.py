"""Paired model evaluation. Keep outputs as data. Never execute generated programs."""
import argparse, concurrent.futures, hashlib, json, os, pathlib, re, shutil, sqlite3, subprocess, tempfile, time
from html.parser import HTMLParser
from xml.etree import ElementTree

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
TASKS = json.loads((HERE/'tasks.json').read_text())
MODEL = 'gpt-6.2-sol'

def stripped(s):
    s=s.strip()
    m=re.fullmatch(r'```[^\n]*\n(.*)\n```',s,re.S)
    return m.group(1).strip() if m else s

def score(t,output):
    s=stripped(output)
    checks = {r:bool(re.search(r,s,re.I)) for r in t['checks']}
    if t.get('maxWords'):
        checks['word limit']=len(s.split())<=t['maxWords']
    if t['id']=='caption': checks['no hashtags']='#' not in s
    if t['format']=='svg':
        try:
            tree=ElementTree.fromstring(s)
            checks['valid SVG']=tree.tag.endswith('svg')
            if t['id']=='palette':
                labels=' '.join(tree.itertext())
                checks['three editable hex labels']=len(set(re.findall(r'#[0-9a-fA-F]{6}',labels.lower())))>=3
        except ElementTree.ParseError: checks['valid SVG']=False
    if t['format']=='html':
        class Tags(HTMLParser):
            def __init__(self): super().__init__(); self.tags=[]
            def handle_starttag(self,name,attrs): self.tags.append((name,dict(attrs)))
        tags=Tags(); tags.feed(s)
        if t['id']=='markup':
            ids={a.get('id') for name,a in tags.tags if name=='input' and a.get('id')}
            labeled=any(a.get('for') in ids for name,a in tags.tags if name=='label')
            checks['associated email label']=labeled or bool(re.search(r'<label\b[^>]*>[^<]*<input\b',s,re.I))
    if t['format']=='sql':
        db=sqlite3.connect(':memory:')
        db.executescript("CREATE TABLE customers(id);CREATE TABLE orders(id,customer_id,status);INSERT INTO customers VALUES(1),(2),(3);INSERT INTO orders VALUES(1,1,'paid'),(2,1,'paid'),(3,1,'open'),(4,3,'open');CREATE TABLE events(id,user_id,at);INSERT INTO events VALUES(2,4,'2021'),(5,4,'2021'),(6,4,'2020'),(8,9,'2024');")
        db.execute('PRAGMA query_only=ON')
        allowed={sqlite3.SQLITE_SELECT,sqlite3.SQLITE_READ,sqlite3.SQLITE_FUNCTION,sqlite3.SQLITE_RECURSIVE}
        db.set_authorizer(lambda code,*_: sqlite3.SQLITE_OK if code in allowed else sqlite3.SQLITE_DENY)
        deadline=time.monotonic()+1
        db.set_progress_handler(lambda: int(time.monotonic()>deadline),200)
        try: checks['fixture result']=db.execute(s).fetchall()==([(1,2),(2,0),(3,0)] if t['id']=='query' else [(4,5),(9,8)])
        except sqlite3.Error: checks['fixture result']=False
        finally: db.close()
    return checks

def generate(t, arm, out):
    dest=out/arm/(t['id']+'.json')
    if dest.exists(): return
    dest.parent.mkdir(exist_ok=True,parents=True)
    prompt='Return the requested artifact only. Use no tools, do not read any local or external files.\n\n'+t['brief']
    if arm=='with':
        proc=subprocess.run(['node','bin/vibe-skills.js','handoff',t['brief']],cwd=ROOT,capture_output=True,text=True,check=True)
        prompt+='\n\nReference material selected by SkillKit for this brief:\n'+proc.stdout
    with tempfile.TemporaryDirectory(prefix='skillkit-quality-') as work:
        result=pathlib.Path(work)/'last.txt'
        command=['codex','exec','--ephemeral','--ignore-user-config','--ignore-rules','--skip-git-repo-check','-s','read-only','-m',MODEL,'-c','model_reasoning_effort="medium"','-C',work,'-o',str(result),'-']
        run=subprocess.run(command,input=prompt,text=True,capture_output=True,timeout=180)
        if run.returncode or not result.is_file(): raise RuntimeError(t['id']+' '+arm+': '+run.stderr[-380:])
        content=result.read_text()
    dest.write_text(json.dumps(dict(id=t['id'],model=MODEL,effort='medium',promptSha256=hashlib.sha256(prompt.encode()).hexdigest(),output=content),indent=2)+'\n')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('action',choices=['baseline','with','score','blind'])
    parser.add_argument('--dir',type=pathlib.Path,default=HERE/'runs')
    parser.add_argument('--jobs',type=int,default=2)
    parser.add_argument('--limit',type=int,default=len(TASKS))
    a=parser.parse_args(); tasks=TASKS[:a.limit]
    if a.action in ('baseline','with'):
        with concurrent.futures.ThreadPoolExecutor(max_workers=a.jobs) as pool:
            futures=[pool.submit(generate,t,a.action,a.dir) for t in tasks]
            for future in concurrent.futures.as_completed(futures): future.result()
        return
    summary={'wins':0,'ties':0,'losses':0,'tasks':[]}
    for t in tasks:
        outs={}
        for arm in ['baseline','with']:
            p=a.dir/arm/(t['id']+'.json')
            if p.exists(): outs[arm]=json.loads(p.read_text())['output']
        if len(outs)!=2: continue
        if a.action=='blind':
            if t['format'] not in ('copy','svg','css','html'): continue
            # A precommitted hash determines arm order independently per brief.
            order=list(outs)
            if hashlib.sha256(('skillkit-v2:'+t['id']).encode()).digest()[0]%2: order.reverse()
            print(json.dumps({'id':t['id'],'brief':t['brief'],'A':outs[order[0]],'B':outs[order[1]]}))
            continue
        scores={arm:score(t,s) for arm,s in outs.items()}
        totals={arm:sum(vals.values())/len(vals) for arm,vals in scores.items()}
        delta=totals['with']-totals['baseline']
        summary['wins' if delta>0 else 'losses' if delta<0 else 'ties']+=1
        summary['tasks'].append(dict(id=t['id'],scores=totals,checks=scores))
    if a.action=='score': print(json.dumps(summary,indent=2))

if __name__=='__main__': main()
