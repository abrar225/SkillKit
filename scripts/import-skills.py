#!/usr/bin/env python3
"""Import pinned, byte-for-byte upstream skills with portable license notices.

Existing directories are skipped unless --refresh is explicit. --check compares
against pinned source archives without writing to the repository. --offline uses
previously downloaded archives, never a moving branch or invented commit.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / 'skills'
MANIFEST_PATH = ROOT / 'scripts/import-manifest.json'
NOTICE_RE = re.compile(r'^(licen[cs]e|copying|copyright|notice)(\..*)?$', re.I)


class SourceFiles(dict):
    executable_paths = frozenset()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_relative(value):
    p = PurePosixPath(value)
    if not value or p.is_absolute() or any(x in ('', '.', '..') for x in value.split('/')) or '\\' in value:
        raise ValueError(f'unsafe relative path: {value!r}')
    return p


def read_archive(file, skill_paths=None, license_evidence=None):
    """Read regular files only; never extract archive paths or follow links."""
    files = SourceFiles()
    executable_paths = set()
    prefixes = tuple(p + '/' for p in (skill_paths or []))
    ancestors = {str(a) for p in (skill_paths or []) for a in PurePosixPath(p).parents}
    with tarfile.open(file, 'r:gz') as archive:
        for member in archive:
            parts = PurePosixPath(member.name).parts
            if len(parts) < 2:
                continue
            rel = '/'.join(parts[1:])
            safe_relative(rel)
            if skill_paths and not (rel.startswith(prefixes) or rel == license_evidence or
                    (str(PurePosixPath(rel).parent) in ancestors and NOTICE_RE.fullmatch(PurePosixPath(rel).name))):
                continue
            if member.issym() or member.islnk():
                # Fail if a requested skill contains a link (checked in snapshot).
                files[rel] = None
            elif member.isfile():
                files[rel] = archive.extractfile(member).read()
                if member.mode & 0o111:
                    executable_paths.add(rel)
    files.executable_paths = frozenset(executable_paths)
    return files


def archive_for(repo, cache, offline=False):
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', repo['repo']):
        raise ValueError('invalid GitHub repository')
    sha = repo.get('commit', '')
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError(f"{repo['repo']}: a full pinned commit is required")
    cache.mkdir(parents=True, exist_ok=True)
    file = cache / (repo['repo'].replace('/', '__') + '--' + sha + '.tar.gz')
    if not file.exists():
        if offline:
            raise ValueError(f'missing offline archive: {file}')
        request = urllib.request.Request(
            f"https://codeload.github.com/{repo['repo']}/tar.gz/{sha}",
            headers={'User-Agent': 'vibe-skills-source-import/2'},
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
        temporary = file.with_suffix('.download')
        temporary.write_bytes(data)
        temporary.replace(file)
    return file


def snapshot(files, skill_path, license_evidence=None):
    safe_relative(skill_path)
    prefix = skill_path + '/'
    content = SourceFiles({p[len(prefix):]: b for p, b in files.items() if p.startswith(prefix)})
    content.executable_paths = frozenset(p[len(prefix):] for p in getattr(files, 'executable_paths', ()) if p.startswith(prefix))
    if 'SKILL.md' not in content:
        raise ValueError(f'upstream skill missing: {skill_path}/SKILL.md')
    if any(b is None for b in content.values()):
        raise ValueError(f'{skill_path}: upstream links require explicit handling')
    if 'SOURCE.json' in content or any(p.startswith('upstream-licenses/') for p in content):
        raise ValueError(f'{skill_path}: upstream files collide with provenance sidecars')
    inherited = {}
    # Ancestor notices retain their repository-relative paths and exact bytes.
    ancestors = {str(p) for p in PurePosixPath(skill_path).parents}
    for p, b in files.items():
        if str(PurePosixPath(p).parent) in ancestors and NOTICE_RE.fullmatch(PurePosixPath(p).name):
            if b is None:
                raise ValueError(f'license notice is a link: {p}')
            inherited[p] = b
    if license_evidence:
        safe_relative(license_evidence)
        if files.get(license_evidence) is None:
            raise ValueError(f'missing license evidence: {license_evidence}')
        inherited[license_evidence] = files[license_evidence]
    licenses = [dict(sourcePath=p, localPath='upstream-licenses/' + p, sha256=digest(b))
                for p, b in sorted(inherited.items())]
    bundled = {'upstream-licenses/' + p: b for p, b in inherited.items()}
    return content, bundled, licenses


def build_parser():
    spec = importlib.util.spec_from_file_location('registry_builder', ROOT / 'scripts/build-registry.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compare(dest, expected):
    if not dest.is_dir() or dest.is_symlink():
        return ['missing or unsafe skill directory']
    actual = {p.relative_to(dest).as_posix(): p for p in dest.rglob('*') if p.is_file() or p.is_symlink()}
    differences = []
    for rel, data in expected.items():
        p = actual.get(rel)
        if p is None or p.is_symlink() or p.read_bytes() != data:
            differences.append(rel)
    for rel, p in actual.items():
        if rel in expected and not p.is_symlink() and bool(p.stat().st_mode & 0o111) != (rel in getattr(expected, 'executable_paths', ())):
            differences.append(f'executable mode: {rel}')
    differences += [f'unexpected: {p}' for p in actual if p not in expected and p != 'SOURCE.json']
    return differences


def source_for(repo, entry, content, licenses, manifest, parser):
    text = content['SKILL.md'].decode('utf-8')
    fm = parser.parse_frontmatter(text)
    return {
        'id': entry['dest'], 'name': fm.get('name') or PurePosixPath(entry['dest']).name,
        'description': fm.get('description') or parser.body_description(text),
        'origin': 'upstream', 'license': entry.get('license', repo['license']),
        'licenseStatus': 'declared-in-readme' if repo.get('licenseEvidence') else 'declared',
        'retrievedAt': manifest['retrievedAt'],
        'upstream': {'repo': repo['repo'], 'url': f"https://github.com/{repo['repo']}",
                     'path': entry['path'], 'commit': repo['commit'], 'ref': repo['commit']},
        'contentIntegrity': {'algorithm': 'sha256', 'files': {p: digest(b) for p, b in sorted(content.items())},
                             'executablePaths': sorted(getattr(content, 'executable_paths', ()))},
        'licenseFiles': licenses,
    }


def ensure_safe_destination(dest, root=None):
    if root is not None and not dest.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'destination escapes skills root: {dest}')
    stop = (root or dest.parent.parent).absolute()
    for part in (dest, *dest.parents):
        if part.is_symlink():
            raise ValueError(f'refusing symlink destination or ancestor: {part}')
        if part.absolute() == stop:
            break


def install(dest, files, source):
    ensure_safe_destination(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Preserve a recovery backup if both replacement and rollback fail.
    tmp = Path(tempfile.mkdtemp(prefix='.skill-import-', dir=dest.parent))
    stage = tmp / 'new'; backup = tmp / 'old'
    keep_recovery = False
    try:
        stage.mkdir()
        for rel, data in files.items():
            target = stage / safe_relative(rel)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            target.chmod(0o755 if rel in getattr(files, 'executable_paths', ()) else 0o644)
        (stage / 'SOURCE.json').write_text(json.dumps(source, indent=2, ensure_ascii=False) + '\n')
        existed = dest.exists()
        if existed:
            dest.rename(backup)
        try:
            stage.rename(dest)
        except BaseException as replacement_error:
            if existed:
                try:
                    backup.rename(dest)
                except BaseException as rollback_error:
                    keep_recovery = True
                    raise OSError(f'replacement and rollback failed; recovery retained at {tmp}: {rollback_error}') from replacement_error
            raise
    finally:
        if not keep_recovery:
            shutil.rmtree(tmp)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--refresh', action='store_true', help='replace selected upstream directories from pinned sources')
    ap.add_argument('--check', action='store_true', help='verify all selected contents and provenance without repository writes')
    ap.add_argument('--offline', action='store_true')
    ap.add_argument('--ids', help='comma-separated exact domain/skill IDs')
    ap.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'skills-upstream-cache')
    args = ap.parse_args(argv)
    if args.check and args.refresh:
        ap.error('--check and --refresh are mutually exclusive')
    manifest = json.loads(MANIFEST_PATH.read_text())
    if args.ids is not None and (not args.ids.strip() or any(not item.strip() for item in args.ids.split(','))):
        ap.error('--ids requires non-empty comma-separated exact IDs')
    selected = {item.strip() for item in args.ids.split(',')} if args.ids is not None else None
    all_ids = {e['dest'] for repo in manifest['upstream'] for e in repo['skills']}
    if selected and selected - all_ids:
        ap.error('unknown upstream IDs: ' + ', '.join(sorted(selected - all_ids)))
    parser = build_parser()
    errors = []; changed = 0; checked = 0
    for repo in manifest['upstream']:
        entries = [e for e in repo['skills'] if not selected or e['dest'] in selected]
        if not entries:
            continue
        files = read_archive(archive_for(repo, args.cache_dir, args.offline),
                             [entry['path'] for entry in entries], repo.get('licenseEvidence'))
        for entry in entries:
            safe_relative(entry['dest']); dest = SKILLS / entry['dest']
            ensure_safe_destination(dest, SKILLS)
            if len(PurePosixPath(entry['dest']).parts) != 2:
                raise ValueError('destination must be domain/skill')
            # Ground metadata and entry point before replacing existing content.
            if dest.exists():
                (dest / 'SKILL.md').read_bytes()
                existing_source = json.loads((dest / 'SOURCE.json').read_text())
            else:
                existing_source = None
            content, bundled, licenses = snapshot(files, entry['path'], repo.get('licenseEvidence'))
            expected = SourceFiles({**content, **bundled})
            expected.executable_paths = content.executable_paths
            source = source_for(repo, entry, content, licenses, manifest, parser)
            if args.check:
                diff = compare(dest, expected)
                if existing_source != source:
                    diff.append('SOURCE.json differs from pinned import metadata')
                if diff:
                    errors.append(entry['dest'] + ': ' + ', '.join(diff))
                checked += 1
            elif not dest.exists() or args.refresh:
                install(dest, expected, source); changed += 1
                print('imported', entry['dest'], flush=True)
            else:
                print('skipped existing', entry['dest'])
    # Local installs remain local copies, with no upstream authorship assertion.
    if not args.check and not args.refresh and not selected:
        locals_ = [(Path(os.path.expanduser(manifest['localRoot'])) / e['source'], e) for e in manifest.get('local', [])]
        locals_ += [(Path(e['source']).expanduser(), e) for e in manifest.get('localExtra', [])]
        for original, entry in locals_:
            safe_relative(entry['dest']); dest = SKILLS / entry['dest']
            ensure_safe_destination(dest, SKILLS)
            if dest.exists():
                continue
            if not (original / 'SKILL.md').is_file():
                raise ValueError(f'missing local source: {original}')
            shutil.copytree(original, dest, ignore=shutil.ignore_patterns('.git', '__pycache__', '*.pyc', '.DS_Store'))
            text = (dest / 'SKILL.md').read_text(); fm = parser.parse_frontmatter(text)
            payload = {'id': entry['dest'], 'name': fm.get('name') or dest.name,
                       'description': fm.get('description') or parser.body_description(text),
                       'origin': 'local-agent-skills', 'license': fm.get('license') or 'unverified-local-copy',
                       'licenseStatus': 'declared' if fm.get('license') else 'unverified',
                       'originalPath': str(original), 'upstream': None, 'retrievedAt': manifest['retrievedAt']}
            (dest / 'SOURCE.json').write_text(json.dumps(payload, indent=2) + '\n')
    for e in errors:
        print('error:', e, file=sys.stderr)
    print(f'{checked} checked, {changed} imported, {len(errors)} error(s)')
    return bool(errors)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, tarfile.TarError) as exc:
        print(f'error: {exc}', file=sys.stderr)
        sys.exit(1)
