"""Ponto de entrada executável do TaskMaster CLI.

Uso:
    python main.py add "Estudar Álgebra Linear" -c "Matemática" -p Alta
    python main.py list
    python main.py list -p Alta -s Pendente
    python main.py complete 1
    python main.py delete 1
"""

from taskmaster.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
