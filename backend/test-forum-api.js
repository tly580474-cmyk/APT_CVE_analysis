const http = require('http');

const BASE = 'http://localhost:3001/api';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const options = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0, failed = 0;
function assert(name, condition, detail) {
  if (condition) { passed++; console.log('  PASS: ' + name); }
  else { failed++; console.log('  FAIL: ' + name + (detail ? ' - ' + detail : '')); }
}

async function run() {
  console.log('===== Forum API Integration Tests =====\n');

  // 1. Admin Login
  console.log('[1] Admin Login');
  const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  assert('Admin login 200', loginRes.status === 200, 'got ' + loginRes.status);
  const adminToken = loginRes.body.token;
  assert('Admin token received', !!adminToken);
  assert('Admin role=admin', loginRes.body.user && loginRes.body.user.role === 'admin');

  // 2. User Login
  console.log('\n[2] User Login');
  const userLogin = await request('POST', '/auth/login', { username: 'security_analyst', password: 'password123' });
  assert('User login 200', userLogin.status === 200);
  const userToken = userLogin.body.token;

  // 3. Get posts
  console.log('\n[3] Get Posts List');
  const postsRes = await request('GET', '/forum/posts?page=1&limit=10');
  assert('Get posts 200', postsRes.status === 200);
  assert('Posts returned', postsRes.body.total > 0, 'total=' + postsRes.body.total);
  assert('10 posts per page', postsRes.body.posts && postsRes.body.posts.length === 10);
  assert('Has pagination', postsRes.body.totalPages >= 10);

  // 4. Get single post
  console.log('\n[4] Get Single Post');
  const firstPostId = postsRes.body.posts[0].id;
  const postDetail = await request('GET', '/forum/posts/' + firstPostId);
  assert('Get post 200', postDetail.status === 200);
  assert('Post has title', !!postDetail.body.title);
  assert('Post has content', !!postDetail.body.content);
  assert('Post has author', !!postDetail.body.User);

  // 5. Create post
  console.log('\n[5] Create New Post');
  const newPost = await request('POST', '/forum/posts', {
    title: 'Test Post - ML APT Detection',
    content: 'Test content about ML-based APT detection.',
    tags: ['test', 'ML'],
  }, userToken);
  assert('Create post 201', newPost.status === 201, 'got ' + newPost.status);
  const newPostId = newPost.body.post && newPost.body.post.id;

  // 6. Create comment
  console.log('\n[6] Create Comment');
  const comment1 = await request('POST', '/forum/posts/' + firstPostId + '/comments', {
    content: 'Top-level comment for testing.',
  }, userToken);
  assert('Create comment 201', comment1.status === 201, 'got ' + comment1.status);
  const comment1Id = comment1.body.comment && comment1.body.comment.id;

  // 7. Create reply (nested)
  console.log('\n[7] Create Reply to Comment');
  const reply1 = await request('POST', '/forum/posts/' + firstPostId + '/comments', {
    content: 'Nested reply to the comment.',
    parentId: comment1Id,
  }, userToken);
  assert('Reply 201', reply1.status === 201);
  assert('Reply has parentId', reply1.body.comment && reply1.body.comment.parentId === comment1Id);

  // 8. Verify thread
  console.log('\n[8] Verify Comment Thread');
  const postWithComments = await request('GET', '/forum/posts/' + firstPostId);
  const comments = postWithComments.body.Comments || [];
  assert('Post has comments', comments.length > 0, 'count=' + comments.length);
  assert('Reply linked to parent', comments.some(c => c.parentId === comment1Id));

  // 9. Like
  console.log('\n[9] Like Post');
  const likeRes = await request('POST', '/forum/posts/' + newPostId + '/like', {}, userToken);
  assert('Like 200', likeRes.status === 200);

  // 10. Unlike (already liked)
  console.log('\n[10] Unlike (Already Liked)');
  const unlikeRes = await request('POST', '/forum/posts/' + newPostId + '/like', {}, userToken);
  assert('Unlike 400', unlikeRes.status === 400);

  // 11. Admin users
  console.log('\n[11] Admin - Get All Users');
  const usersRes = await request('GET', '/auth/users', null, adminToken);
  assert('Admin get users 200', usersRes.status === 200);
  assert('Has 11 users', usersRes.body.length === 11, 'got ' + usersRes.body.length);

  // 12. Update post
  console.log('\n[12] Update Post');
  const updateRes = await request('PUT', '/forum/posts/' + newPostId, {
    title: 'Updated - ML APT Detection v2',
  }, userToken);
  assert('Update post 200', updateRes.status === 200);

  // 13. Delete comment
  console.log('\n[13] Delete Comment');
  const delComment = await request('DELETE', '/forum/posts/' + firstPostId + '/comments/' + comment1Id, null, userToken);
  assert('Delete comment 200', delComment.status === 200);

  // 14. Delete post
  console.log('\n[14] Delete Post');
  const delPost = await request('DELETE', '/forum/posts/' + newPostId, null, userToken);
  assert('Delete post 200', delPost.status === 200);

  // 15. Verify deleted
  console.log('\n[15] Verify Post Deleted');
  const deletedPost = await request('GET', '/forum/posts/' + newPostId);
  assert('Deleted post 404', deletedPost.status === 404);

  // 16. Unauthorized
  console.log('\n[16] Unauthorized Access');
  const unauth = await request('GET', '/auth/me');
  assert('No token 401', unauth.status === 401);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' total');
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Test error:', e); process.exit(1); });
