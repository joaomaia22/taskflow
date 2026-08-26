"""
Camada de interface (CLI) do TaskMaster CLI.

Responsável por interpretar os argumentos de linha de comando (via
argparse) e traduzi-los em chamadas à camada de negócio (TaskService).
Não contém regras de negócio nem lógica de persistência — apenas
entrada/saída com o usuário no terminal.
"""

from __future__ import annotations

import argparse
from typing import List, Optional, Sequence

from taskmaster.models import Task
from taskmaster.repository import DEFAULT_DATA_PATH, TaskRepository
from taskmaster.service import TaskNotFoundError, TaskService

PRIORITY_ICONS = {"Alta": "🔴", "Média": "🟡", "Baixa": "🟢"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="taskmaster",
        description="TaskMaster CLI - Gerenciador de tarefas e metas de estudo.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Adiciona uma nova tarefa.")
    add_parser.add_argument("title", type=str, help="Título da tarefa.")
    add_parser.add_argument(
        "-c", "--category", type=str, default="Geral", help="Categoria da tarefa."
    )
    add_parser.add_argument(
        "-p", "--priority", type=str, default="Média",
        help="Prioridade: Alta, Média ou Baixa (padrão: Média).",
    )

    list_parser = subparsers.add_parser("list", help="Lista as tarefas cadastradas.")
    list_parser.add_argument("-c", "--category", type=str, default=None, help="Filtra por categoria.")
    list_parser.add_argument("-p", "--priority", type=str, default=None, help="Filtra por prioridade.")
    list_parser.add_argument(
        "-s", "--status", type=str, default=None,
        choices=["Pendente", "Concluída"], help="Filtra por status.",
    )

    complete_parser = subparsers.add_parser("complete", help="Marca uma tarefa como concluída.")
    complete_parser.add_argument("id", type=int, help="ID da tarefa a concluir.")

    delete_parser = subparsers.add_parser("delete", help="Remove uma tarefa.")
    delete_parser.add_argument("id", type=int, help="ID da tarefa a remover.")
    return parser


def format_task_line(task: Task) -> str:
    icon = PRIORITY_ICONS.get(task.priority.value, "")
    status_mark = "[x]" if task.status.value == "Concluída" else "[ ]"
    return (
        f"{status_mark} #{task.id} {icon} {task.title} "
        f"(Categoria: {task.category} | Prioridade: {task.priority.value} | "
        f"Criada em: {task.created_at})"
    )


def run_add(service: TaskService, args: argparse.Namespace) -> str:
    task = service.add_task(title=args.title, category=args.category, priority=args.priority)
    return f"Tarefa criada com sucesso: {format_task_line(task)}"


def run_list(service: TaskService, args: argparse.Namespace) -> str:
    tasks = service.list_tasks(category=args.category, priority=args.priority, status=args.status)
    if not tasks:
        return "Nenhuma tarefa encontrada para os filtros informados."
    return "\n".join(format_task_line(task) for task in tasks)


def run_complete(service: TaskService, args: argparse.Namespace) -> str:
    task = service.complete_task(task_id=args.id)
    return f"Tarefa concluída: {format_task_line(task)}"


def run_delete(service: TaskService, args: argparse.Namespace) -> str:
    service.delete_task(task_id=args.id)
    return f"Tarefa #{args.id} removida com sucesso."


COMMAND_HANDLERS = {
    "add": run_add,
    "list": run_list,
    "complete": run_complete,
    "delete": run_delete,
}


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    repository = TaskRepository(DEFAULT_DATA_PATH)
    service = TaskService(repository)
    handler = COMMAND_HANDLERS[args.command]
    try:
        output = handler(service, args)
        print(output)
        return 0
    except (ValueError, TaskNotFoundError) as error:
        print(f"Erro: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
