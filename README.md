# Rise Up

Website da Rise Up migrado para Next.js, React e TypeScript, mantendo a apresentação e os fluxos do site original.

## Desenvolvimento

1. Instalar dependências com `npm install`.
2. Copiar `.env.example` para `.env.local` e preencher as variáveis públicas do Supabase.
3. Iniciar com `npm run dev`.

O ficheiro `.env.local` existente é ignorado pelo Git. Na Vercel, configurar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- opcionalmente, os aliases server-only `SUPABASE_URL` e `SUPABASE_ANON_KEY`

A `SUPABASE_SERVICE_ROLE_KEY` é usada exclusivamente no servidor para operações internas. Nunca expor esta chave no browser ou numa variável `NEXT_PUBLIC_`.

## Emails de candidaturas e contactos

Após guardar um formulário, `/api/submissions` envia uma notificação através do Resend:

- Contactos: `riseup@umaia.pt`.
- Candidaturas: `riseup@umaia.pt` e os emails de `user_profiles` com cargo `hr_team` ou `team_leader_hr`, sem duplicados.

Os emails incluem os dados do formulário, ligação ao backoffice e Reply-To do remetente. Os restantes destinatários seguem em BCC. Configurar `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_APP_URL` na Vercel; o domínio de envio `updates.riseupmaia.pt` deve estar validado no Resend.

O envio decorre após a resposta HTTP, através de `after` do Next.js. Falhas transitórias têm até três tentativas com a mesma chave de idempotência. Uma falha de email nunca invalida o formulário já guardado: fica registada nos logs da aplicação, sem reenvio persistente automático. Se a consulta dos RH falhar, o endereço institucional continua a ser notificado.

## Denúncias e conflitos de interesse

Cada denúncia confidencial e declaração de conflito gera uma ficha PDF privada no BackOffice. A Direção — administradores, Coordenação e Vice-Coordenação — recebe apenas uma notificação por email, sem anexo nem informação sensível; a ficha é consultada na área **Documentos**. Este envio requer `SUPABASE_SERVICE_ROLE_KEY` para encontrar os destinatários e `RESEND_API_KEY` para entregar a mensagem. Se uma destas variáveis não estiver configurada, a ficha é arquivada na mesma e o respetivo registo em **Documentos** indica a configuração em falta.

## Verificação

`npm run check` executa lint, TypeScript, testes e a compilação de produção. `npm audit --omit=dev` verifica as dependências de produção.

## Conteúdo preservado

Os ficheiros HTML/CSS/JavaScript originais permanecem como fonte de compatibilidade para garantir equivalência visual e funcional. Depois de alterações nesse conteúdo, executar `npm run generate:content` para regenerar o conteúdo tipado e os recursos em `public/legacy`.

Os URLs antigos terminados em `.html` são redirecionados permanentemente para os novos URLs limpos.

## Backoffice interno

O workspace interno inclui Dashboard personalizado, To-Do, Projetos, Recursos Humanos, Comunicação, Documentos, Contactos e Perfil. Para ativar as novas tabelas e políticas, executar `supabase-workspace-setup.sql` no editor SQL do Supabase depois do setup principal.

Durante desenvolvimento, o design pode ser revisto sem autenticação em `/backoffice?preview=1`. Este modo só funciona em `localhost` ou `127.0.0.1` e nunca é ativado no domínio de produção.

Os administradores têm uma área **Definições → Ver como um cargo** para validar a navegação de Administrador, Team Líder por área, Comunicação, Projetos e Inovação e Recursos Humanos. A simulação é apenas visual, fica no navegador e não altera o cargo persistido nem as autorizações aplicadas pelo Supabase.

A área **Documentos**, os registos da biblioteca, os ficheiros privados e a Drive interna são exclusivos de Administradores e de todos os cargos Team Líder. Os restantes cargos não veem o menu e recebem acesso negado se tentarem chamar diretamente a API.

Depois desta atualização, voltar a executar `supabase-workspace-setup.sql` no Supabase para instalar os novos cargos e respetivas políticas. Os valores antigos `member` e `team_leader` continuam aceites apenas para compatibilidade com contas existentes.

## Pedidos de comunicação

Qualquer membro autenticado pode submeter e acompanhar pedidos de comunicação no Dashboard. A aprovação, o agendamento e a não aprovação com motivo são feitos exclusivamente na aba **Comunicação**. Pedidos agendados passam automaticamente a concluídos depois da data de publicação.

Para ativar o fluxo numa instalação existente, executar no editor SQL do Supabase, em duas execuções separadas e pela ordem indicada:

1. `supabase-communication-requests-setup.sql` — cria e verifica a tabela.
2. `supabase-communication-requests-cron.sql` — instala e verifica a conclusão automática.

Confirmar também `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `NEXT_PUBLIC_APP_URL` no ambiente da Vercel para as notificações por email.

## Banco de Ideias e Problemas

O Dashboard permite que qualquer membro envie uma ideia ou problema. Cada membro vê os seus pedidos; Inovação e Projetos, respetivo Team Líder e coordenação veem todos e atualizam o estado. Um novo pedido envia email para os utilizadores com os cargos `projects_innovation_team` e `team_leader_projects_innovation`.

A tabela e as políticas estão em `supabase-innovation-requests.sql`. Confirmar também `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `NEXT_PUBLIC_APP_URL` na Vercel.

## Drive interna no BackOffice

A secção **Documentos** usa a Drive interna da Rise Up, guardada no bucket privado `workspace-documents` do Supabase. Não depende de Google Drive nem de credenciais Google. Administradores, Coordenação, Vice-Coordenação e Team Leaders podem consultar a biblioteca; os mesmos cargos podem criar pastas e carregar ficheiros, enquanto apenas a Direção pode eliminar itens.
