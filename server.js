const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client'); // Prisma Clientをインポート

const app = express();
const prisma = new PrismaClient(); // Prisma Clientのインスタンスを作成
const PORT = 3000;

// let posts = []; // ← メモリ上の配列は不要になるので削除

app.use(express.urlencoded({ extended: true }));

// publicフォルダ内のファイルを静的ファイルとして提供
// script.jsを読み込むために必要です
app.use(express.static(path.join(__dirname, 'public'))); 

// ルートパスへのアクセスでindex.htmlを返す
// viewsフォルダ内にindex.htmlを置く想定
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// [変更] 投稿を作成するAPI
app.post('/post', async (req, res) => { // async/await を使用
  try {
    const { text } = req.body;
    // prisma.post.createで新しい投稿をデータベースに作成
    await prisma.post.create({
      data: {
        text: text, // schema.prismaで定義した 'text' カラムに保存
      },
    });
    res.sendStatus(201);
  } catch (error) {
    console.error('投稿エラー:', error);
    res.status(500).send('サーバーエラー');
  }
});

// [変更] 返信を追加するAPI
app.post('/reply', async (req, res) => { // async/await を使用
  try {
    // フロントから postIndex の代わりに postId を受け取る
    const { postId, text } = req.body;
    // prisma.reply.createで新しい返信をデータベースに作成
    await prisma.reply.create({
      data: {
        text: text,
        postId: parseInt(postId), // 文字列で送られてくるIDを数値に変換
      },
    });
    res.sendStatus(201);
  } catch (error) {
    console.error('返信エラー:', error);
    res.status(500).send('サーバーエラー');
  }
});

// [変更] すべての投稿を取得するAPI
app.get('/posts', async (req, res) => { // async/await を使用
  try {
    // prisma.post.findManyで全ての投稿を取得
    const postsFromDb = await prisma.post.findMany({
      include: {
        replies: true, // 関連する返信(replies)も一緒に取得
      },
      orderBy: {
        createdAt: 'asc', // 古い順にソート
      },
    });
    // フロントエンドが期待する形式にデータを整形して返す
    const formattedPosts = postsFromDb.map(post => ({
        id: post.id,
        text: post.text,
        date: post.createdAt, // createdAtをdateというキー名に合わせる
        replies: post.replies.map(reply => ({
            text: reply.text,
            date: reply.createdAt
        }))
    }));
    res.json(formattedPosts);
  } catch (error) {
    console.error('投稿取得エラー:', error);
    res.status(500).send('サーバーエラー');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});