
- node で簡単に request body を確認するためのアプリ
  - express を使用
  - slack OIDC 検証用

- local では npm start で起動
- `routes/index.js`のリダイレクトURI、クライアントID、クライアントシークレットは書き換えが必要

- azure webapp へデプロイしてチェック
- https://learn.microsoft.com/ja-jp/azure/app-service/quickstart-nodejs?tabs=linux&pivots=development-environment-cli
