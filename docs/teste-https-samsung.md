# HTTPS local para testar o Cadencia no Samsung

Este fluxo cria um certificado local para a sua rede, serve o app em HTTPS e libera a instalacao como PWA real no Android.

## 1. Descubra o IP do notebook

No Windows, na pasta do projeto, rode:

```powershell
ipconfig
```

Anote o `IPv4` da rede Wi-Fi. Exemplo: `192.168.1.186`.

## 2. Gere os certificados locais

Na raiz do projeto, rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\https\generate-local-certs.ps1 -IpAddress 192.168.1.186
```

Arquivos gerados:

- `.local/https/cadencia-local-ca.cer`
- `.local/https/cadencia-local-server.crt`
- `.local/https/cadencia-local-server.key.pem`

## 3. Inicie o servidor HTTPS

Ainda na raiz do projeto, rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\https\serve-local-https.ps1 -Port 8443
```

O app ficara acessivel em:

- `https://localhost:8443` no notebook
- `https://SEU-IP:8443` no celular

Se o Windows mostrar alerta de firewall na primeira execucao, libere a porta para rede privada.

## 4. Instale o certificado CA no Samsung

Copie o arquivo `.local/https/cadencia-local-ca.cer` para o celular. Pode ser por WhatsApp, Google Drive, cabo USB ou e-mail.

Depois, no Samsung:

1. Abra `Configuracoes`.
2. Entre em `Seguranca e privacidade`.
3. Procure `Outras configuracoes de seguranca`.
4. Entre em `Instalar um certificado`.
5. Escolha `Certificado CA`.
6. Selecione `cadencia-local-ca.cer`.
7. Confirme a instalacao.

Observacoes:

- O Android pode exigir PIN, senha ou padrao de bloqueio antes de instalar o certificado.
- O nome exato dos menus pode variar um pouco entre versoes da One UI.

## 5. Abra o app em HTTPS no Samsung

No navegador do celular, abra:

```text
https://192.168.1.186:8443
```

Substitua pelo IP do seu notebook.

Se o certificado estiver confiavel, o navegador deve abrir sem alerta de seguranca.

## 6. Instale como app

No Chrome ou Samsung Internet:

1. Abra o menu do navegador.
2. Toque em `Instalar app` ou `Adicionar a tela inicial`.
3. Abra o app pelo novo icone.

Quando estiver instalado como PWA real, ele tende a abrir sem a barra de URL.

## Solucao de problemas

### O navegador mostra alerta de certificado

O certificado CA ainda nao foi instalado ou nao foi aceito pelo navegador. Reinstale `cadencia-local-ca.cer` no Samsung e abra o link HTTPS de novo.

### O celular nao encontra o notebook

Verifique:

- notebook e celular na mesma rede Wi-Fi
- servidor HTTPS ainda rodando no notebook
- porta `8443` nao bloqueada pelo firewall

### Continua abrindo como atalho com barra de URL

Verifique:

- voce abriu `https://...`, nao `http://...`
- o navegador nao mostrou alerta de seguranca
- o app foi instalado a partir do menu do navegador depois de abrir em HTTPS
