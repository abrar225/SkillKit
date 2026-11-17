import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location('import_skills', Path(__file__).resolve().parents[1] / 'scripts/import-skills.py')
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)


class ImportTests(unittest.TestCase):
    def test_snapshot_preserves_all_bytes_and_ancestor_notices(self):
        source = {'LICENSE': b'root notice\r\n', 'skills/LICENSE.txt': b'parent terms',
                  'skills/example/SKILL.md': b'---\nname: example\n---\n',
                  'skills/example/references/a.bin': bytes(range(256)),
                  'other/LICENSE': b'unrelated', 'skills/example/LICENSE': b'local terms'}
        content, bundled, notices = m.snapshot(source, 'skills/example')
        self.assertEqual(content['references/a.bin'], bytes(range(256)))
        self.assertEqual(content['LICENSE'], b'local terms')
        self.assertEqual(bundled, {'upstream-licenses/LICENSE': b'root notice\r\n',
                                  'upstream-licenses/skills/LICENSE.txt': b'parent terms'})
        self.assertEqual(len(notices), 2)
        for notice in notices:
            self.assertEqual(notice['sha256'], m.digest(bundled[notice['localPath']]))

    def test_readme_license_evidence_is_not_invented(self):
        source = {'SKILL.md': b'irrelevant', 'skill/SKILL.md': b'# Skill', 'README.md': b'## License\nMIT\n'}
        _, bundle, _ = m.snapshot(source, 'skill', 'README.md')
        self.assertEqual(bundle['upstream-licenses/README.md'], source['README.md'])
        with self.assertRaises(ValueError):
            m.snapshot(source, 'skill', 'absent.md')

    def test_archive_reader_never_extracts_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'source.tar.gz'
            with tarfile.open(p, 'w:gz') as archive:
                info = tarfile.TarInfo('root/../outside'); info.size = 3
                archive.addfile(info, io.BytesIO(b'bad'))
            with self.assertRaises(ValueError):
                m.read_archive(p)
            self.assertFalse((Path(tmp) / 'outside').exists())

    def test_missing_skill_links_and_sidecar_collisions_fail(self):
        for source in [{}, {'skill/SKILL.md': b'x', 'skill/link': None},
                       {'skill/SKILL.md': b'x', 'skill/SOURCE.json': b'{}'}]:
            with self.assertRaises(ValueError):
                m.snapshot(source, 'skill')

    def test_unpinned_commit_fails_without_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                m.archive_for({'repo': 'owner/repo', 'commit': 'HEAD'}, Path(tmp), True)

    def test_refresh_replaces_complete_tree_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'skill'; dest.mkdir(); (dest / 'obsolete').write_text('old')
            files = {'SKILL.md': b'# Exact\r\n', 'upstream-licenses/LICENSE': b'copyright\n'}
            source = {'id': 'test/skill'}
            m.install(dest, files, source)
            self.assertFalse((dest / 'obsolete').exists())
            self.assertEqual(m.compare(dest, files), [])
            before = {p.relative_to(dest): p.read_bytes() for p in dest.rglob('*') if p.is_file()}
            m.install(dest, files, source)
            self.assertEqual(before, {p.relative_to(dest): p.read_bytes() for p in dest.rglob('*') if p.is_file()})
            (dest / 'SKILL.md').write_bytes(b'changed')
            self.assertEqual(m.compare(dest, files), ['SKILL.md'])

    def test_symlinked_domain_cannot_escape_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'skills'; root.mkdir()
            outside = Path(tmp) / 'outside'; outside.mkdir()
            (root / 'domain').symlink_to(outside, target_is_directory=True)
            with self.assertRaises(ValueError):
                m.ensure_safe_destination(root / 'domain/example', root)
            with self.assertRaises(ValueError):
                m.install(root / 'domain/example', {'SKILL.md': b'exact'}, {})
            self.assertFalse((outside / 'example').exists())

    def test_executable_mode_is_restored_and_checked(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'skill'
            files = m.SourceFiles({'SKILL.md': b'# Skill', 'scripts/run.sh': b'#!/bin/sh\n'})
            files.executable_paths = frozenset({'scripts/run.sh'})
            m.install(dest, files, {})
            self.assertTrue((dest / 'scripts/run.sh').stat().st_mode & 0o111)
            self.assertEqual(m.compare(dest, files), [])
            (dest / 'scripts/run.sh').chmod(0o644)
            self.assertIn('executable mode: scripts/run.sh', m.compare(dest, files))

    def test_empty_explicit_ids_never_mean_all_skills(self):
        with mock.patch('sys.stderr', io.StringIO()):
            with self.assertRaises(SystemExit) as result:
                m.main(['--refresh', '--ids', ''])
        self.assertEqual(result.exception.code, 2)

    def test_failed_replacement_and_rollback_keep_recovery_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'skill'; dest.mkdir()
            (dest / 'SKILL.md').write_bytes(b'original')
            original_rename = Path.rename
            def fail_replacement_and_restore(path, target):
                if path.name in ('new', 'old'):
                    raise OSError('simulated rename failure')
                return original_rename(path, target)
            with mock.patch.object(Path, 'rename', fail_replacement_and_restore):
                with self.assertRaisesRegex(OSError, 'recovery retained'):
                    m.install(dest, {'SKILL.md': b'replacement'}, {})
            backups = list(Path(tmp).glob('.skill-import-*/old/SKILL.md'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), b'original')

    def test_source_metadata_uses_pinned_reference_and_hashes(self):
        class Parser:
            @staticmethod
            def parse_frontmatter(text): return {'name': 'example', 'description': 'An upstream example'}
        source = m.source_for({'repo': 'owner/repo', 'commit': 'a' * 40, 'license': 'MIT'},
                              {'dest': 'test/example', 'path': 'skills/example'}, {'SKILL.md': b'exact'}, [],
                              {'retrievedAt': '2026-11-17'}, Parser)
        self.assertEqual(source['upstream']['ref'], 'a' * 40)
        self.assertEqual(source['contentIntegrity']['files']['SKILL.md'], m.digest(b'exact'))


if __name__ == '__main__':
    unittest.main()
