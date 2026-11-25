"""Score the frozen functional rubric, then break functional ties by the blinded rubric."""
import hashlib
import json

from run import HERE, TASKS, score

judgments = {row['id']: row for row in json.loads((HERE/'judgments.json').read_text())}
summary = {'wins':0,'ties':0,'losses':0,'automated':{'wins':0,'ties':0,'losses':0},'tasks':[]}
for task in TASKS:
    key = task['id']
    checks = {arm: score(task,json.loads((HERE/'runs'/arm/(key+'.json')).read_text())['output']) for arm in ('baseline','with')}
    difference = sum(checks['with'].values())-sum(checks['baseline'].values())
    def outcome(diff):
        return 'wins' if diff>0 else 'losses' if diff<0 else 'ties'
    summary['automated'][outcome(difference)]+=1
    criterion = 'automated'
    if key in judgments:
        row = judgments[key]
        if not all(isinstance(row[side],list) and len(row[side])==3 and all(x in (0,1,2) for x in row[side]) for side in ['A','B']):
            raise ValueError(key+' invalid blind scores')
        if not difference:
            with_side = 'A' if hashlib.sha256(('skillkit-v2:'+key).encode()).digest()[0]%2 else 'B'
            before = 'B' if with_side=='A' else 'A'
            difference = sum(row[with_side])-sum(row[before])
            criterion = 'blinded rubric'
    elif task['format'] in ('copy','svg','html','css'):
        raise ValueError(key+' lacks a blinded judgment')
    result = outcome(difference)
    summary[result] += 1
    summary['tasks'].append({'id':key,'outcome':result,'criterion':criterion,'checks':checks})
print(json.dumps(summary,indent=2))
