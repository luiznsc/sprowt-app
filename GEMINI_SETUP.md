# Configuração da Integração com Gemini AI

Este documento explica como configurar a integração com o Google Gemini AI no projeto Sprowt.

## 1. Obter a Chave da API do Gemini

1. Acesse o [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key" ou "Obter chave da API"
4. Crie uma nova chave da API
5. Copie a chave gerada

## 2. Configurar no Supabase

### Via Dashboard do Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Edge Functions**
4. Na seção **Environment Variables**, adicione:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Sua chave da API do Gemini (cole aqui)
5. Clique em **Save**

### Via CLI do Supabase:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

## 3. Deploy da Edge Function

Após configurar a variável de ambiente, faça o deploy da função:

```bash
supabase functions deploy gemini-ai
```

## 4. Verificar a Configuração

1. Acesse o assistente IA no frontend
2. Tente fazer uma pergunta ou gerar um relatório
3. Verifique os logs da Edge Function no Supabase Dashboard

## 5. Modelos Disponíveis

O projeto está configurado para usar o **Gemini 2.5 Flash**, que é:
- Mais rápido que o Gemini Pro
- Mais econômico
- Adequado para a maioria das tarefas de texto
- Suporta até 1M tokens de contexto

## 6. Troubleshooting

### Erro: "Serviço de IA não configurado"
- Verifique se a variável `GEMINI_API_KEY` está configurada no Supabase
- Certifique-se de que a chave está correta

### Erro: "Erro de autenticação"
- Verifique se o usuário está logado no frontend
- Confirme se o token JWT está sendo enviado corretamente

### Erro: "Erro do serviço de IA"
- Verifique se a chave da API do Gemini é válida
- Confirme se há créditos disponíveis na conta do Google AI
- Verifique os logs da Edge Function para mais detalhes

## 7. Limites e Custos

- **Rate Limits**: 15 requisições por minuto (padrão do Gemini)
- **Custos**: Gratuito até 1M tokens por mês
- **Modelo**: Gemini 2.5 Flash (mais econômico)

## 8. Monitoramento

Para monitorar o uso da API:
1. Acesse o [Google AI Studio](https://aistudio.google.com/)
2. Vá em **Usage** para ver estatísticas de uso
3. Monitore os logs da Edge Function no Supabase

## 9. Segurança

- A chave da API do Gemini é armazenada de forma segura no Supabase
- Não é exposta no frontend
- Todas as requisições passam por autenticação JWT
- CORS está configurado adequadamente
