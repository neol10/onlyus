# OnlyUs — Documentação do Projeto

## 1. Visão Geral

**OnlyUs** é um PWA responsivo privado para casal, funcionando como uma rede social pessoal com fotos, comentários, memórias, notificações e temas personalizáveis.

Objetivo: criar um espaço moderno, elegante e emocionalmente significativo para registrar momentos, interagir e receber lembretes importantes.

---

## 2. Stack

### Front-end

* React / Next.js
* TailwindCSS
* Framer Motion
* Firebase SDK

### Back-end

* Firebase Authentication
* Firestore
* Firebase Storage
* Firebase Cloud Messaging
* Cloud Functions
* Firebase Hosting

### App

* PWA

---

## 3. Funcionalidades

## 3.1 Autenticação

Login privado para dois usuários.

Campos:

* Email
* Senha

Permissões:

* Admin
* Usuário parceiro

---

## 3.2 Feed Principal

Posts estilo rede social.

Cada post:

* Fotos (carrossel)
* Legenda
* Data
* Local opcional
* Curtidas
* Comentários

---

## 3.3 Timeline

Linha cronológica de momentos especiais.

Campos:

* Título
* Descrição
* Data
* Fotos

---

## 3.4 Galeria

Álbuns separados.

Exemplos:

* Viagens
* Datas especiais
* Aleatórias

---

## 3.5 Mural

Mensagens privadas entre vocês.

---

## 3.6 Datas especiais

Eventos:

* Mesversário
* Aniversários
* Primeiro encontro
* Outras datas customizadas

---

## 3.7 Notificações Push

Exemplos:

* Amanhã vocês completam X meses
* Amanhã é aniversário dela
* Hoje faz 1 ano desse momento

---

## 3.8 Cápsula do tempo

Mensagens bloqueadas até uma data futura.

---

## 3.9 Memórias automáticas

Sistema mostra:

“Há 1 ano vocês viveram isso.”

---

## 3.10 Temas Dinâmicos

Temas:

* Midnight
* Blossom
* Noir
* Aurora
* Custom

Configurações:

* Cor principal
* Cor secundária
* Fundo
* Intensidade de animação

---

## 4. Estrutura do Firebase

## Collections

### users

```json
{
  "name": "",
  "email": "",
  "role": "admin"
}
```

### posts

```json
{
  "caption": "",
  "images": [],
  "createdAt": "",
  "authorId": ""
}
```

### events

```json
{
  "title": "",
  "date": "",
  "type": "anniversary"
}
```

### messages

### memories

### settings

---

## 5. Estrutura de Pastas

```txt
/src
 /components
 /pages
 /hooks
 /services
 /styles
 /utils
 /firebase
```

---

## 6. Telas

## Tela 1 — Login

## Tela 2 — Feed

## Tela 3 — Post detalhado

## Tela 4 — Timeline

## Tela 5 — Galeria

## Tela 6 — Calendário

## Tela 7 — Configurações

---

## 7. Roadmap de Desenvolvimento

## Fase 1

* Setup projeto
* Firebase
* Login

## Fase 2

* Feed
* Upload fotos
* Comentários

## Fase 3

* Timeline
* Galeria

## Fase 4

* Notificações push
* Cloud Functions

## Fase 5

* Temas dinâmicos
* Efeitos visuais

## Fase 6

* PWA final
* Deploy

---

## 8. Prompt base para Antigravity

Criar PWA responsivo privado para casal com visual premium, sistema de feed estilo rede social, timeline, galeria, notificações push, temas dinâmicos, Firebase, animações suaves, glassmorphism e foco em memórias compartilhadas.
