const { log } = require('console');
var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const redirect_uri = your_redirect_uri;
const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const client_id = your_client_id; 
const client_secret = your_client_secret;


// Route to start the Sign in with Slack process
router.get('/', function(req, res, next) {
  // クエリパラメータを構築
  const queryParams = querystring.stringify({
    response_type: 'code',
    scope: 'openid profile email',
    client_id: client_id,
    state: 'af0ifjsldkj', // Should be a unique value for each request
    team: 'T02EF0P2C"',
    nonce: 'abcd', // Should be a sufficiently random value
    redirect_uri: redirect_uri
  });

  // Construct the authorization URL
  const slackAuthUrl = `https://slack.com/openid/connect/authorize?${queryParams}`;

  // Redirect the user to Slack's authorization page
  res.redirect(slackAuthUrl);
});


router.get('/callback', async (req, res) => {

  // 認可コードをクエリパラメータから取得
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('認可コードがありません');
  }


  try {
    // 認可コードをIDトークンに交換
    const tokenResponse = await axios.post('https://slack.com/api/openid.connect.token', querystring.stringify({
      client_id: client_id,
      client_secret: client_secret,
      code: code,
      redirect_uri: redirect_uri
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // jwks client を作成
    const client = jwksClient({
      jwksUri: 'https://slack.com/openid/connect/keys'
    });

    // ID token を取得
    const idToken = tokenResponse.data.id_token;
    console.log('IDトークン:', idToken);

    // ID token の検証
    function getKey(header, callback){
      client.getSigningKey(header.kid, function(err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        console.log(signingKey);
        callback(null, signingKey);
      });
    }

    // ↓ は、well-known endpoint から確認できる,これは署名の検証ではなく、クレームの検証
    const verifyOptions = {
      audience: client_id,
      issuer: 'https://slack.com',
      algorithms: ['RS256']
    }

    // ID token のデコード
    const decoded = jwt.decode(idToken);
    console.log('デコードされたIDトークン:', decoded);

    // ID token の検証
    jwt.verify(idToken, getKey, verifyOptions, function(err, decoded){
      if (err) {
        console.log('ID token の検証に失敗しました:', err);
      } else {
        console.log('ID token の検証に成功しました:', decoded);
      }
    });

    // 必要に応じてさらにユーザー情報を取得するなどの処理を行います

    // 処理完了後、適切なレスポンスをユーザーに返します
    res.redirect('/index');
  } catch (error) {
    console.log('アクセストークンの取得中にエラーが発生しました:', error);
    res.status(500).send('内部サーバーエラー');
  }
});


// TODO: セッションIDを検証して、ユーザーが認証されているかどうかを確認するエンドポイントが必要
// ユーザーIDとセッションIDが紐づいていればいい、redis とかに保存しておくとか、セッションIDは頻繁にクエリがかかるので、でかいサービスとかだとRDSだと厳しいかも
router.get('/is-authenticated', function(req, res, next) {
  // セッションIDを検証して、ユーザーが認証されているかどうかを確認する処理を実装します
  // 例えば、セッションIDをデータベースに保存しておき、
  // リクエストに含まれるセッションIDとデータベースのセッションIDを比較するなどです
  const isAuthenticated = true;

  // ユーザーが認証されている場合は 200 OK を、
  // 認証されていない場合は 401 Unauthorized を返します
  if (isAuthenticated) {
    res.status(200).send('認証されています');
  } else {
    res.status(401).send('認証されていません');
  }
})

router.get('/index', function(req, res, next) {
  // Collect request headers and body
  const requestHeaders = req.headers;
  const requestBody = req.body; // For GET requests, this will usually be empty

  // Render and pass the data to the EJS template
  res.render('index', { 
    title: 'Express',
    requestHeaders: requestHeaders,
    requestBody: requestBody,
  });
});




module.exports = router;
