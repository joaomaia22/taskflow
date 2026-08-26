"""Modelos de domínio do TaskMaster CLI."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict


class Priority(str, Enum):
    """Prioridade disponível para uma tarefa."""

    ALTA = "Alta"
    MEDIA = "Média"
    BAIXA = "Baixa"

    @classmethod
    def from_string(cls, value: str) -> "Priority":
        """Converte texto para uma prioridade válida."""
        normalized = value.strip().lower()
        mapping = {item.value.lower(): item for item in cls}
        try:
            return mapping[normalized]
        except KeyError as exc:
            raise ValueError("Prioridade inválida. Use Alta, Média ou Baixa.") from exc


class Status(str, Enum):
    """Status disponível para uma tarefa."""

    PENDENTE = "Pendente"
    CONCLUIDA = "Concluída"


@dataclass
class Task:
    """Representa uma tarefa do sistema."""

    id: int
    title: str
    category: str
    priority: Priority
    status: Status = field(default=Status.PENDENTE)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))

    def to_dict(self) -> Dict[str, Any]:
        """Serializa a tarefa para um dicionário compatível com JSON."""
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "priority": self.priority.value,
            "status": self.status.value,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "Task":
        """Reconstrói uma Task a partir de um dicionário."""
        return Task(
            id=int(data["id"]),
            title=str(data["title"]),
            category=str(data["category"]),
            priority=Priority(data["priority"]),
            status=Status(data["status"]),
            created_at=str(data["created_at"]),
        )
