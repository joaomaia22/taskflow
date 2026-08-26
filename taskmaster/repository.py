"""
Camada de dados (persistência) do TaskMaster CLI.

Responsável exclusivamente por ler e escrever a lista de tarefas em um
arquivo JSON local. Não conhece regras de negócio nem lida com a
interface de linha de comando — apenas persistência.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from taskmaster.models import Task

DEFAULT_DATA_PATH = Path("data") / "tasks.json"


class TaskRepository:
    """Repositório responsável por ler/gravar tarefas em um arquivo JSON."""

    def __init__(self, file_path: Path | str = DEFAULT_DATA_PATH) -> None:
        self.file_path = Path(file_path)

    def _ensure_file_exists(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def load_all(self) -> List[Task]:
        self._ensure_file_exists()
        try:
            raw_content = self.file_path.read_text(encoding="utf-8").strip()
            if not raw_content:
                return []
            raw_tasks = json.loads(raw_content)
        except (json.JSONDecodeError, OSError):
            return []

        return [Task.from_dict(item) for item in raw_tasks]

    def save_all(self, tasks: List[Task]) -> None:
        self._ensure_file_exists()
        serializable = [task.to_dict() for task in tasks]
        self.file_path.write_text(
            json.dumps(serializable, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
