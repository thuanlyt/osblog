"""Bounded supervisor-local replay of the UseAgent lifecycle.

This is a process fixture, not a live Antigravity/Claude/Codex vendor run. It
copies the local control-plane inputs into a temporary root, uses the real CLI
against that isolated root, asserts the lifecycle artifacts, and removes the
temporary root on exit.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def run(cli: Path, fixture: Path, *args: str) -> str:
    command = [sys.executable, str(cli), "--root", str(fixture), *args]
    result = subprocess.run(
        command,
        cwd=fixture,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise AssertionError(
            f"command failed ({result.returncode}): {' '.join(command)}\n"
            f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result.stdout.strip()


def write_minimum_ledger(fixture: Path) -> None:
    (fixture / "AGENTS.md").write_text(
        "# Replay fixture\n\nThis temporary root is a labeled supervisor-local UseAgent replay.\n",
        encoding="utf-8",
    )
    (fixture / "knowledge").mkdir(exist_ok=True)
    (fixture / "knowledge" / "INDEX.md").write_text(
        "# Knowledge index\n\nReplay fixture source anchor.\n",
        encoding="utf-8",
    )
    (fixture / "knowledge" / "project-map.md").write_text(
        "# Project map\n\nIsolated conformance fixture.\n",
        encoding="utf-8",
    )
    (fixture / "work" / "INDEX.md").write_text(
        "# Work index\n\nThe real CLI owns this fixture registry.\n",
        encoding="utf-8",
    )


def ensure_configured_mailboxes(fixture: Path) -> None:
    """Materialize configured mailboxes in the isolated replay root."""

    config = json.loads((fixture / "useagent.config.json").read_text(encoding="utf-8"))
    for agent in config["agents"]:
        directory = fixture / agent["directory"]
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "inbox").mkdir(parents=True, exist_ok=True)
        (directory / "INBOX.md").write_text(
            f"# INBOX - {agent['id']}\n\n", encoding="utf-8"
        )
        (directory / "REPORT.md").write_text(
            f"# REPORTS - {agent['id']}\n\n", encoding="utf-8"
        )
        (directory / "COMPLETED.md").write_text(
            f"# COMPLETED - {agent['id']}\n\n", encoding="utf-8"
        )


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="osblog-useagent-replay-") as temp:
        fixture = Path(temp)
        shutil.copy2(ROOT / "useagent.config.json", fixture / "useagent.config.json")
        (fixture / "tools").mkdir()
        shutil.copy2(ROOT / "tools" / "useagent.py", fixture / "tools" / "useagent.py")
        shutil.copytree(ROOT / ".agents", fixture / ".agents")

        cli = fixture / "tools" / "useagent.py"
        run(cli, fixture, "init")
        write_minimum_ledger(fixture)
        ensure_configured_mailboxes(fixture)
        run(cli, fixture, "validate")

        task_id = run(
            cli,
            fixture,
            "task",
            "new",
            "--title",
            "Replay conformance task",
            "--objective",
            "Exercise the bounded UseAgent lifecycle in an isolated replay root.",
            "--level",
            "L0",
            "--owner",
            "supervisor",
            "--scope",
            "docs/replay-proof.md",
            "--acceptance",
            "Replay proof is created and reviewed through the real CLI.",
            "--verification",
            "python tools/useagent.py validate",
            "--preferred-agent",
            "codex",
            "--capability",
            "tests",
        )
        assert task_id.startswith("UA-"), task_id

        cycle_output = run(cli, fixture, "supervisor", "cycle", "--max-assignments", "1")
        assignment = fixture / "work" / "agents" / "codex" / "inbox" / f"{task_id}.md"
        assert assignment.exists(), assignment

        pulled = run(cli, fixture, "worker", "pull", "--agent", "codex")
        assert task_id in pulled, pulled

        proof = fixture / "docs" / "replay-proof.md"
        proof.parent.mkdir(parents=True, exist_ok=True)
        proof.write_text(
            "# Replay proof\n\n"
            "This artifact is supervisor-local replay/simulation evidence.\n"
            "The worker identity is Codex in the fixture; no vendor runtime is claimed.\n",
            encoding="utf-8",
        )
        report_path = run(
            cli,
            fixture,
            "task",
            "report",
            task_id,
            "--agent",
            "codex",
            "--result",
            "completed",
            "--summary",
            "Supervisor-local replay worker report.",
            "--next-action",
            "Review the isolated replay evidence.",
            "--file",
            "docs/replay-proof.md",
            "--check",
            "python tools/useagent.py validate -> VALID",
        )
        assert report_path.endswith(".md"), report_path

        run(
            cli,
            fixture,
            "task",
            "evidence",
            task_id,
            "--kind",
            "review",
            "--value",
            "Supervisor-local replay review: task, report, completion log, and proof are present; no external execution claimed.",
            "--agent",
            "supervisor",
        )
        run(cli, fixture, "task", "update", task_id, "--status", "needs_review", "--agent", "supervisor")
        run(cli, fixture, "task", "update", task_id, "--status", "done", "--agent", "supervisor")
        checkpoint = run(
            cli,
            fixture,
            "checkpoint",
            "create",
            "--name",
            "isolated conformance replay",
            "--status",
            "complete",
            "--summary",
            "Supervisor-local replay completed through the real CLI.",
            "--next-action",
            "Inspect the replay output and retain this command as conformance evidence.",
            "--agent",
            "supervisor",
            "--task",
            task_id,
        )
        assert checkpoint.endswith(".md"), checkpoint
        final = json.loads(run(cli, fixture, "task", "show", task_id))
        assert final["status"] == "done", final
        assert final["reports"], final
        assert any(item.get("kind") == "review" for item in final["evidence"]), final
        assert (fixture / "work" / "completed" / "COMPLETED.md").exists()
        assert cycle_output
        print(
            "REPLAY_PASS "
            f"task={task_id} report={report_path} checkpoint={checkpoint} "
            "mode=supervisor-local-replay simulation=true cleanup=true"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
