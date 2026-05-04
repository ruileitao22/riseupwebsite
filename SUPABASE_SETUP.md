# Supabase setup para os formularios

O site ja esta preparado para gravar as submissões dos formularios diretamente no Supabase.

## 1. Criar as tabelas

No painel do Supabase:

1. Abre `SQL Editor`
2. Cola o conteudo de [supabase-setup.sql](/C:/Users/ruipe/iCloudDrive/Trabalhos%20individuais/Websites/Riseup/supabase-setup.sql)
3. Executa o script

Isto cria duas tabelas:

- `contact_submissions`
- `join_applications`

## 2. Colar a chave publica

No painel do Supabase:

1. Vai a `Settings > API`
2. Copia a `anon` key ou `publishable key`
3. Abre [supabase-config.js](/C:/Users/ruipe/iCloudDrive/Trabalhos%20individuais/Websites/Riseup/supabase-config.js)
4. Substitui `COLOCA_AQUI_A_TUA_SUPABASE_ANON_KEY` pela chave

Importante:

- usa apenas a chave publica
- nao coloques a `service_role` key no site

## 3. Onde vais ver os envios

No Supabase, abre `Table Editor`.

Os contactos ficam em:

- `contact_submissions`

As candidaturas ficam em:

- `join_applications`

## 4. Campos gravados

### Contactos

- `name`
- `email`
- `message`
- `submitted_at`
- `status`
- `source_page`
- `page_url`
- `language`
- `user_agent`

### Candidaturas

- `name`
- `email`
- `phone_contact`
- `course`
- `study_year`
- `motivation`
- `linkedin`
- `age`
- `submitted_at`
- `status`
- `source_page`
- `page_url`
- `language`
- `user_agent`

## Recomendacao seguinte

Como o site vai ficar publico, o proximo passo recomendado e adicionar protecao anti-spam, por exemplo Cloudflare Turnstile.

## 5. BackOffice

O projeto inclui agora um BackOffice em:

- `backoffice.html`

Antes de usar, executa novamente o ficheiro `supabase-setup.sql` no SQL Editor do Supabase. O script e incremental e cria/adapta:

- `user_profiles`
- `team_members`
- `projects`
- `project_members`
- buckets de Storage `team-photos` e `project-images`
- politicas RLS para visitantes, membros e administradores
- trigger que cria automaticamente um perfil de equipa quando uma conta e criada em `Authentication > Users`

### Criar o primeiro administrador

1. No Supabase, vai a `Authentication > Users`.
2. Cria um utilizador com email e password.
3. Copia o email usado.
4. No SQL Editor, executa:

```sql
insert into public.user_profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'EMAIL_DO_ADMIN@EXEMPLO.COM'
on conflict (id) do update
set role = 'admin',
    email = excluded.email;
```

Depois abre `backoffice.html` e faz login com esse utilizador.

### Perfis de equipa

A partir de agora nao precisas de criar membros manualmente no BackOffice.

Quando crias uma conta em `Authentication > Users`, o trigger do SQL cria automaticamente:

- uma linha em `user_profiles`
- uma linha em `team_members`

Depois a pessoa pode entrar no BackOffice e editar apenas o proprio perfil. O administrador pode editar o perfil de toda a gente, incluindo o dele.

Se ja tinhas contas criadas antes desta versao do SQL, volta a executar `supabase-setup.sql`. O script faz backfill e cria os perfis em falta. Se ja existir um perfil antigo com o mesmo email e sem `user_id`, o SQL tenta associar esse perfil a conta em vez de criar duplicados.

Para esconder alguem do site publico, usa o campo `Ativo no site publico` em vez de apagar o perfil. Assim a conta continua sempre ligada ao seu perfil.

### Estados dos projetos

Os projetos usam obrigatoriamente:

- `draft`: fica guardado no BackOffice, mas nao aparece no site publico
- `published`: aparece em `projetos.html` e nas listas de projetos dos membros

### Storage

As novas fotografias carregadas pelo BackOffice vao para:

- membros: `team-photos`
- projetos: `project-images`

As imagens existentes do site foram mantidas nos projetos iniciais como caminhos locais para nao quebrar o site. Ao editar um projeto e carregar uma nova imagem, o novo URL passa a vir do Supabase Storage.

### Variaveis/configuracao

Este site e estatico e usa `supabase-config.js`.

Obrigatorio:

- `url`
- `publicKey`

Ja configurado no ficheiro:

- nomes das tabelas
- nomes dos buckets de Storage
