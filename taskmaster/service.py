"""
Camada de lógica de negócio (service) do TaskMaster CLI.

Contém as regras de gerenciamento de tarefas: criação, listagem com
filtros, conclusão e remoção. Depende apenas de TaskRepository (camada
de dados) e dos modelos — nunca de argparse ou de entrada/saída de
terminal, mantendo a lógica de negócio testável de forma isolada.
"""

from __future__ import annotations

from typing import List, Optional

from taskmaster.models import Priority, Status, Task
from taskmaster.repository import TaskRepository


class TaskNotFoundError(Exception):
    """Levantada quando uma operação referencia um ID de tarefa inexistente."""


class TaskService:
    """Orquestra as regras de negócio de tarefas usando um TaskRepository."""

    def __init__(self, repository: TaskRepository) -> None:
        self.repository = repository

    def _generate_next_id(self, tasks: List[Task]) -> int:
        if not tasks:
            return 1
        return max(task.id for task in tasks) + 1

    def add_task(self, title: str, category: str, priority: str) -> Task:
        clean_title = title.strip()
        if not clean_title:
            raise ValueError("O título da tarefa não pode estar vazio.")

        clean_category = category.strip() or "Geral"
        parsed_priority = Priority.from_string(priority)
        tasks = self.repository.load_all()
        new_task = Task(
            id=self._generate_next_id(tasks),
            title=clean_title,
            category=clean_category,
            priority=parsed_priority,
            status=Status.PENDENTE,
        )
        tasks.append(new_task)
        self.repository.save_all(tasks)
        return new_task

    def list_tasks(
        self,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Task]:
        tasks = self.repository.load_all()

        if category:
            tasks = [t for t in tasks if t.category.lower() == category.strip().lower()]

        if priority:
            target_priority = Priority.from_string(priority)
            tasks = [t for t in tasks if t.priority == target_priority]

        if status:
            target_status = Status(status.strip().capitalize())
            tasks = [t for t in tasks if t.status == target_status]

        priority_order = {Priority.ALTA: 0, Priority.MEDIA: 1, Priority.BAIXA: 2}
        return sorted(tasks, key=lambda t: (priority_order[t.priority], t.id))

    def complete_task(self, task_id: int) -> Task:
        tasks = self.repository.load_all()
        task = self._find_task_or_raise(tasks, task_id)
        task.status = Status.CONCLUIDA
        self.repository.save_all(tasks)
        return task

    def delete_task(self, task_id: int) -> None:
        tasks = self.repository.load_all()
        self._find_task_or_raise(tasks, task_id)
        remaining_tasks = [t for t in tasks if t.id != task_id]
        self.repository.save_all(remaining_tasks)

    @staticmethod
    def _find_task_or_raise(tasks: List[Task], task_id: int) -> Task:
        for task in tasks:
            if task.id == task_id:
                return task
        raise TaskNotFoundError(f"Nenhuma tarefa encontrada com o ID {task_id}.")
