"""UA-0058 CLI guard reproductions against disposable review-owned state only.

The checkout configuration supplies the role roster; real state is hashed only.
No real work item, source, or control-plane implementation is edited.
Exit 1 means an acceptance guard remains violated; output includes controls.
"""
from __future__ import annotations

import copy
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
OWNED = Path(__file__).resolve().parent
CLI = ROOT / "tools" / "useagent.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    config = json.loads((ROOT / "useagent.config.json").read_text(encoding="utf-8"))
    protected = [ROOT / "work/registry.json", ROOT / "work/items/UA-0052.md", CLI]
    before = {str(path): digest(path) for path in protected}
    cases = []
    # Existing invalid status is deliberate fixture input, never a real lifecycle write.
    specs = [
        ("valid legacy completion", "completed", "completed", "supervisor", True, True),
        ("missing last_result", "completed", None, "supervisor", True, False),
        ("failed last_result", "completed", "failed", "supervisor", True, False),
        ("blocked last_result", "completed", "blocked", "supervisor", True, False),
        ("non-supervisor reviewer", "completed", "completed", "astra-review", True, False),
        ("worker denied", "completed", "completed", "astra", True, False),
        ("task command's worker identity denied", "completed", "completed", "supervisor-local", True, False),
        ("missing report denied", "completed", "completed", "supervisor", False, False),
    ]
    specs.extend((f"{status} status denied", status, "completed", "supervisor", True, False)
                 for status in ["planned", "assigned", "in_progress", "reported", "needs_review", "done", "blocked", "cancelled"])
    with tempfile.TemporaryDirectory(prefix="ua0058-lifecycle-", dir=OWNED) as temporary:
        fixture = Path(temporary).resolve()
        assert fixture.is_relative_to(OWNED.resolve()) and fixture != OWNED.resolve()
        (fixture / "work/items").mkdir(parents=True)
        (fixture / "work/reports/inbox").mkdir(parents=True)
        (fixture / "useagent.config.json").write_text(json.dumps(config), encoding="utf-8")
        for label, status, result, agent, reports, expected_success in specs:
            report_path = "work/reports/inbox/UA-REVIEW-fixture.md"
            item = {
                "id": "UA-REVIEW", "title": "Disposable review fixture", "level": "L2",
                "status": status, "owner": "supervisor", "assigned_to": "claude",
                "scope": ["docs/review-fixture.md"], "depends_on": [],
                "reports": [report_path] if reports else [],
                "evidence": [{"kind": "check", "value": "fixture evidence preserved"}],
                "updated_at": "2000-01-01T00:00:00Z",
            }
            if result is not None:
                item["last_result"] = result
            registry = {"version": 1, "updated_at": item["updated_at"], "items": {"UA-REVIEW": item}}
            registry_path = fixture / "work/registry.json"
            item_path = fixture / "work/items/UA-REVIEW.md"
            registry_path.write_text(json.dumps(registry), encoding="utf-8")
            item_path.write_text(f"---\nid: UA-REVIEW\nstatus: {status}\n---\n# Fixture\n\n## Event log\n", encoding="utf-8")
            (fixture / report_path).write_text(f"---\nresult: {result or 'failed'}\n---\nFixture worker report.\n", encoding="utf-8")
            old_registry, old_markdown = registry_path.read_bytes(), item_path.read_bytes()
            old_report = (fixture / report_path).read_bytes()
            command = [sys.executable, str(CLI), "--root", str(fixture), "task", "reconcile", "UA-REVIEW", "--agent", agent]
            run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=15)
            current = json.loads(registry_path.read_text(encoding="utf-8"))["items"]["UA-REVIEW"]
            actual_success = run.returncode == 0
            invariants = True
            if actual_success:
                expected = copy.deepcopy(item)
                expected["status"] = "reported"
                expected["updated_at"] = current["updated_at"]
                invariants = (current == expected
                              and "status: reported" in item_path.read_text(encoding="utf-8")
                              and "supervisor reconciled legacy completion marker" in item_path.read_text(encoding="utf-8")
                              and (fixture / report_path).read_bytes() == old_report)
            else:
                invariants = registry_path.read_bytes() == old_registry and item_path.read_bytes() == old_markdown
            cases.append({"case": label, "agent": agent, "before_status": status, "before_last_result": result,
                          "expected_success": expected_success, "exit": run.returncode,
                          "after_status": current["status"], "after_last_result": current.get("last_result"),
                          "evidence_and_report_or_rejection_preserved": invariants,
                          "passed": actual_success == expected_success and invariants,
                          "stdout": run.stdout.strip(), "stderr": run.stderr.strip()})
    unchanged = {str(path): digest(path) for path in protected} == before
    failed = [case for case in cases if not case["passed"]]
    print(json.dumps({"mode": "isolated CLI fixture", "production_registry_unchanged": unchanged,
                      "cases": cases, "passed": len(cases) - len(failed), "failed": len(failed)}, indent=2))
    return 1 if failed or not unchanged else 0


if __name__ == "__main__":
    raise SystemExit(main())
