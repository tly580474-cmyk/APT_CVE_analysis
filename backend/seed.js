const bcrypt = require('bcryptjs');
const { User, Post, Comment, PostLike, sequelize } = require('./src/models');

const aptTopics = [
  { title: 'APT组织利用Log4j漏洞发起攻击的最新分析', tags: ['Log4j','APT','漏洞利用'] },
  { title: '针对能源行业的APT攻击活动追踪', tags: ['能源行业','APT','威胁情报'] },
  { title: '新型后门程序Water Hydra分析报告', tags: ['后门','恶意软件','分析'] },
  { title: '供应链攻击：从SolarWinds到CODEC', tags: ['供应链','SolarWinds','攻击'] },
  { title: 'APT29最新TTPs变化趋势分析', tags: ['APT29','TTPs','趋势'] },
  { title: '利用DNS隧道进行数据外泄的检测方法', tags: ['DNS隧道','数据外泄','检测'] },
  { title: '勒索软件与APT的融合趋势', tags: ['勒索软件','APT','趋势'] },
  { title: '针对医疗机构的网络间谍活动分析', tags: ['医疗机构','间谍','威胁'] },
  { title: '零日漏洞在APT攻击中的应用', tags: ['零日漏洞','APT','攻击'] },
  { title: '云环境下的APT攻击技术研究', tags: ['云安全','APT','研究'] },
  { title: '工业控制系统面临的APT威胁', tags: ['ICS','工控安全','APT'] },
  { title: '移动端APT攻击技术发展趋势', tags: ['移动端','APT','趋势'] },
  { title: '利用合法工具进行攻击的技术分析', tags: ['红队','合法工具','攻击'] },
  { title: '基于AI的APT检测方法研究', tags: ['AI','检测','研究'] },
  { title: '金融行业APT攻击案例分析', tags: ['金融','案例','分析'] },
  { title: 'Windows内核漏洞在APT中的利用', tags: ['Windows','内核','漏洞'] },
  { title: '邮件安全与APT防御策略', tags: ['邮件安全','防御','策略'] },
  { title: '威胁情报在APT防御中的应用', tags: ['威胁情报','防御','应用'] },
  { title: '红蓝对抗演练中的APT模拟技术', tags: ['红蓝对抗','模拟','演练'] },
  { title: '物联网设备在APT攻击中的角色', tags: ['IoT','物联网','攻击'] },
];

const postContents = [
  '本文深入分析了该攻击技术的原理和防御方法。通过对多个样本的逆向分析，我们发现了攻击者使用的新技术手段。\n\n## 攻击流程\n\n1. 初始访问：通过钓鱼邮件投递恶意附件\n2. 横向移动：利用内网漏洞进行权限提升\n3. 数据窃取：建立隐蔽通道外传敏感数据\n\n## 防御建议\n\n- 部署邮件安全网关\n- 定期更新补丁\n- 加强网络监控',
  '在最近的安全事件中，我们观察到了一种新的攻击模式。攻击者利用合法的云服务作为C2通信渠道，使得传统的安全设备难以检测。\n\n### 关键发现\n\n- 攻击者使用了经过签名的合法工具\n- C2通信隐藏在正常的HTTPS流量中\n- 数据外泄通过云存储服务完成',
  '随着云计算的普及，越来越多的组织将业务迁移到云端。然而，云环境也带来了新的安全挑战。本文将探讨云环境下的常见安全风险和最佳防护实践。',
  '漏洞挖掘是安全研究的重要组成部分。本文分享了我们在漏洞挖掘过程中积累的经验和方法论。',
  '威胁情报是网络安全防御体系的重要组成部分。高质量的威胁情报可以帮助组织提前了解攻击者的TTPs。',
  '安全运营中心(SOC)是组织网络安全的核心。一个高效的SOC需要具备快速的威胁检测、分析和响应能力。',
  '应急响应是网络安全的最后一道防线。当安全事件发生时，快速有效的应急响应可以最大限度地减少损失。',
  '社会工程攻击是最常见的攻击手段之一。攻击者利用人性的弱点，通过欺骗、诱导等方式获取敏感信息。',
  '密码学是网络安全的基础。了解常见的密码学算法和协议，对于安全从业者来说至关重要。',
  '安全开发运维(SecDevOps)是将安全融入软件开发全流程的理念。',
];

const commentTexts = [
  '分析得很到位，感谢分享！',
  '请问这种攻击手法在实际环境中常见吗？',
  '我们公司最近也遇到了类似的情况，受益匪浅。',
  '文章中提到的防御措施非常实用。',
  '有没有更详细的分析报告可以参考？',
  '这个技术趋势值得关注。',
  '请问如何检测这类攻击？',
  '非常好的总结，收藏了。',
  '在实际项目中验证过，效果不错。',
  '建议补充一下相关的IOC信息。',
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ force: true });
    console.log('Tables synced');

    console.log('Creating admin...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin', email: 'admin@apt-analysis.com',
      password: adminHash, role: 'admin',
    });
    console.log('  Admin: admin / admin123');

    console.log('Creating test users...');
    const userHash = await bcrypt.hash('password123', 10);
    const userDefs = [
      'security_analyst','threat_hunter','red_teamer','blue_teamer',
      'forensic_expert','pentester','soc_analyst','security_lead',
      'malware_researcher','incident_responder',
    ];
    const testUsers = [];
    for (const u of userDefs) {
      const user = await User.create({
        username: u, email: u + '@apt.com',
        password: userHash, role: 'user',
      });
      testUsers.push(user);
      console.log('  User: ' + u);
    }
    const allUsers = [admin, ...testUsers];

    console.log('Creating 100 posts...');
    const posts = [];
    for (let i = 0; i < 100; i++) {
      const topic = aptTopics[i % aptTopics.length];
      const content = postContents[i % postContents.length];
      const author = allUsers[i % allUsers.length];
      const suffix = i >= aptTopics.length ? ' (Part ' + (Math.floor(i / aptTopics.length) + 1) + ')' : '';
      const post = await Post.create({
        title: topic.title + suffix,
        content: content,
        tags: topic.tags,
        authorId: author.id,
        likes: Math.floor(Math.random() * 50),
        views: Math.floor(Math.random() * 200) + 10,
      });
      posts.push(post);
    }
    console.log('  100 posts created');

    console.log('Adding comments and replies...');
    let totalComments = 0;
    let totalReplies = 0;
    for (const post of posts) {
      const cnt = Math.floor(Math.random() * 3) + 1;
      for (let c = 0; c < cnt; c++) {
        const commenter = allUsers[Math.floor(Math.random() * allUsers.length)];
        const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        const comment = await Comment.create({
          content: text, authorId: commenter.id, postId: post.id, parentId: null,
        });
        totalComments++;
        if (Math.random() < 0.3) {
          const replier = allUsers[Math.floor(Math.random() * allUsers.length)];
          await Comment.create({
            content: '[Reply] ' + commentTexts[Math.floor(Math.random() * commentTexts.length)],
            authorId: replier.id, postId: post.id, parentId: comment.id,
          });
          totalReplies++;
        }
      }
    }
    console.log('  Comments: ' + totalComments + ', Replies: ' + totalReplies);

    console.log('Adding likes...');
    let totalLikes = 0;
    for (const post of posts) {
      const likeCount = Math.floor(Math.random() * 5);
      const likers = new Set();
      for (let l = 0; l < likeCount; l++) {
        const userId = allUsers[Math.floor(Math.random() * allUsers.length)].id;
        if (!likers.has(userId)) {
          likers.add(userId);
          await PostLike.create({ userId: userId, postId: post.id });
          totalLikes++;
        }
      }
    }
    console.log('  Likes: ' + totalLikes);

    console.log('');
    console.log('===== SEED COMPLETE =====');
    console.log('Users:     ' + allUsers.length);
    console.log('Posts:     ' + posts.length);
    console.log('Comments:  ' + totalComments);
    console.log('Replies:   ' + totalReplies);
    console.log('Likes:     ' + totalLikes);
    console.log('Admin login: admin / admin123');
    console.log('User login:  security_analyst / password123');
    console.log('==========================');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
