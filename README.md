# ZAPBO CRED

## Visão Geral

O `MessageService` é um serviço baseado em Node.js que automatiza o envio de mensagens via WhatsApp utilizando a biblioteca **Baileys**. Ele permite o gerenciamento de contatos, envio de mensagens em massa e gera relatórios diários sobre as mensagens enviadas.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **Prisma**: ORM para manipulação do banco de dados
- **Baileys**: Biblioteca para interação com o WhatsApp Web via socket
- **SQLite/PostgreSQL** (dependendo da configuração do Prisma)

## Configuração do Projeto

### 1. Instalação das Dependências

Antes de rodar o projeto, instale as dependências:

```sh
npm install
```

### 2. Configuração do Banco de Dados

Edite o arquivo `.env` e configure a conexão com o banco de dados. Execute a migração para criar as tabelas:

```sh
npx prisma migrate dev
```

### 3. Inicialização do Servidor

Para iniciar o serviço:

```sh
node index.js
```

## Funcionalidades

### 1. Cadastro de Usuários (`create_user`)

Cria um novo usuário com nome, CPF e telefones (principal e secundários). Antes do cadastro, verifica se o CPF e os telefones já estão cadastrados no banco de dados.

```js
await messageService.create_user({
  nome: "João Silva",
  cpf: 12345678900,
  telefone_principal: 5511987654321,
  telefones_secundarios: [5511912345678]
});
```

### 2. Adição de Números a partir de um Arquivo JSON (`addNumber`)

Esta função lê um arquivo JSON contendo uma lista de clientes e adiciona os números filtrados ao banco de dados. O arquivo deve estar localizado no diretório `c:/arkg.solutions/solutions/zapbo_fgts/temps/` e ser nomeado `dados_filtrados.json`. 

O processo ocorre em lotes de 10 para otimizar a performance e evitar sobrecarga.

```js
await messageService.addNumber(5511987654321);
```

### 3. Envio de Mensagens em Massa (`sendToMany`)

- Filtra os contatos que ainda não receberam mensagens
- Verifica se está dentro do horário permitido (06h00 - 22h00)
- Envia mensagens para cada contato
- Atualiza o status no banco de dados
- Aguarda 4 minutos entre cada envio

### 4. Relatórios Diários (`generateDailyReport` e `endofdayreport`)

Gera relatórios com o número total de mensagens enviadas no dia e envia um resumo para os administradores.

```js
await messageService.generateDailyReport(new Date());
```

## Agendamento de Mensagens

O envio de mensagens ocorre de forma automatizada dentro do horário configurado. Caso esteja fora do horário, o sistema aguarda até o horário permitido para retomar os envios.

## Conclusão

Este projeto automatiza o envio de mensagens via WhatsApp, garantindo um processo eficiente e organizado. Caso precise de melhorias ou adaptações, basta modificar os métodos no `MessageService`.

