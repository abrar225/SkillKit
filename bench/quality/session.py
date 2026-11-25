"""Prepare isolated, neutral task packets for an agent and import its saved artifacts."""
import argparse
import hashlib
import json
import pathlib
import subprocess

from run import HERE, ROOT, TASKS, MODEL

p = argparse.ArgumentParser()
p.add_argument('command', choices=['prepare','collect'])
p.add_argument('arm', choices=['baseline','with'])
p.add_argument('directory', type=pathlib.Path)
a = p.parse_args()
a.directory.mkdir(parents=True, exist_ok=True)
for task in TASKS:
    path = a.directory / (task['id'] + '.prompt')
    if a.command == 'prepare':
        prompt = 'Return the requested artifact only. Use no external tools or files.\n\n' + task['brief']
        if a.arm == 'with':
            kit = subprocess.check_output(['node','bin/vibe-skills.js','handoff',task['brief']],cwd=ROOT,text=True)
            prompt += '\n\nReference material selected by SkillKit for this brief:\n' + kit
        path.write_text(prompt)
    else:
        answer = path.with_suffix('.answer').read_text()
        if not answer.strip():
            raise ValueError('Empty output for ' + task['id'])
        result = {'id':task['id'],'model':MODEL,'effort':'medium','runner':'Codex desktop batch, isolated by arm',
                  'promptSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'output':answer}
        dest = HERE/'runs'/a.arm/(task['id']+'.json')
        dest.parent.mkdir(exist_ok=True, parents=True)
        dest.write_text(json.dumps(result,indent=2)+'\n')
