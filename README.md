# TaskMaster CLI

Aplicativo de linha de comando (CLI) puro em Python para gerenciamento de tarefas e metas de estudo a longo prazo.

## Estrutura do projeto

```
taskmaster_cli/
├── data/
│   └── tasks.json          # criado automaticamente na primeira execução
├── taskmaster/
│   ├── __init__.py
│   ├── models.py            # Camada de domínio: Task, Priority, Status
│   ├── repository.py        # Camada de dados: leitura/escrita do JSON
│   ├── service.py           # Camada de negócio: regras de gerenciamento
│   └── cli.py               # Camada de interface: argparse + comandos
├── tests/
│   ├── __init__.py
│   ├── test_repository.py
│   ├── test_service.py
│   └── test_cli.py
├── main.py                  # Ponto de entrada
├── requirements.txt
├── pytest.ini
└── README.md
```

## Arquitetura (Clean Code)

O projeto segue uma separação estrita em três camadas, cada uma dependendo
apenas da camada abaixo dela:

1. **`models.py`** (domínio): define `Task`, `Priority` e `Status`. Não
   depende de nada além da biblioteca padrão.
2. **`repository.py`** (dados): único módulo que sabe ler/escrever o
   arquivo JSON. Depende apenas de `models.py`.
3. **`service.py`** (negócio): implementa as regras de criação, listagem,
   conclusão e remoção de tarefas. Depende de `repository.py` e
   `models.py`, mas nunca sabe que existe um terminal.
4. **`cli.py`** (interface): traduz argumentos de linha de comando em
   chamadas ao `TaskService` e formata a saída para o usuário.

Essa separação permite testar toda a lógica de negócio sem tocar em
arquivos reais (usando repositórios apontando para diretórios temporários)
e sem depender do parser de linha de comando.

## Instalação

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Uso

```bash
# Adicionar uma tarefa
python main.py add "Estudar Álgebra Linear" -c "Matemática" -p Alta

# Listar todas as tarefas
python main.py list

# Listar com filtros
python main.py list -c Matemática -p Alta -s Pendente

# Concluir uma tarefa pelo ID
python main.py complete 1

# Remover uma tarefa pelo ID
python main.py delete 1
```

## Modelo de dados

Cada tarefa é armazenada em `data/tasks.json` com os campos:

| Campo        | Tipo   | Descrição                              |
|--------------|--------|-----------------------------------------|
| `id`         | int    | Identificador único incremental         |
| `title`      | str    | Título da tarefa                        |
| `category`   | str    | Categoria/disciplina                    |
| `priority`   | str    | "Alta", "Média" ou "Baixa"              |
| `status`     | str    | "Pendente" ou "Concluída"               |
| `created_at` | str    | Data/hora de criação (ISO 8601)         |

## Rodando os testes

```bash
pytest -v
```

Os testes usam a fixture `tmp_path` do pytest para isolar completamente
os arquivos de dados usados em cada teste, garantindo que a suíte nunca
toque no arquivo real `data/tasks.json`.
