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
