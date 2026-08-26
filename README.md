# 🗂️ TaskFlow — Kanban + Chat

Aplicação web de gerenciamento de tarefas em equipe, combinando um quadro **Kanban**, autenticação, organização por equipes e um **chat integrado** em uma interface simples e responsiva.

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-6c8cff?style=flat)

---

## Apresentação

O **TaskFlow** foi desenvolvido para centralizar o acompanhamento de tarefas e a comunicação de pequenas equipes em uma única aplicação.

A interface apresenta um quadro Kanban com três etapas — **Pendente**, **Em Andamento** e **Concluído** — além de um painel de chat para comunicação da equipe e mensagens diretas.

A aplicação funciona diretamente no navegador e utiliza o `localStorage` para persistir usuários, sessão, tarefas, checklist, comentários, anexos e mensagens.

---

## Funcionalidades

- **Autenticação** — login, logout e criação de novas contas
- **Perfis de usuário** — diferenciação entre `Admin` e `Membro`
- **Equipes** — usuários são associados a equipes
- **Quadro Kanban** — tarefas organizadas em Pendente, Em Andamento e Concluído
- **Arrastar e soltar** — movimentação de tarefas entre as etapas
- **Busca de tarefas** — filtro por título
- **Prioridades** — Urgente, Alta, Normal e Baixa
- **Datas** — definição de início e término
- **Responsáveis** — associação de membros às tarefas
- **Checklist** — criação e conclusão de subtarefas
- **Comentários** — comunicação dentro de uma tarefa
- **Anexos** — registro de arquivos associados às tarefas
- **Chat da equipe** — mensagens compartilhadas entre membros
- **Mensagens diretas** — conversa individual entre membros
- **Temas visuais** — Claro, Escuro e Roxo
- **Interface responsiva** — suporte a diferentes tamanhos de tela

---

## Como Rodar

O projeto não depende de framework ou backend. Basta disponibilizar os arquivos estáticos através de um servidor local.

```bash
cd taskflow
python -m http.server 8777
```

Depois, abra no navegador:

```text
http://localhost:8777
```

Também é possível utilizar qualquer outro servidor HTTP estático.

---

## Contas de Demonstração

| Usuário | Senha | Cargo | Equipe |
|---|---|---|---|
| Ana Silva | `admin123` | Admin | Equipe A |
| Carlos Souza | `membro123` | Membro | Equipe A |
| Beatriz Lima | `admin123` | Admin | Equipe B |
| Rafael Nogueira | `membro123` | Membro | Equipe B |

> **Observação:** essas credenciais são apenas para demonstração. O projeto utiliza armazenamento local e não implementa autenticação segura para produção.

---

## Estrutura do Projeto

```text
taskflow/
├── index.html       # Estrutura da interface
├── styles.css       # Estilos, temas e responsividade
├── app.js           # Autenticação, tarefas, chat e lógica da aplicação
└── README.md        # Documentação do projeto
```

---

## Organização da Aplicação

### Autenticação e usuários

O `UserManager` controla o cadastro e a persistência dos usuários, enquanto o `AuthManager` gerencia login, sessão e permissões administrativas.

### Tarefas

O `TaskManager` concentra as operações do Kanban:

- criação e edição;
- mudança de status;
- exclusão;
- prioridades;
- responsáveis;
- checklist;
- comentários;
- anexos;
- filtros por equipe, status e título.

### Chat

O `ChatManager` mantém mensagens de equipe e mensagens diretas, utilizando armazenamento local.

---

## Tecnologias

- **HTML5** — estrutura da aplicação
- **CSS3** — layout, temas, animações e responsividade
- **JavaScript** — lógica da aplicação e gerenciamento de estado
- **LocalStorage** — persistência dos dados no navegador
- **Drag and Drop / Touch Events** — movimentação de tarefas no Kanban

O projeto foi construído sem frameworks externos, mantendo uma arquitetura front-end simples baseada em HTML, CSS e JavaScript.

---

## Temas

A interface possui três opções visuais:

- ☀️ **Claro**
- 🌙 **Escuro**
- 🟣 **Roxo**

O tema selecionado é salvo localmente para ser recuperado quando a aplicação for aberta novamente.

---

## Persistência de Dados

Os principais dados da aplicação são armazenados no navegador através do `localStorage`:

```text
taskflow-users
taskflow-session
taskflow-tasks
taskflow-chat
taskflow-theme
```

Isso permite utilizar o projeto sem banco de dados ou servidor de aplicação, mas os dados ficam vinculados ao navegador/dispositivo utilizado.

---

## Limitações

- Não possui backend ou banco de dados remoto.
- Os dados não são sincronizados entre dispositivos.
- As credenciais de demonstração ficam no código-fonte.
- O armazenamento local não deve ser considerado adequado para dados sensíveis ou uso em produção.
- O sistema de anexos registra os arquivos associados à tarefa, mas não substitui um armazenamento de arquivos em servidor.

---

## Licença

Este projeto é disponibilizado para fins de estudo e demonstração. Consulte o repositório para informações adicionais sobre a licença e condições de uso.

---

## Autor

Desenvolvido por **João Maia**.
