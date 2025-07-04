const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

let posts = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/post', (req, res) => {
  const { text } = req.body;
  const date = new Date().toISOString();
  posts.push({text, date});
  res.sendStatus(201);
});

app.get('/posts', (req, res) => {
  res.json(posts);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 