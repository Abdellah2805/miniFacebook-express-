const API_URL = 'https://localhost:3000';
let token = '';

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        token = data.token;
        document.getElementById('auth-section').classList.add('d-none');
        document.getElementById('post-section').classList.remove('d-none');
        alert("Connecté !");
        loadPosts();

    } else {
        alert(data.message);
    }

}

async function loadPosts() {
    const response = await fetch(`${API_URL}/posts`);
    const posts = await response.json();
    const container = document.getElementBiId('posts-container');

    posts.forEach(post => {
        container.innerHTML += `
            <div class="card mb-3 p-3">
                <p>${post.content}</p>
                <small class="text-muted">Publié par l'ID: ${post.author}</small>
            </div>
        `;
});
}

loadPosts();



