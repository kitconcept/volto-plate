import subprocess
from pathlib import Path

PACKAGE_NAME = "volto-plate"
cwd = Path(__file__).parent


def versions_from_state(state) -> tuple[str, str]:
    """Extract the current and previous version from the state."""
    # this will be available in runtime
    from repoplone.utils.versions import convert_python_node_version  # type: ignore

    original_version = state.original_version
    next_version = state.next_version
    return (
        convert_python_node_version(original_version),
        convert_python_node_version(next_version),
    )


def add_artifact_to_git(settings, filepath: Path) -> bool:
    """Add the artifact to git."""
    from repoplone.utils._git import repo_for_project  # type: ignore

    repo = repo_for_project(settings.root_path)
    repo.index.add([str(filepath)])
    return True


def create_artifact(step_id, title, settings, state, **kwargs) -> bool:
    """Create the artifact for the newly created version."""
    artifacts_dir = cwd / "artifacts"
    original_version, next_version = versions_from_state(state)
    if not artifacts_dir.exists():
        artifacts_dir.mkdir(parents=True)
    artifact_file = artifacts_dir / f"kitconcept-{PACKAGE_NAME}-{next_version}.tgz"
    cmd = ["pnpm", "run", "artifact-release"]
    result = subprocess.run(  # noQA: S602
        " ".join(cmd),
        capture_output=True,
        text=True,
        shell=True,
        cwd=cwd,
    )
    if result.returncode:
        raise RuntimeError(f"Create artifact failed {result.stderr}")
    elif not artifact_file.exists():
        raise RuntimeError(
            f"Artifact file {artifact_file} not found after creation. {result.stdout}"
        )
    # Cleanup (Remove old artifact if exists)
    previous_artifact_file = (
        artifacts_dir / f"kitconcept-{PACKAGE_NAME}-{original_version}.tgz"
    )
    final_file = artifacts_dir / f"kitconcept-{PACKAGE_NAME}.tgz"
    # Remove artifact for previous version if exists
    if previous_artifact_file.exists():
        previous_artifact_file.unlink()
    # Remove existing artifact if exists
    if final_file.exists():
        final_file.unlink()
    # Rename artifact
    artifact_file.rename(final_file)
    # Add to git
    add_artifact_to_git(settings, final_file)
    return True
