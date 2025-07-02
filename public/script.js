window.onload = function() {
  fetch('/posts')
    .then(res => res.json())
    .then(posts => {
      const postsDiv = document.getElementById('posts');
      postsDiv.innerHTML = '';
      posts.forEach((post, i) => {
        const div = document.createElement('div');
        div.style.marginBottom = '20px';

        const postText = document.createElement('div');
        postText.textContent = `${i+1}: ${post}`;
        div.appendChild(postText);

        const today = new Date();
	      const dayofweek = ["日","月","火","水","木","金","土"];
        const dateStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日(${dayofweek[today.getDay()]})${today.getHours()}時${today.getMinutes()}分${today.getSeconds()}秒`;
        const dateDiv = document.createElement('div');
        dateDiv.textContent = dateStr;
        dateDiv.style.fontSize = '0.8em';
        div.appendChild(dateDiv);
        
        postsDiv.appendChild(div);
      });
    });
}; 