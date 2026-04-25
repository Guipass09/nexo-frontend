# WhatsApp Embedded Signup por Usuario

Este frontend foi preparado para consumir a conexao oficial por usuario com Meta Embedded Signup e suporte a Coexistence sem remover a integracao global atual.

## Escopo entregue neste workspace

- Secao `WhatsApp conectado` no perfil do usuario.
- Service real para os endpoints:
  - `GET /api/profile/whatsapp`
  - `POST /api/profile/whatsapp/embedded-signup/start`
  - `POST /api/profile/whatsapp/embedded-signup/complete`
  - `POST /api/profile/whatsapp/test`
  - `POST /api/profile/whatsapp/sync-templates`
  - `DELETE /api/profile/whatsapp`
- Hook `useWhatsAppConnection` com:
  - `startConnection()`
  - `retryConnection()`
  - `testConnection()`
  - `syncTemplates()`
  - `disconnectConnection()`
- Loader seguro do SDK da Meta sem expor access token.
- Estados de UI:
  - desconectado
  - conectado
  - erro
- Testes frontend do card de perfil.

## Limitacao atual

Nao existe codigo Laravel neste repositorio. Por isso:

- migrations
- models
- controllers
- services backend
- webhook multi-tenant

nao puderam ser implementados aqui. O frontend ja esta apontando para endpoints reais, sem mock, esperando a API existir no backend Laravel.

## Migration sugerida

Criar migration `create_whatsapp_connections_table` com colunas:

```php
$table->id();
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
$table->string('business_account_id')->nullable()->index();
$table->string('phone_number_id')->nullable()->index();
$table->string('phone_number')->nullable();
$table->string('display_name')->nullable();
$table->text('access_token')->nullable();
$table->timestamp('token_expires_at')->nullable();
$table->string('app_id')->nullable();
$table->string('configuration_id')->nullable();
$table->string('connection_type')->nullable(); // cloud_api | coexistence | unknown
$table->string('status')->default('pending'); // pending | connected | error | disconnected
$table->string('webhook_status')->nullable();
$table->text('last_error')->nullable();
$table->json('metadata')->nullable();
$table->timestamp('connected_at')->nullable();
$table->timestamp('disconnected_at')->nullable();
$table->timestamps();

$table->unique(['user_id', 'status'], 'whatsapp_connections_user_status_unique');
```

Observacoes:

- use `Crypt::encryptString()` ou cast criptografado do Laravel para `access_token`
- troque a unique acima por uma estrategia melhor se quiser historico de multiplas conexoes por usuario
- indexe `phone_number_id` porque ele sera a chave principal do webhook multi-tenant

## Model sugerido

`App\Models\WhatsAppConnection`

Campos principais:

- `user_id`
- `business_account_id`
- `phone_number_id`
- `phone_number`
- `display_name`
- `access_token`
- `token_expires_at`
- `app_id`
- `configuration_id`
- `connection_type`
- `status`
- `webhook_status`
- `last_error`
- `metadata`
- `connected_at`
- `disconnected_at`

Recomendacoes:

- cast `metadata` como `array`
- cast datas como `datetime`
- criptografe `access_token`
- nunca serialize o token cru no resource

## Endpoints esperados pelo frontend

### `GET /api/profile/whatsapp`

Resposta esperada:

```json
{
  "data": {
    "id": "1",
    "userId": "3",
    "businessAccountId": "123456789",
    "phoneNumberId": "987654321",
    "phoneNumber": "5511999999999",
    "displayName": "Minha Empresa",
    "status": "connected",
    "connectionType": "coexistence",
    "webhookStatus": "active",
    "health": "active",
    "lastError": null,
    "lastErrorCode": null,
    "metadata": {
      "meta": {
        "waba_account_type": "business_app"
      }
    },
    "coexistenceEligibility": {
      "eligible": true,
      "code": null,
      "reason": null,
      "details": null
    },
    "connectedAt": "2026-04-24T12:00:00Z",
    "disconnectedAt": null,
    "tokenExpiresAt": null,
    "createdAt": "2026-04-24T12:00:00Z",
    "updatedAt": "2026-04-24T12:05:00Z"
  }
}
```

Quando o usuario nao tiver conexao:

```json
{
  "data": null
}
```

### `POST /api/profile/whatsapp/embedded-signup/start`

Resposta publica esperada:

```json
{
  "data": {
    "appId": "123456789",
    "configurationId": "987654321",
    "graphVersion": "v22.0",
    "redirectUri": "https://seu-backend.test/meta/embedded-signup/callback",
    "feature": "whatsapp_embedded_signup",
    "sessionInfoVersion": 3,
    "state": "signed-state-from-backend",
    "extras": {
      "feature": "whatsapp_embedded_signup",
      "sessionInfoVersion": 3
    }
  }
}
```

### `POST /api/profile/whatsapp/embedded-signup/complete`

Payload enviado pelo frontend:

```json
{
  "code": "meta-authorization-code",
  "state": "signed-state-from-backend",
  "authResponse": {
    "code": "meta-authorization-code"
  },
  "extras": {
    "feature": "whatsapp_embedded_signup",
    "sessionInfoVersion": 3
  }
}
```

Responsabilidades backend:

- validar `state`
- trocar `code` por token quando necessario
- descobrir os ativos do WhatsApp conectados
- salvar `business_account_id`, `phone_number_id`, `phone_number`
- identificar se a conexao foi `cloud_api`, `coexistence` ou `unknown`
- retornar a conexao salva sem expor token cru

### `POST /api/profile/whatsapp/test`

Resposta esperada:

```json
{
  "data": {
    "status": "ok",
    "message": "Conexao validada com sucesso.",
    "checkedAt": "2026-04-24T12:06:00Z",
    "metadata": {
      "phoneNumberId": "987654321"
    }
  }
}
```

### `POST /api/profile/whatsapp/sync-templates`

Resposta esperada:

```json
{
  "data": {
    "status": "ok",
    "message": "12 templates sincronizados para esta conexao.",
    "checkedAt": "2026-04-24T12:07:00Z",
    "metadata": {
      "synced": 12
    }
  }
}
```

### `DELETE /api/profile/whatsapp`

Resposta esperada:

```json
{
  "data": {
    "message": "Conexao removida do usuario."
  }
}
```

Nao execute a remocao destrutiva da conta na Meta sem confirmacao adicional fora deste endpoint.

## Webhook multi-tenant

O webhook atual precisa passar a resolver a conexao pelo `phone_number_id` recebido no payload da Meta.

Fluxo sugerido:

1. Extrair `phone_number_id` do evento.
2. Procurar `whatsapp_connections.phone_number_id = payload_phone_number_id`.
3. Se encontrar:
   - use `user_id` da conexao
   - salve conversa, contato e mensagem dentro do tenant correto
4. Se nao encontrar:
   - usar a integracao global atual como fallback
   - registrar evento de auditoria para a transicao

Compatibilidade incremental:

- mantenha a integracao global funcionando
- adicione primeiro a resolucao por `phone_number_id`
- so depois migre os fluxos e templates por usuario

## Coexistence

Regras para backend/resource:

- nunca assuma elegibilidade automatica
- se a Meta informar erro de elegibilidade, retorne `status = error`
- preencha:
  - `connectionType = coexistence` quando for claro
  - `connectionType = unknown` quando nao houver campo conclusivo
  - `coexistenceEligibility.eligible = false`
  - `coexistenceEligibility.code`
  - `coexistenceEligibility.reason`
  - `metadata.details`

Texto recomendado para UX:

- `Seu numero pode continuar no WhatsApp Business App se for elegivel.`
- `A disponibilidade depende das regras da Meta.`
- `Se nao for elegivel, sera necessario usar outro numero ou outro modo de conexao.`

## Seguranca

- nunca retorne `access_token` no frontend
- mascarar ou omitir erros sensiveis
- nao logar token completo
- proteger todos os endpoints com auth
- validar ownership da conexao pelo usuario autenticado
- preparar reconexao/rotacao de token

## Como testar localmente

1. Preencha `.env` do frontend com:
   - `VITE_API_BASE_URL`
   - `VITE_META_APP_ID`
   - `VITE_META_EMBEDDED_SIGNUP_CONFIGURATION_ID`
   - `VITE_META_GRAPH_VERSION`
2. Suba o frontend com `npm run dev`.
3. Implemente os endpoints Laravel acima.
4. Configure a Meta Embedded Signup com App ID e Configuration ID reais.
5. Faça login no painel e abra `Perfil`.
6. Clique em `Conectar WhatsApp`.
7. Complete o Embedded Signup.
8. Verifique se a API retorna o status salvo em `GET /api/profile/whatsapp`.

## Dependencias reais de producao

- App da Meta com permissoes e modo adequados
- Embedded Signup configurado com `Configuration ID`
- Redirect URI valida
- App review/permissoes necessarias
- Webhook funcionando e verificando `phone_number_id`
- armazenamento criptografado de token
- rotina de teste e sincronizacao por usuario
