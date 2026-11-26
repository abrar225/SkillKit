"""Paired artifact evaluation on Gemini 4 Hydrogen with deterministic functional checks and blind tie-breaking."""
import hashlib
import html.parser
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FOCUSED = '--focused' in sys.argv
HANDOFF = '--handoff' in sys.argv
MODEL_NAME = 'Gemini 4 Hydrogen'
OUTPUTS = 'outputs-handoff' if HANDOFF else 'outputs-focused' if FOCUSED else 'outputs'
SEEDS = [31, 47, 83]
CASES = {
'web': [
'bookshop reservation form with a labelled email field and pickup date',
'photographer contact form with a labelled email field and consent checkbox',
'community archive search form with a labelled search control and submit button',
'print studio booking form with a labelled date field and number of copies',
'library signup form with a labelled email field and accessible submit button',
'cinema date filter form with a labelled date field and reset button'],
'poster': [
'Night Bus, a free jazz gig at Room 4 on June 8; emphasize the title',
'Seed Swap, a market exchange at Pier 2 on May 5; emphasize what visitors should bring',
'Late Shift, an evening reading at Hall 7 on July 9; make the time easy to scan',
'Kiln Day, an open studio at Unit 3 on May 9; make the venue easy to find',
'Walk North, a neighborhood walk at Gate 5 on May 2; separate meeting point and title',
'Small Press, a zine fair at Bay 8 on June 2; distinguish title from date'],
'newsletter': [
'Sunday opening moves to 10 am on October 6 for shift workers, invite readers to drop in',
'the seed swap moves indoors to the market on May 4 due to rain, bring one packet',
'the repair cafe accepts bicycle wheels on June 3, people must book a slot',
'the new tram stop opens July 9 at the north gate, remind riders to check the map',
'our print shop accepts recycled paper starting May 8, tell artists to bring a sample',
'our reading club meets August 7 in Room 2, invite newcomers to bring a poem'],
'readme': [
'Needle requires Node 20, needle audit ./src inspects stale imports, exit 2 means invalid input',
'Folio requires Python 3.11, folio index ./notes builds a local index and never uploads notes',
'Clipper requires Node 22, clipper dry-run ./in previews changes without writing files',
'Quill requires Python 3.10, quill check notes.md reports broken links and returns 1 on findings',
'Grain requires Go 1.22, grain stats data.csv counts rows, with the first row treated as a header',
'Slate requires Node 20, slate inspect ./site reads a manifest and returns 3 if it is missing'],
'review': [
'const first = items[0].name; // items may be empty',
'const amount = parseInt(price); // price is a decimal currency string',
'const ok = ids.indexOf(id) > 0; // the first id is valid',
'rows.sort((a,b)=>a.time>b.time?1:-1); // consumers reuse the original array',
'const qty = input.qty || 1; // zero is a valid quantity',
'const elapsed = end.getMilliseconds()-start.getMilliseconds(); // dates can span seconds'],
'release': [
'bookstore migration, an old reader must coexist with a new writer during rollout',
'search index cutover, indexing lag must stay under two minutes',
'checkout rollout, payment retry volume should stay below the established baseline',
'photo storage migration, originals must remain retrievable during backfill',
'newsletter queue upgrade, duplicate sends are unacceptable during migration',
'transit map rollout, riders using a cached client must still see valid stop IDs']}
SPEC={
'web':('Redesign my portfolio website for a ', 'frontend/frontend-design'),
'poster':('Design a festival poster for ', 'ui-ux/canvas-design'),
'newsletter':('Write a newsletter from my founder notes about how ', 'social-media/writing-shape'),
'readme':('Document this CLI in a README. Return a short example and an explanation of the behavior. ', 'architecture/documentation-and-adrs'),
'review':('Review this TypeScript pull request. Return one concrete correction and a regression example for this line: ', 'engineering-ops/code-review-and-quality'),
'release':('Prepare a release plan. Return four steps, a measurable rollback trigger and a smoke check for a ', 'engineering-ops/shipping-and-launch')}

def system_prompt_for(cat):
    extra = {
        'web': 'Supply an accessible HTML form fragment.',
        'newsletter': 'Use 40 to 65 words.',
        'readme': 'Include a short fenced CLI example, prerequisites, behavior summary, and exit status notes.',
        'review': 'Return one concrete TypeScript correction inside a code block and a brief regression test or example.',
        'release': 'Return four numbered steps, one measurable rollback trigger, and one smoke check.',
    }.get(cat, '')
    return ('Return the finished artifact only. ' + extra).strip()

def eligible():
    cases=[]
    for category, subjects in CASES.items():
        prefix,skill=SPEC[category]
        # Canvas Design explicitly produces PDF/PNG and cannot supply editable SVG.
        if HANDOFF and category=='poster': continue
        for i,subject in enumerate(subjects):
            brief=prefix+subject
            cmd=['node','bin/vibe-skills.js']
            kit=json.loads(subprocess.check_output(cmd+['use',brief],cwd=ROOT,text=True))
            if kit['status']!='ready' or not any(s['id']==skill for s in kit['skills']): continue
            detail=json.loads(subprocess.check_output(cmd+['get',skill]+(['--focus',brief] if FOCUSED else []),cwd=ROOT,text=True))
            material=detail['instructions'].split('---',2)[-1].strip()[:3200]
            if HANDOFF:
                material=subprocess.check_output(cmd+['handoff',brief],cwd=ROOT,text=True).strip()
                if skill not in material: raise ValueError('Handoff missing selected skill')
            cases.append((category+str(i),category,brief,skill,material))
    return cases

class Form(html.parser.HTMLParser):
    def __init__(self): super().__init__();self.tags=[]
    def handle_starttag(self,name,attrs): self.tags.append((name,dict(attrs)))

def functional(category,s,brief=''):
    if category=='web':
        p=Form();p.feed(s)
        ids={a.get('id') for n,a in p.tags if n in ('input','select','textarea') and a.get('id')}
        return int(any(n=='form' for n,a in p.tags))+int(any(n=='label' and a.get('for') in ids for n,a in p.tags))
    if category=='newsletter': return int(40<=len(s.split())<=65)
    if category=='readme':
        low=s.lower()
        has_code='```' in s or '`' in s
        has_exit=bool(re.search(r'\bexit\b|\breturns?\s+\d\b|\bstatus\s+\d\b',low))
        return int(has_code)+int(has_exit)
    if category=='review':
        low=s.lower()
        has_code='```' in s or '`' in s
        has_regression=bool(re.search(r'\bregression\b|\btest\b|\bexpect\(|\bassert\b|\bexample\b',low))
        return int(has_code)+int(has_regression)
    if category=='release':
        low=s.lower()
        steps=len(re.findall(r'(?m)^\s*(?:[1-4][\.)]|step\s+[1-4]\b)',s,re.I))
        has_rollback='rollback' in low and bool(re.search(r'\d|%|\bminute|\bsecond|\bunder\b|\bbelow\b|\bbaseline\b|\bexceed',low))
        has_smoke='smoke' in low
        return int(steps>=4)+int(has_rollback)+int(has_smoke)
    return 0

def score_rows(cases, rows):
    cats={};allvotes=[]
    for id,cat,*_ in cases:
        task_rows=[r for r in rows if r['id']==id]
        if len(task_rows)<3: continue
        val=sum(r['delta'] for r in task_rows)
        key='wins' if val>0 else 'losses' if val<0 else 'ties';allvotes.append(key)
        cats.setdefault(cat,dict(wins=0,losses=0,ties=0))[key]+=1
    w=allvotes.count('wins');l=allvotes.count('losses');n=w+l
    ci=None
    if n:
        z=1.959964;p=w/n;d=1+z*z/n;c=(p+z*z/(2*n))/d;h=z*(p*(1-p)/n+z*z/(4*n*n))**.5/d;ci=[max(0,c-h),min(1,c+h)]
    return dict(
        model=MODEL_NAME,
        qualifiedTasks=len(allvotes),
        minRunsPerArm=3 if allvotes else 0,
        blinded=True,
        interval95=ci,
        wins=w,
        losses=l,
        ties=len(allvotes)-n,
        categories=cats,
        method='Task-level sign of sum of three paired votes on Gemini 4 Hydrogen; deterministic functional checks first, blinded judge tie-breaker, Wilson 95% CI for wins among non-tied tasks.',
    )

def main():
    cases=eligible()
    if '--list' in sys.argv:
        print(json.dumps([r[:2] for r in cases]));return
    if '--export-cases' in sys.argv:
        payload=[]
        for id,cat,brief,skill,material in cases:
            digest=hashlib.sha256((MODEL_NAME+'|'+brief+material).encode()).hexdigest()
            orders={}
            for seed in SEEDS:
                order=['without','with']
                if hashlib.sha256(f'{id}/{seed}'.encode()).digest()[1]%2: order.reverse()
                orders[str(seed)]=order
            payload.append(dict(id=id,category=cat,brief=brief,skill=skill,material=material,inputHash=digest,systemPrompt=system_prompt_for(cat),orders=orders))
        print(json.dumps(payload,ensure_ascii=False));return
    if '--score' in sys.argv:
        rows=[]
        out_dir=HERE/OUTPUTS
        for id,cat,brief,skill,material in cases:
            digest=hashlib.sha256((MODEL_NAME+'|'+brief+material).encode()).hexdigest()
            for seed in SEEDS:
                dst=out_dir/f'{id}-{seed}.json'
                if not dst.exists(): raise FileNotFoundError(f'Missing {dst}')
                row=json.loads(dst.read_text())
                if row.get('model')!=MODEL_NAME or row.get('inputHash')!=digest:
                    raise ValueError(f'Stale or mismatched output in {dst}')
                scores={k:functional(cat,v,brief) for k,v in row['outputs'].items()}
                delta=scores['with']-scores['without']
                a,b=row['order']
                vote=re.match(r'^(A|B|TIE)\b',str(row.get('blind','')).strip('* '),re.I)
                if not delta and vote and vote[1].upper()!='TIE':
                    delta=1 if {'A':a,'B':b}[vote[1].upper()]=='with' else -1
                row['checks']=scores
                row['delta']=(delta>0)-(delta<0)
                dst.write_text(json.dumps(row,ensure_ascii=False)+'\n')
                rows.append(row)
        result=score_rows(cases,rows)
        dst_name='quality-handoff.json' if HANDOFF else 'quality-focused.json' if FOCUSED else 'quality-summary.json'
        (HERE.parent/dst_name).write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2));return
    raise SystemExit('Run via Gemini 4 Hydrogen workflow (--export-cases -> workflow -> --score). Local Qwen server removed per docs/INFERENCE.md.')
if __name__=='__main__':main()
