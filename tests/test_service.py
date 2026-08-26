from pathlib import Path

import pytest

from taskmaster.models import Priority, Status
from taskmaster.repository import TaskRepository
from taskmaster.service import TaskNotFoundError, TaskService


@pytest.fixture
def service(tmp_path: Path) -> TaskService:
    repository = TaskRepository(tmp_path / "tasks.json")
    return TaskService(repository)


def test_add_task_creates_task_with_expected_fields(service: TaskService) -> None:
    task = service.add_task(title="Estudar Python", category="Programação", priority="Alta")
    assert task.id == 1
    assert task.title == "Estudar Python"
    assert task.category == "Programação"
    assert task.priority == Priority.ALTA
    assert task.status == Status.PENDENTE
    assert task.created_at != ""


def test_add_task_increments_id_sequentially(service: TaskService) -> None:
    first = service.add_task("Tarefa 1", "Geral", "Baixa")
    second = service.add_task("Tarefa 2", "Geral", "Baixa")
    assert first.id == 1
    assert second.id == 2


def test_add_task_rejects_empty_title(service: TaskService) -> None:
    with pytest.raises(ValueError):
        service.add_task(title="   ", category="Geral", priority="Média")


def test_add_task_rejects_invalid_priority(service: TaskService) -> None:
    with pytest.raises(ValueError):
        service.add_task(title="Tarefa válida", category="Geral", priority="Urgentíssima")


def test_add_task_defaults_category_when_blank(service: TaskService) -> None:
    task = service.add_task(title="Sem categoria", category="   ", priority="Baixa")
    assert task.category == "Geral"


def test_list_tasks_returns_all_when_no_filters(service: TaskService) -> None:
    service.add_task("Tarefa A", "Matemática", "Alta")
    service.add_task("Tarefa B", "História", "Baixa")
    assert len(service.list_tasks()) == 2


def test_list_tasks_filters_by_category(service: TaskService) -> None:
    service.add_task("Álgebra", "Matemática", "Alta")
    service.add_task("Revolução Francesa", "História", "Média")
    tasks = service.list_tasks(category="matemática")
    assert len(tasks) == 1
    assert tasks[0].title == "Álgebra"


def test_list_tasks_filters_by_priority(service: TaskService) -> None:
    service.add_task("Tarefa Alta", "Geral", "Alta")
    service.add_task("Tarefa Baixa", "Geral", "Baixa")
    tasks = service.list_tasks(priority="Alta")
    assert len(tasks) == 1
    assert tasks[0].priority == Priority.ALTA


def test_list_tasks_filters_by_status(service: TaskService) -> None:
    task = service.add_task("Concluir depois", "Geral", "Média")
    service.add_task("Ainda pendente", "Geral", "Média")
    service.complete_task(task.id)
    assert len(service.list_tasks(status="Pendente")) == 1
    completed = service.list_tasks(status="Concluída")
    assert len(completed) == 1
    assert completed[0].id == task.id


def test_list_tasks_orders_by_priority_then_id(service: TaskService) -> None:
    service.add_task("Baixa 1", "Geral", "Baixa")
    service.add_task("Alta 1", "Geral", "Alta")
    service.add_task("Média 1", "Geral", "Média")
    tasks = service.list_tasks()
    assert [t.priority for t in tasks] == [Priority.ALTA, Priority.MEDIA, Priority.BAIXA]


def test_complete_task_marks_status_as_concluded(service: TaskService) -> None:
    task = service.add_task("Estudar Estatística", "Matemática", "Média")
    completed = service.complete_task(task.id)
    assert completed.status == Status.CONCLUIDA
    assert len(service.list_tasks(status="Concluída")) == 1


def test_complete_task_raises_for_invalid_id(service: TaskService) -> None:
    with pytest.raises(TaskNotFoundError):
        service.complete_task(task_id=999)


def test_delete_task_removes_task(service: TaskService) -> None:
    task = service.add_task("Tarefa a remover", "Geral", "Baixa")
    service.delete_task(task.id)
    assert service.list_tasks() == []


def test_delete_task_raises_for_invalid_id(service: TaskService) -> None:
    with pytest.raises(TaskNotFoundError):
        service.delete_task(task_id=42)


def test_delete_task_keeps_other_tasks_intact(service: TaskService) -> None:
    keep = service.add_task("Manter", "Geral", "Alta")
    remove = service.add_task("Remover", "Geral", "Baixa")
    service.delete_task(remove.id)
    remaining = service.list_tasks()
    assert len(remaining) == 1
    assert remaining[0].id == keep.id
