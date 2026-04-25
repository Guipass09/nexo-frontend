# Checklist de Liberacao para Piloto

## Ambiente

- `APP_ENV=production` ou ambiente de homologacao controlado.
- `APP_DEBUG=false`.
- `APP_KEY` configurado e preservado.
- `APP_URL` apontando para a URL publica do backend.
- `VITE_API_BASE_URL` apontando para a URL publica do backend com `/api`.
- CORS validado para o dominio do frontend.

## WhatsApp Cloud API

- `WHATSAPP_ACCESS_TOKEN` valido e com permissao para envio.
- `WHATSAPP_PHONE_NUMBER_ID` correto.
- `WHATSAPP_BUSINESS_ACCOUNT_ID` correto para sincronizacao de templates.
- `WHATSAPP_API_VERSION` revisado.
- Templates aprovados sincronizados no painel antes do piloto.
- Upload de midia testado com imagem, documento e video pequeno.

## Webhook

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` definido e conhecido pela equipe.
- Endpoint `GET /api/webhook/whatsapp` validado na Meta.
- Endpoint `POST /api/webhook/whatsapp` recebendo mensagens reais.
- Logs de webhook monitorados no primeiro dia de piloto.

## Autenticacao e Permissoes

- Admin real criado.
- Operadores reais criados com role `operator`.
- Tokens antigos/remanescentes revogados quando necessario.
- TTL de token revisado: `API_TOKEN_TTL_MINUTES`, `API_TOKEN_REFRESH_WINDOW_MINUTES`, `API_TOKEN_REFRESH_LEAD_MINUTES`.
- Acesso admin restrito para auditoria, operadores e governanca de midia.

## Banco e Migracoes

- Banco de producao definido em `DB_CONNECTION` e credenciais correspondentes.
- `php artisan migrate --force` executado.
- Seeders de demo nao usados em producao sem revisao.
- Backup inicial realizado antes do piloto.
- Politica de backup diario definida.

## Logs e Observabilidade

- `LOG_CHANNEL` configurado para destino persistente.
- Falhas da Cloud API monitoradas.
- Auditoria manual revisada em `/auditoria`.
- Governanca de midia revisada em `/midias/:id`.
- Alertas operacionais definidos fora do sistema, se necessario.

## Operacao Manual

- Janela de 24h validada com conversa real.
- Envio manual de texto testado dentro da janela.
- Envio de template testado fora da janela.
- Template com header de midia testado.
- Midia manual testada por URL, Media ID e asset enviado.
- Arquivar/restaurar asset testado por admin.
- Operadores treinados para usar template quando a janela estiver fechada.

## Riscos Aceitos no Piloto

- Nao ha automacao ativa.
- Nao ha delecao definitiva de assets.
- Nao ha storage local/S3 completo para copia propria de midia.
- Preview de Media ID depende dos metadados locais; nao baixa midia da Meta.
- Monitoramento e backups ainda dependem da infraestrutura onde o backend esta rodando.
