from pathlib import Path

from taskmaster.models import Priority, Status, Task
from taskmaster.repository import TaskRepository


def test_load_all_creates_file_when_missing(tmp_path: Path) -> None:
    data_file = tmp_path / "tasks.json"
    repository = TaskRepository(data_file)
    tasks = repository.load_all()
    assert tasks == []
    assert data_file.exists()


def test_save_all_and_load_all_round_trip(tmp_path: Path) -> None:
    data_file = tmp_path / "tasks.json"
    repository = TaskRepository(data_file)
    task = Task(id=1, title="Estudar SQL", category="Banco de Dados", priority=Priority.ALTA)
    repository.save_all([task])
    loaded_tasks = repository.load_all()
    assert len(loaded_tasks) == 1
    assert loaded_tasks[0].id == 1
    assert loaded_tasks[0].title == "Estudar SQL"
    assert loaded_tasks[0].priority == Priority.ALTA
    assert loaded_tasks[0].status == Status.PENDENTE


def test_load_all_handles_corrupted_json(tmp_path: Path) -> None:
    data_file = tmp_path / "tasks.json"
    data_file.write_text("{isso nao e um json valido", encoding="utf-8")
    repository = TaskRepository(data_file)
    assert repository.load_all() == []


def test_save_all_creates_parent_directory(tmp_path: Path) -> None:
    data_file = tmp_path / "nested" / "dir" / "tasks.json"
    repository = TaskRepository(data_file)
    repository.save_all([])
    assert data_file.exists()
    assert data_file.parent.is_dir()
