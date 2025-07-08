window.onload = function() {
  loadPosts();

  const form = document.getElementById('postForm');
  form.onsubmit = function(e) {
    e.preventDefault(); // ページリロードを防ぐ
    const text = document.getElementById('postText').value;
    fetch('/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(text)}`
    }).then(() => {
      document.getElementById('postText').value = '';
      loadPosts();
    });
  };
};

function loadPosts(){
  fetch('/posts')
    .then(res => res.json())
    .then(posts => {
      const postsDiv = document.getElementById('posts');
      postsDiv.innerHTML = '';
      posts.forEach((post, i) => {
        const div = document.createElement('div');
        div.style.marginBottom = '20px';

        // 投稿文
        const postText = document.createElement('div');
        postText.textContent = `${i+1}: ${post.text}`;
        div.appendChild(postText);

        // 日時
        const date = new Date(post.date);
        const dayofweek = ["日","月","火","水","木","金","土"];
        const dateStr = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日(${dayofweek[date.getDay()]})${date.getHours()}時${date.getMinutes()}分${date.getSeconds()}秒`;
        const dateDiv = document.createElement('div');
        dateDiv.textContent = dateStr;
        dateDiv.style.fontSize = '0.8em';
        div.appendChild(dateDiv);

        // 返信表示
        if (post.replies && post.replies.length > 0) {
          post.replies.forEach(reply => {
            const replyDiv = document.createElement('div');
            replyDiv.style.fontSize = '0.7em';
            replyDiv.style.marginLeft = '20px';
            replyDiv.style.color = '#555';
            replyDiv.textContent = `↳ ${reply.text} (${new Date(reply.date).getHours()}時${new Date(reply.date).getMinutes()}分${new Date(reply.date).getSeconds()}秒)`;
            div.appendChild(replyDiv);
          });
        }

        // 返信フォーム
        const replyForm = document.createElement('form');
        replyForm.style.marginLeft = '20px';

        // ここで先にinputを作成
        const replyInput = document.createElement('input');
        replyInput.type = 'text';
        replyInput.placeholder = '返信を書く';
        replyInput.required = true;
        replyInput.style.fontSize = '0.8em';
        replyForm.appendChild(replyInput);

        const replyBtn = document.createElement('button');
        replyBtn.type = 'submit';
        replyBtn.textContent = '返信';
        replyBtn.style.fontSize = '0.8em';
        replyForm.appendChild(replyBtn);

        // onsubmitはinput定義後に
        replyForm.onsubmit = function(e) {
          e.preventDefault();
          const replyText = replyInput.value;
          fetch('/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `postIndex=${i}&text=${encodeURIComponent(replyText)}`
          }).then(() => {
            loadPosts();
          });
          replyInput.value = '';
        };

        div.appendChild(replyForm);

        postsDiv.appendChild(div);
      });
    });
};

