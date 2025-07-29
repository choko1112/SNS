require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// --- ★★★ 修正点 ★★★ ---
// express.json() と express.urlencoded() を express.static() の前に置くのが一般的です。
// また、JSON形式のリクエストボディを正しく解析するために express.json() が必要です。
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
// -------------------------

app.use(express.static(path.join(__dirname, 'public')));

// --- ルートとHTML配信 ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// --- APIエンドポイント ---

// [新規] 全てのスレッド一覧を取得するAPI
app.get('/threads', async (req, res) => {
  try {
    const threads = await prisma.thread.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(threads);
  } catch (error) {
    console.error('スレッド一覧取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// --- ★★★ 修正が必要な可能性のあるAPI ★★★ ---
// [新規] 特定のスレッドとその投稿を取得するAPI
// このAPIが 404 を返している原因を調査します。
app.get('/threads/:id', async (req, res) => {
  try {
    const threadId = parseInt(req.params.id, 10); // 第2引数に基数を指定するのが安全
    if (isNaN(threadId)) { // IDが数値でない場合はエラー
        return res.status(400).json({ error: '無効なスレッドIDです。' });
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        posts: {
          include: {
            replies: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }
    res.json(thread);
  } catch (error) {
    console.error('スレッド取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});
// ---------------------------------------------


// [新規] 新しいスレッドを作成するAPI
app.post('/threads', async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'タイトルとカテゴリは必須です' });
    }
    const newThread = await prisma.thread.create({
      data: { title, category }
    });
    res.status(201).json(newThread);
  } catch (error) {
    console.error('スレッド作成エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// [変更] 投稿を作成するAPI (画像対応)
app.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const { text, threadId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!text || !threadId) {
        return res.status(400).json({ error: 'テキストとスレッドIDは必須です' });
    }
    
    await prisma.post.create({
      data: {
        text: text,
        imageUrl: imageUrl,
        threadId: parseInt(threadId, 10)
      },
    });
    res.sendStatus(201);
  } catch (error) {
    console.error('投稿エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// [変更なし] 返信を追加するAPI
app.post('/reply', async (req, res) => {
  try {
    const { postId, text } = req.body;
    await prisma.reply.create({
      data: {
        text: text,
        postId: parseInt(postId, 10),
      },
    });
    res.sendStatus(201);
  } catch (error) {
    console.error('返信エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});