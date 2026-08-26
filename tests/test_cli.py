from pathlib import Path

import pytest

from taskmaster import cli
from taskmaster.repository import TaskRepository
from taskmaster.service import TaskService


def test_build_parser_parses_add_command() -> None:
    parser = cli.build_parser()
    args = parser.parse_args(["add", "Estudar React", "-c", "Frontend", "-p", "Alta"])
    assert args.command == "add"
    assert args.title == "Estudar React"
    assert args.category == "Frontend"
    assert args.priority == "Alta"


def test_build_parser_parses_list_command_defaults() -> None:
    parser = cli.build_parser()
    args = parser.parse_args(["list"])
    assert args.command == "list"
    assert args.category is None
    assert args.priority is None
    assert args.status is None


def test_run_add_creates_task_via_service(tmp_path: Path) -> None:
    repository = TaskRepository(tmp_path / "tasks.json")
    service = TaskService(repository)
    parser = cli.build_parser()
    args = parser.parse_args(["add", "Ler capítulo 3", "-c", "Leitura", "-p", "Baixa"])
    result = cli.run_add(service, args)
    assert "Tarefa criada com sucesso" in result
    assert "Ler capítulo 3" in result
    assert len(service.list_tasks()) == 1


def test_run_list_reports_no_tasks_when_empty(tmp_path: Path) -> None:
    repository = TaskRepository(tmp_path / "tasks.json")
    service = TaskService(repository)
    parser = cli.build_parser()
    args = parser.parse_args(["list"])
    assert cli.run_list(service, args) == "Nenhuma tarefa encontrada para os filtros informados."


def test_run_complete_updates_task_status(tmp_path: Path) -> None:
    repository = TaskRepository(tmp_path / "tasks.json")
    service = TaskService(repository)
    task = service.add_task("Tarefa X", "Geral", "Média")
    parser = cli.build_parser()
    args = parser.parse_args(["complete", str(task.id)])
    result = cli.run_complete(service, args)
    assert "Tarefa concluída" in result


def test_run_delete_removes_task(tmp_path: Path) -> None:
    repository = TaskRepository(tmp_path / "tasks.json")
    service = TaskService(repository)
    task = service.add_task("Tarefa Y", "Geral", "Média")
    parser = cli.build_parser()
    args = parser.parse_args(["delete", str(task.id)])
    result = cli.run_delete(service, args)
    assert f"Tarefa #{task.id} removida" in result
    assert service.list_tasks() == []


def test_main_returns_zero_on_success(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    data_file = tmp_path / "tasks.json"
    monkeypatch.setattr(cli, "DEFAULT_DATA_PATH", data_file)
    assert cli.main(["add", "Tarefa via main", "-c", "Geral", "-p", "Alta"]) == 0
    repository = TaskRepository(data_file)
    assert len(repository.load_all()) == 1


def test_main_returns_one_on_error(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    data_file = tmp_path / "tasks.json"
    monkeypatch.setattr(cli, "DEFAULT_DATA_PATH", data_file)
    assert cli.main(["complete", "999"]) == 1
