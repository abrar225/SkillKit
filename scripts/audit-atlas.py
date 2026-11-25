"""Audit a repeatable hash-selected sample of publisher SKILL.md metadata. No user tasks enter discovery."""
import concurrent.futures as cf
import hashlib,json,pathlib,re,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
dest=ROOT/'catalog/federated/tag-audit.json'
snap=json.loads((ROOT/'catalog/federated/snapshot.json').read_text())
candidates={i['repo']+'/'+i['path']:i for rows in snap['candidates'].values() for i in rows if i.get('commit') and i.get('path','').endswith('/SKILL.md')}
sample=sorted(candidates,key=lambda x:hashlib.sha256(x.encode()).digest())[:200]
domains={'data':r'data(base|set| warehouse)|query|sql|elastic(search)?|analytics|dbt|inference|training model',
'design':r'design system|accessibility|typograph|color palette|wireframe|front.end design|visual design',
'media':r'video|caption|animation|motion graphic|audio|image generation',
'writing':r'writing|draft|documentation|copywriting|editorial|newsletter',
'operations':r'deploy|monitor|logging|incident|observability|infrastructure|hosting|container|pipeline',
'development':r'api|code|framework|test|implement|application|plugin|programming'}
def audit(key):
    item=candidates[key]
    url='https://raw.githubusercontent.com/'+item['repo']+'/'+item['commit']+'/'+urllib.parse.quote(item['path'])
    record=dict(id=key,commit=item['commit'],url=url)
    try:
        with urllib.request.urlopen(url,timeout=15) as resp:data=resp.read(150001)
        if len(data)>150000:raise ValueError('oversize')
        body=data.decode()
        h=re.match(r'^---\s*\n(.*?)\n---',body,re.S)
        desc=re.search(r'^description:\s*([^\n]*(?:\n[ \t]+[^\n]+)*)',h[1],re.M) if h else None
        if not desc:raise ValueError('description unavailable')
        evidence=' '.join(desc[1].strip(' >|\'"').split())[:260]
        hits={k:len(re.findall(p,evidence,re.I)) for k,p in domains.items()}
        tag=max(hits,key=hits.get) if any(hits.values()) else 'unknown'
        record.update(sha256=hashlib.sha256(data).hexdigest(),domain=tag,description=evidence)
    except Exception as exc:record['unassessed']=str(exc)[:100]
    return record
with cf.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(audit,sample))
dest.write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
