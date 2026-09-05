"""UA-0060 independent reconciliation review; all fixture writes stay here.

Adapted from UA-0058's lifecycle probe. Tests report proof independently of
last_result, every supported role and status, latest-report precedence, and
complete persisted fixture state on refusal. Real UA-0052 is only read/copied.
"""
from __future__ import annotations

import ast
import copy
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OWNED = Path(__file__).resolve().parent
CLI = ROOT / 'tools/useagent.py'
ABSENT = '__absent__'


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(root: Path) -> dict[str, str]:
    return {path.relative_to(root).as_posix(): digest(path) if path.is_file() else '<directory>'
            for path in sorted(root.rglob('*'))}


def constant(name: str) -> set[str]:
    for node in ast.parse(CLI.read_text(encoding='utf-8')).body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            return ast.literal_eval(node.value)
    raise AssertionError(f'Missing CLI constant {name}')


def main() -> int:
    config = json.loads((ROOT / 'useagent.config.json').read_text(encoding='utf-8'))
    actual = json.loads((ROOT / 'work/registry.json').read_text(encoding='utf-8'))['items']['UA-0052']
    assert actual['reports'], 'Actual UA-0052 must have an existing referenced report'
    report_inputs = {}
    for ref in actual['reports']:
        source = (ROOT / ref).resolve()
        assert source.is_relative_to(ROOT) and not Path(ref).is_absolute()
        report_inputs[ref] = source.read_text(encoding='utf-8')
    report_ref = actual['reports'][-1]
    assert re.search(r'^result: completed$', report_inputs[report_ref], re.M)
    protected = [CLI, ROOT / 'useagent.config.json', ROOT / 'work/registry.json',
                 ROOT / 'work/items/UA-0052.md', *(ROOT / ref for ref in actual['reports'])]
    before = {str(path): digest(path) for path in protected}
    cases = []
    specs = []

    def case(label: str, success: bool = False, **changes: object) -> None:
        specs.append(dict(label=label, success=success, status='completed',
                          last_result=ABSENT, report_result='completed',
                          agent='supervisor') | changes)

    case('actual UA-0052 legacy shape: absent last_result, original completed report', True)
    case('explicit completed last_result plus completed report', True, last_result='completed')
    case('latest completed report supersedes an older failed report', True, older_failed=True)
    case('another registered supervisor identity is accepted', True, agent='fixture-supervisor')
    # Decouple registry result from report result, avoiding the old probe's confounding.
    for result in [ABSENT, 'failed', 'blocked', '', 'reported', 'Completed']:
        for last in [ABSENT, 'completed', 'failed', 'blocked']:
            case(f'report result {result!r} refused with last_result {last!r}',
                 report_result=result, last_result=last)
    for mode in ['missing_file', 'empty_list', 'absent_list', 'latest_missing',
                 'latest_failed', 'latest_blocked', 'latest_absent_result',
                 'no_frontmatter', 'body_only', 'directory', 'blank_reference',
                 'null_reference', 'outside_root']:
        case(f'{mode} refused', mode=mode)
    for role in sorted(constant('VALID_AGENT_ROLES') - {'supervisor'}):
        case(f'supported role {role} refused', agent=f'fixture-{role}')
    for agent in config['agents']:
        if agent['role'] != 'supervisor':
            case(f'configured identity {agent["id"]} ({agent["role"]}) refused', agent=agent['id'])
    case('unregistered supervisor-looking identity refused', agent='supervisor-unregistered')
    case('missing --agent refused', agent=None)
    for status in sorted(constant('VALID_STATUSES')) + [ABSENT, '', 'Completed', 'unexpected']:
        case(f'non-completed status {status!r} refused', status=status)

    with tempfile.TemporaryDirectory(prefix='ua0060-lifecycle-', dir=OWNED) as temporary:
        base = Path(temporary).resolve()
        assert base.is_relative_to(OWNED) and base != OWNED
        for index, spec in enumerate(specs):
            fixture = base / f'case-{index:02d}'
            fixture.mkdir()
            fixture_config = copy.deepcopy(config)
            fixture_config['agents'].extend({'id': f'fixture-{role}', 'role': role, 'status': 'available'}
                                           for role in sorted(constant('VALID_AGENT_ROLES')))
            (fixture / 'useagent.config.json').write_text(json.dumps(fixture_config), encoding='utf-8')
            item = copy.deepcopy(actual)
            item['updated_at'] = '2000-01-01T00:00:00Z'
            for field in ['status', 'last_result']:
                if spec[field] == ABSENT:
                    item.pop(field, None)
                else:
                    item[field] = spec[field]
            for ref, contents in report_inputs.items():
                target = fixture / ref
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(contents, encoding='utf-8')
            report_path = fixture / report_ref
            report_text = re.sub(r'^result:.*\n', '' if spec['report_result'] == ABSENT
                                 else f'result: {spec["report_result"]}\n',
                                 report_inputs[report_ref], flags=re.M)
            report_path.write_text(report_text, encoding='utf-8')
            mode = spec.get('mode')
            if mode == 'missing_file':
                report_path.unlink()
            elif mode == 'empty_list':
                item['reports'] = []
            elif mode == 'absent_list':
                item.pop('reports')
            elif mode in ['blank_reference', 'null_reference', 'outside_root']:
                item['reports'].append({'blank_reference': '  ', 'null_reference': None,
                                        'outside_root': '../outside-report.md'}[mode])
            elif mode == 'directory':
                report_path.unlink()
                report_path.mkdir()
            elif mode in ['no_frontmatter', 'body_only']:
                report_path.write_text('Fixture has no frontmatter.\n' +
                                       ('result: completed\n' if mode == 'body_only' else ''), encoding='utf-8')
            elif mode and mode.startswith('latest_'):
                latest = 'work/reports/inbox/UA-0052-latest.md'
                item['reports'].append(latest)
                if mode != 'latest_missing':
                    result_line = '' if mode == 'latest_absent_result' else f'result: {mode[7:]}\n'
                    (fixture / latest).write_text(f'---\ntask_id: UA-0052\n{result_line}---\nLatest report.\n', encoding='utf-8')
            if spec.get('older_failed'):
                older = 'work/reports/inbox/UA-0052-older.md'
                (fixture / older).write_text('---\nresult: failed\n---\nOlder report.\n', encoding='utf-8')
                item['reports'].insert(0, older)
            registry = {'version': 1, 'updated_at': item['updated_at'], 'items': {'UA-0052': item},
                        'review_sentinel': 'preserve unrelated registry metadata'}
            registry_path = fixture / 'work/registry.json'
            registry_path.write_text(json.dumps(registry), encoding='utf-8')
            item_path = fixture / 'work/items/UA-0052.md'
            item_path.parent.mkdir(parents=True)
            markdown = (ROOT / 'work/items/UA-0052.md').read_text(encoding='utf-8')
            markdown = re.sub(r'^status:.*$', f'status: {spec["status"]}', markdown, count=1, flags=re.M)
            item_path.write_text(markdown, encoding='utf-8')
            state_before = snapshot(fixture)
            command = [sys.executable, '-B', str(CLI), '--root', str(fixture), 'task', 'reconcile', 'UA-0052']
            if spec['agent'] is not None:
                command += ['--agent', spec['agent']]
            run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=15)
            state_after = snapshot(fixture)
            changed = sorted(key for key in state_before.keys() | state_after.keys()
                             if state_before.get(key) != state_after.get(key))
            invariants = not changed
            repeated = None
            if spec['success'] and run.returncode == 0:
                saved = json.loads(registry_path.read_text(encoding='utf-8'))
                expected = copy.deepcopy(registry)
                expected['updated_at'] = saved['updated_at']
                expected['items']['UA-0052'].update(status='reported', updated_at=saved['items']['UA-0052']['updated_at'])
                current_markdown = item_path.read_text(encoding='utf-8')
                original_body = markdown.split('---', 2)[2].strip()
                current_body = current_markdown.split('---', 2)[2].strip()
                event = f'supervisor reconciled legacy completion marker to reported by {spec["agent"]}'
                invariants = (saved == expected and changed == ['work/items/UA-0052.md', 'work/registry.json']
                              and '\nstatus: reported\n' in current_markdown
                              and current_body.startswith(original_body) and event in current_body[len(original_body):]
                              and saved['updated_at'] != registry['updated_at']
                              and saved['items']['UA-0052']['updated_at'] != item['updated_at'])
                second = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=15)
                repeated = {'exit': second.returncode, 'unchanged': snapshot(fixture) == state_after,
                            'stderr': second.stderr.strip()}
                invariants = invariants and repeated['exit'] == 2 and repeated['unchanged']
            cases.append({**spec, 'command': command, 'exit': run.returncode,
                          'changed_paths': changed, 'invariants_passed': invariants,
                          'passed': run.returncode == (0 if spec['success'] else 2) and invariants,
                          'stdout': run.stdout.strip(), 'stderr': run.stderr.strip(), 'second_attempt': repeated})
    unchanged = {str(path): digest(path) for path in protected} == before
    failed = [case for case in cases if not case['passed']]
    result = {'mode': 'disposable review-owned CLI fixtures, no provider execution',
              'production_state_unchanged': unchanged, 'protected_sha256': before,
              'valid_cases': sum(case['success'] for case in cases),
              'refusal_cases': sum(not case['success'] for case in cases),
              'passed': len(cases) - len(failed), 'failed': len(failed), 'cases': cases}
    (OWNED / 'lifecycle-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in result.items() if key not in ['cases', 'protected_sha256']}, indent=2))
    for case_result in failed:
        print(json.dumps(case_result, indent=2))
    return 1 if failed or not unchanged else 0


if __name__ == '__main__':
    raise SystemExit(main())
