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

Não deve ser usada nem exposta uma `service_role` key.

## Verificação

`npm run check` executa lint, TypeScript, testes e a compilação de produção. `npm audit --omit=dev` verifica as dependências de produção.

## Conteúdo preservado

Os ficheiros HTML/CSS/JavaScript originais permanecem como fonte de compatibilidade para garantir equivalência visual e funcional. Depois de alterações nesse conteúdo, executar `npm run generate:content` para regenerar o conteúdo tipado e os recursos em `public/legacy`.

Os URLs antigos terminados em `.html` são redirecionados permanentemente para os novos URLs limpos.

## Backoffice interno

O workspace interno inclui Dashboard personalizado, To-Do, Projetos, Recursos Humanos, Comunicação, Documentos, Contactos e Perfil. Para ativar as novas tabelas e políticas, executar `supabase-workspace-setup.sql` no editor SQL do Supabase depois do setup principal.

Durante desenvolvimento, o design pode ser revisto sem autenticação em `/backoffice?preview=1`. Este modo só funciona em `localhost` ou `127.0.0.1` e nunca é ativado no domínio de produção.

Os administradores têm uma área **Definições → Ver como um cargo** para validar a navegação de Administrador, Team Líder por área, Comunicação, Projetos e Inovação e Recursos Humanos. A simulação é apenas visual, fica no navegador e não altera o cargo persistido nem as autorizações aplicadas pelo Supabase.

A área **Documentos**, os registos da biblioteca, os ficheiros privados e as rotas da Google Drive são exclusivos de Administradores e de todos os cargos Team Líder. Os restantes cargos não veem o menu e recebem acesso negado se tentarem chamar diretamente a API.

Depois desta atualização, voltar a executar `supabase-workspace-setup.sql` no Supabase para instalar os novos cargos e respetivas políticas. Os valores antigos `member` e `team_leader` continuam aceites apenas para compatibilidade com contas existentes.

## Google Drive no backoffice

A secção Documentos usa como raiz a pasta `18mdhHygC7zUMlU7U0r_2lR5SXkvg2s8T`. A autenticação dos membros continua a ser feita apenas pelo Supabase. A ligação à Drive existe exclusivamente no servidor e utiliza a conta Google pessoal da Rise Up através de OAuth 2.0.

Configuração:

1. No Google Cloud, criar um projeto, ativar a Google Drive API e configurar o ecrã de consentimento OAuth.
2. Criar credenciais OAuth 2.0 do tipo aplicação Web.
3. Autorizar uma vez a conta Google proprietária da pasta com o scope `https://www.googleapis.com/auth/drive` e obter um refresh token com acesso offline.
4. Guardar em `.env.local` e na Vercel `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `GOOGLE_OAUTH_REFRESH_TOKEN`.
5. Nunca colocar o client secret ou o refresh token no Git, no JavaScript do browser ou numa mensagem.

Permissões internas: membros autenticados podem navegar e pré-visualizar; administradores e todos os cargos Team Líder podem criar pastas, carregar ficheiros e mudar nomes; apenas administradores podem enviar itens para o lixo. O botão Abrir e editar abre o original na Google Drive. Como a API atua pela conta proprietária, o link da pasta pode ficar como **Restrito**, evitando um link público de editor.

Uma service account só é adequada para escrita se a pasta estiver num Shared Drive do Google Workspace. Numa pasta pessoal em O meu disco, a Google não permite que service accounts sejam proprietárias de ficheiros novos.
