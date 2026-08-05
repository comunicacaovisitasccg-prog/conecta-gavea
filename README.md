# Conecta Gávea

App web para marcação de visitas guiadas na obra da Estação Gávea (Linha 4 – Amarela).
Construído em React + Vite + Tailwind + Firebase (Auth e Firestore), no mesmo padrão visual
minimalista do Planejamento em Mãos (navy + verde-limão, sem ícones coloridos).

Esta primeira etapa entrega: **login (Google, e-mail, cadastro)**, **tela inicial** (carrossel +
próximas visitas) e **formulário de inscrição**. A sincronização automática com Google Sheets e
Google Drive fica para a próxima etapa — por enquanto os dados de visitas e fotos são cadastrados
direto no Firestore (veja o passo 4).

---

## 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e clique em **"Adicionar projeto"**.
2. Dê o nome `conecta-gavea` (ou o nome que preferir) e conclua a criação.
3. No menu lateral, vá em **Compilação > Authentication > Vamos começar**.
   - Ative o provedor **E-mail/senha**.
   - Ative o provedor **Google** (defina um e-mail de suporte).
4. Vá em **Compilação > Firestore Database > Criar banco de dados**.
   - Escolha o modo de produção e a região `southamerica-east1` (São Paulo).
5. Ainda no console, vá em **Configurações do projeto > Geral**, role até "Seus apps" e clique no
   ícone `</>` para criar um app da Web. Copie os valores de `firebaseConfig` — você vai usá-los
   no passo 3.

## 2. Preparar o projeto localmente

```bash
# entre na pasta do projeto
cd conecta-gavea

# instale as dependências
npm install
```

## 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com os dados do seu projeto Firebase (do passo 1.5):

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=conecta-gavea.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=conecta-gavea
VITE_FIREBASE_STORAGE_BUCKET=conecta-gavea.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
```

Rode localmente para testar:

```bash
npm run dev
```

## 4. Cadastrar os dados iniciais no Firestore

Por enquanto (antes da sincronização automática com o Google Sheets), crie manualmente duas
coleções pelo próprio console do Firestore:

### Coleção `visitas`
Um documento por data de visita. Use como ID do documento a própria data (ex: `2026-09-19`).

| Campo | Tipo | Exemplo |
|---|---|---|
| `data` | string (AAAA-MM-DD) | `2026-09-19` |
| `capacidadePorHorario` | número | `22` |
| `vagas08Ocupadas` | número | `0` |
| `vagas10Ocupadas` | número | `0` |

> Cada visita tem 22 vagas abertas ao público por horário (08h30 e 10h00), 44 no total.
> O app preenche primeiro o horário das 08h30; quando ele lota, as próximas inscrições vão
> automaticamente para o das 10h00 — o usuário não escolhe o horário.
>
> As 3 vagas extras por horário (as que aparecem como linhas 23–25 na sua planilha, reservadas
> para a Janaína incluir manualmente) **não** passam pelo app — ela pode continuar lançando essas
> inscrições direto no Firestore ou na planilha de controle interno, sem contar para o limite de
> 22 que trava as inscrições públicas.

### Coleção `carrossel`
Um documento por foto que deve aparecer no carrossel da tela inicial.

| Campo | Tipo | Exemplo |
|---|---|---|
| `url` | string | link direto da imagem |
| `ordem` | número | `1`, `2`, `3`... |
| `legenda` | string (opcional) | `Frente Jardim Oceânico` |

> As fotos da pasta do Drive precisam de um link direto de imagem (não o link de visualização do
> Drive) para funcionar aqui. Na próxima etapa dá para automatizar isso com um Google Apps Script
> que sincroniza a pasta do Drive direto para essa coleção — igual ao que já existe no Planejamento
> em Mãos para as fotos das frentes.

## 5. Publicar as regras de segurança do Firestore

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # selecione o projeto conecta-gavea, aceite usar o firestore.rules existente
firebase deploy --only firestore:rules
```

## 6. Subir para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão: login, tela inicial e inscrição"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/conecta-gavea.git
git push -u origin main
```

## 7. Publicar no Firebase Hosting

```bash
npm run build
firebase init hosting     # pasta pública: dist · SPA: sim
firebase deploy --only hosting
```

---

## Próximas etapas (ainda não implementadas)

- Sincronização automática da planilha Google Sheets com a coleção `visitas` (via Google Apps
  Script), no mesmo padrão do Planejamento em Mãos.
- Sincronização automática da pasta do Drive com a coleção `carrossel`.
- Painel para a equipe de comunicação ver/exportar a lista de inscritos por visita.
- Confirmação por e-mail ou WhatsApp para quem se inscreveu.

Me avise quando quiser seguir para essas partes.
