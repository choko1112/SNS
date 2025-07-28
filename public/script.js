// グローバル変数として現在表示中のスレッドIDを保持
let currentThreadId = null;
const categoryMap = {
    LEISURE: "レジャー",
    FOOD: "食べ物、料理",
    ENTERTAINMENT: "アニメ、映画",
    OTHER: "その他"
};

// --- 初期化処理 ---
window.onload = function() {
    loadThreadList();
    setupEventListeners();
};

function setupEventListeners() {
    // スレッド作成フォーム
    const createThreadForm = document.getElementById('createThreadForm');
    createThreadForm.addEventListener('submit', handleCreateThread);

    // 投稿フォーム
    const postForm = document.getElementById('postForm');
    postForm.addEventListener('submit', handleCreatePost);
}


// --- スレッド関連の関数 ---

// 1. スレッド一覧をサーバーから取得して表示する
async function loadThreadList() {
    try {
        const res = await fetch('/threads');
        const threads = await res.json();
        
        // カテゴリごとにスレッドをグループ化
        const threadsByCategory = threads.reduce((acc, thread) => {
            if (!acc[thread.category]) {
                acc[thread.category] = [];
            }
            acc[thread.category].push(thread);
            return acc;
        }, {});

        const container = document.getElementById('thread-list-container');
        container.innerHTML = ''; // コンテナをクリア

        for (const category in threadsByCategory) {
            const categoryName = categoryMap[category] || 'その他';
            const categoryHeader = document.createElement('h3');
            categoryHeader.textContent = categoryName;
            container.appendChild(categoryHeader);

            const ul = document.createElement('ul');
            threadsByCategory[category].forEach(thread => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = thread.title;
                a.onclick = (e) => {
                    e.preventDefault();
                    loadThreadContent(thread.id);
                };
                li.appendChild(a);
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }
    } catch (error) {
        console.error('スレッド一覧の読み込みに失敗しました:', error);
    }
}

// 2. 特定のスレッドの内容を読み込む
async function loadThreadContent(threadId) {
    currentThreadId = threadId; // 現在のスレッドIDを更新
    try {
        const res = await fetch(`/threads/${threadId}`);
        if (!res.ok) throw new Error('スレッドの読み込みに失敗しました');
        
        const thread = await res.json();
        const container = document.getElementById('thread-content');
        container.innerHTML = ''; // コンテナをクリア

        // スレッドヘッダー
        const headerDiv = document.createElement('div');
        headerDiv.className = 'thread-header';
        headerDiv.innerHTML = `
            <span class="category">${categoryMap[thread.category]}</span>
            <h2>${thread.title}</h2>
        `;
        container.appendChild(headerDiv);

        // 投稿の表示
        if (thread.posts.length === 0) {
            container.innerHTML += '<p>まだ投稿がありません。</p>';
        } else {
            thread.posts.forEach(post => {
                const postElement = createPostElement(post);
                container.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error(error);
        document.getElementById('thread-content').innerHTML = '<p>エラーが発生しました。</p>';
    }
}

// 3. 新しいスレッドを作成する
async function handleCreateThread(e) {
    e.preventDefault();
    const title = document.getElementById('threadTitle').value;
    const category = document.getElementById('threadCategory').value;

    try {
        const res = await fetch('/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category })
        });
        if (!res.ok) throw new Error('スレッドの作成に失敗しました');
        
        document.getElementById('threadTitle').value = '';
        loadThreadList(); // スレッド一覧を再読み込み
        const newThread = await res.json();
        loadThreadContent(newThread.id); // 作成したスレッドをすぐに表示
    } catch (error) {
        console.error(error);
        alert('スレッドの作成に失敗しました。');
    }
}


// --- 投稿・返信関連の関数 ---

// 4. 新しい投稿を作成する (画像対応)
async function handleCreatePost(e) {
    e.preventDefault();
    if (!currentThreadId) {
        alert('投稿するスレッドを選択してください。');
        return;
    }

    const form = e.target;
    const formData = new FormData(form); // FormDataを使って画像とテキストを送信
    formData.append('text', document.getElementById('postText').value);
    formData.append('threadId', currentThreadId);

    try {
        await fetch('/posts', {
            method: 'POST',
            body: formData // headersは自動設定されるので不要
        });
        document.getElementById('postText').value = '';
        document.getElementById('postImage').value = '';
        loadThreadContent(currentThreadId); // 現在のスレッドを再読み込み
    } catch (error) {
        console.error('投稿エラー:', error);
        alert('投稿に失敗しました。');
    }
}

// 5. 返信を作成する
async function handleCreateReply(e, postId) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[type="text"]');
    const text = input.value;
    if (!text.trim()) return;

    try {
        await fetch('/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, text })
        });
        loadThreadContent(currentThreadId); // 現在のスレッドを再読み込み
    } catch (error) {
        console.error('返信エラー:', error);
    }
}

// 6. 投稿要素(HTML)を生成するヘルパー関数
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    const dateStr = new Date(post.createdAt).toLocaleString('ja-JP');

    // 画像があればimgタグを追加
    const imageTag = post.imageUrl ? `<img src="${post.imageUrl}" alt="投稿画像" class="post-image">` : '';

    div.innerHTML = `
        <div class="post-meta">投稿日時: ${dateStr}</div>
        <div class="post-text">${escapeHTML(post.text)}</div>
        ${imageTag}
    `;

    // 返信エリア
    const repliesDiv = document.createElement('div');
    repliesDiv.className = 'replies';
    if (post.replies && post.replies.length > 0) {
        post.replies.forEach(reply => {
            const replyEl = createReplyElement(reply);
            repliesDiv.appendChild(replyEl);
        });
    }
    div.appendChild(repliesDiv);

    // 返信フォーム
    const replyForm = document.createElement('form');
    replyForm.innerHTML = `
        <input type="text" placeholder="返信を書く" required>
        <button type="submit">返信</button>
    `;
    replyForm.onsubmit = (e) => handleCreateReply(e, post.id);
    div.appendChild(replyForm);

    return div;
}

// 7. 返信要素(HTML)を生成するヘルパー関数
function createReplyElement(reply) {
    const div = document.createElement('div');
    div.className = 'reply-card';
    const dateStr = new Date(reply.createdAt).toLocaleString('ja-JP');
    div.innerHTML = `
        <p>${escapeHTML(reply.text)}</p>
        <small>(${dateStr})</small>
    `;
    return div;
}

// 8. XSS対策のためのHTMLエスケープ関数
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}