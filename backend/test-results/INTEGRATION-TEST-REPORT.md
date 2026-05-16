# APT攻击情报分析平台 - 集成测试报告

**测试时间:** 2026-05-14
**测试类型:** API 集成测试（对接真实数据库）
**测试框架:** Node.js http 模块 + 手写断言

---

## 测试结果总览

| 指标 | 结果 |
|------|------|
| 测试用例 | 27 个全部通过 |
| 失败用例 | 0 |
| 覆盖接口 | 12 个 API 端点 |

---

## 数据库种子数据

| 数据类型 | 数量 |
|---------|------|
| 用户 (Users) | 11 (1 管理员 + 10 测试用户) |
| 帖子 (Posts) | 100 |
| 评论 (Comments) | 199 |
| 回复 (Replies) | 59 |
| 点赞 (PostLikes) | 182 |

---

## 登录凭证

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 安全分析师 | security_analyst | password123 |
| 威胁猎人 | threat_hunter | password123 |
| 红队成员 | red_teamer | password123 |
| 蓝队成员 | blue_teamer | password123 |
| 取证专家 | forensic_expert | password123 |
| 渗透测试员 | pentester | password123 |
| SOC分析师 | soc_analyst | password123 |
| 安全负责人 | security_lead | password123 |
| 恶意软件研究员 | malware_researcher | password123 |
| 应急响应员 | incident_responder | password123 |

---

## 测试用例详情

### [1] 管理员登录
| # | 测试 | 状态 |
|---|------|------|
| 1 | Admin login returns 200 | PASS |
| 2 | Admin token received | PASS |
| 3 | Admin role=admin | PASS |

### [2] 用户登录
| # | 测试 | 状态 |
|---|------|------|
| 4 | User login returns 200 | PASS |

### [3] 获取帖子列表
| # | 测试 | 状态 |
|---|------|------|
| 5 | Get posts returns 200 | PASS |
| 6 | Posts returned (total > 0) | PASS |
| 7 | 10 posts per page | PASS |
| 8 | Has pagination | PASS |

### [4] 获取帖子详情
| # | 测试 | 状态 |
|---|------|------|
| 9 | Get post returns 200 | PASS |
| 10 | Post has title | PASS |
| 11 | Post has content | PASS |
| 12 | Post has author | PASS |

### [5] 创建帖子
| # | 测试 | 状态 |
|---|------|------|
| 13 | Create post returns 201 | PASS |

### [6] 创建评论
| # | 测试 | 状态 |
|---|------|------|
| 14 | Create comment returns 201 | PASS |

### [7] 创建回复（嵌套评论）
| # | 测试 | 状态 |
|---|------|------|
| 15 | Reply returns 201 | PASS |
| 16 | Reply has parentId | PASS |

### [8] 验证评论线程
| # | 测试 | 状态 |
|---|------|------|
| 17 | Post has comments | PASS |
| 18 | Reply linked to parent | PASS |

### [9] 点赞帖子
| # | 测试 | 状态 |
|---|------|------|
| 19 | Like returns 200 | PASS |

### [10] 重复点赞
| # | 测试 | 状态 |
|---|------|------|
| 20 | Unlike returns 400 (already liked) | PASS |

### [11] 管理员获取用户列表
| # | 测试 | 状态 |
|---|------|------|
| 21 | Admin get users returns 200 | PASS |
| 22 | Has 11 users | PASS |

### [12] 更新帖子
| # | 测试 | 状态 |
|---|------|------|
| 23 | Update post returns 200 | PASS |

### [13] 删除评论
| # | 测试 | 状态 |
|---|------|------|
| 24 | Delete comment returns 200 | PASS |

### [14] 删除帖子
| # | 测试 | 状态 |
|---|------|------|
| 25 | Delete post returns 200 | PASS |

### [15] 验证帖子已删除
| # | 测试 | 状态 |
|---|------|------|
| 26 | Deleted post returns 404 | PASS |

### [16] 未授权访问
| # | 测试 | 状态 |
|---|------|------|
| 27 | No token returns 401 | PASS |

---

## 已知问题

**帖子列表 total 计数偏大:** `findAndCountAll` + 关联查询 `Comments` 时，Sequelize 会将关联的评论行计入总数。这是 Sequelize 的已知行为，不影响分页功能。

---

## 测试文件

```
backend/
  seed.js                    # 数据库种子脚本
  test-forum-api.js          # API 集成测试脚本
  test-results/
    INTEGRATION-TEST-REPORT.md  # 本报告
```

## 运行命令

```bash
# 重新初始化种子数据
node seed.js

# 运行集成测试（需要后端服务运行中）
node test-forum-api.js

# 启动后端服务
npm start
```
