import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Tag, message, Popconfirm, Modal, Select } from 'antd';
import { UserOutlined, FileTextOutlined, CommentOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { authAPI, forumAPI } from '../../services/api';

const { TabPane } = Tabs;
const { Option } = Select;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取帖子列表
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await forumAPI.getPosts();
      setPosts(response.data.posts || []);
    } catch (error) {
      message.error('获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取评论列表
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await forumAPI.getAllComments();
      setComments(response.data.comments || []);
    } catch (error) {
      message.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'posts') fetchPosts();
    if (activeTab === 'comments') fetchComments();
  }, [activeTab]);

  // 删除用户
  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      message.error('不能删除自己的账户');
      return;
    }
    try {
      await authAPI.deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除用户失败');
    }
  };

  // 修改用户角色
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    // 不允许修改自己的角色
    if (selectedUser.id === currentUser.id) {
      message.error('不能修改自己的角色');
      setRoleModalVisible(false);
      return;
    }
    
    try {
      await authAPI.updateUserRole(selectedUser.id, newRole);
      message.success('角色更新成功');
      setRoleModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('更新角色失败');
    }
  };

  // 删除帖子
  const handleDeletePost = async (id) => {
    try {
      await forumAPI.adminDeletePost(id);
      message.success('帖子删除成功');
      fetchPosts();
    } catch (error) {
      message.error('删除帖子失败');
    }
  };

  // 删除评论
  const handleDeleteComment = async (id) => {
    try {
      await forumAPI.adminDeleteComment(id);
      message.success('评论删除成功');
      fetchComments();
    } catch (error) {
      message.error('删除评论失败');
    }
  };

  // 用户表格列
  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isSelf = record.id === currentUser.id;
        return (
          <div className="flex gap-2">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              disabled={isSelf}
              onClick={() => {
                setSelectedUser(record);
                setNewRole(record.role);
                setRoleModalVisible(true);
              }}
            >
              修改角色
            </Button>
            <Popconfirm
              title="确定删除此用户？"
              description="此操作不可恢复"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
              disabled={isSelf}
            >
              <Button danger size="small" icon={<DeleteOutlined />} disabled={isSelf}>
                删除
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  // 帖子表格列
  const postColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '作者',
      dataIndex: 'User',
      key: 'author',
      render: (user) => user?.username || '未知',
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定删除此帖子？"
          description="此操作不可恢复"
          onConfirm={() => handleDeletePost(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 评论表格列
  const commentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content) => content?.substring(0, 50) + (content?.length > 50 ? '...' : ''),
    },
    {
      title: '作者',
      dataIndex: 'User',
      key: 'author',
      render: (user) => user?.username || '未知',
    },
    {
      title: '所属帖子',
      dataIndex: 'Post',
      key: 'post',
      render: (post) => post?.title || '未知',
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定删除此评论？"
          description="此操作不可恢复"
          onConfirm={() => handleDeleteComment(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理员后台</h1>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <UserOutlined />
                用户管理
              </span>
            }
            key="users"
          >
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                帖子管理
              </span>
            }
            key="posts"
          >
            <Table
              columns={postColumns}
              dataSource={posts}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CommentOutlined />
                评论管理
              </span>
            }
            key="comments"
          >
            <Table
              columns={commentColumns}
              dataSource={comments}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 修改角色弹窗 */}
      <Modal
        title="修改用户角色"
        open={roleModalVisible}
        onOk={handleUpdateRole}
        onCancel={() => setRoleModalVisible(false)}
      >
        <p>用户: {selectedUser?.username}</p>
        <p>当前角色: {selectedUser?.role === 'admin' ? '管理员' : '普通用户'}</p>
        <Select
          value={newRole}
          onChange={setNewRole}
          style={{ width: '100%', marginTop: 16 }}
        >
          <Option value="user">普通用户</Option>
          <Option value="admin">管理员</Option>
        </Select>
      </Modal>
    </div>
  );
};

export default Admin;
