import React, { useState, useEffect, shallowEqual } from 'react';
import { Card, List, Button, Modal, Form, Input, message, Tag, Avatar, Spin } from 'antd';
import { MessageOutlined, UserOutlined, LikeOutlined, CommentOutlined } from '@ant-design/icons';
import { forumAPI, uploadAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

const Forum = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  // 富文本编辑器状态
  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState('');

  // 编辑器配置
  const toolbarConfig = {};
  const editorConfig = {
    placeholder: '请输入内容...',
    MENU_CONF: {
          uploadImage: {
            async customUpload(file, insertFn) {
              const formData = new FormData();
              formData.append('file', file);
              try {
                const response = await uploadAPI.uploadImage(formData);
                const url = response.data.url;
                insertFn(url, response.data.alt || '', url);
              } catch (error) {
                message.error('图片上传失败');
              }
            },
          },
        },
  };

  // 及时销毁编辑器
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await forumAPI.getPosts();
      setPosts(response.data.posts || response.data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      message.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!isLoggedIn) {
      message.warning('Please login first');
      navigate('/login');
      return;
    }

    if (editor.isEmpty()) {
      message.warning('请输入帖子内容');
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        title: values.title,
        content: html,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      };
      
      const response = await forumAPI.createPost(postData);
      message.success('帖子发布成功！');
      
      if (response.data.post) {
        setPosts([response.data.post, ...posts]);
      } else {
        fetchPosts();
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setHtml('');
    } catch (error) {
      console.error('Failed to create post:', error);
      message.error('发布失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await forumAPI.likePost(postId);
      message.success('点赞成功');
      // 更新本地状态
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: response.data.likes } : p));
    } catch (error) {
      message.error(error.response?.data?.message || '点赞失败');
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/forum/post/${postId}`);
  };

  // 辅助函数：去除HTML标签并截断文本
  const getPlainText = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Security Forum</h1>
        <Button type="primary" onClick={() => {
          if (!isLoggedIn) {
            message.warning('Please login first');
            navigate('/login');
            return;
          }
          setIsModalVisible(true);
        }}>
          Create Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No posts yet. Be the first to create one!</p>
          <Button type="primary" onClick={() => {
            if (!isLoggedIn) {
              message.warning('Please login first');
              navigate('/login');
              return;
            }
            setIsModalVisible(true);
          }}>
            Create First Post
          </Button>
        </div>
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={posts}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className="w-full cursor-pointer"
                onClick={() => handlePostClick(item.id)}
                actions={[
                  <Button 
                    key="likes" 
                    type="link" 
                    icon={<LikeOutlined />} 
                    onClick={(e) => handleLike(e, item.id)}
                  >
                    {item.likes || 0}
                  </Button>,
                  <span key="comments" className="flex items-center gap-1 px-4">
                    <CommentOutlined /> {item.Comments?.length || 0}
                  </span>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />} 
                      src={item.User?.avatar}
                      className="bg-gradient-to-br from-blue-500 to-indigo-600"
                    />
                  }
                  title={item.title}
                  description={
                    <div>
                      <div className="mb-2">
                        <span className="text-gray-500">{item.User?.username || 'Anonymous'}</span>
                        <span className="text-gray-400 ml-4">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 line-clamp-3">
                        {getPlainText(item.content)}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div>
                          {item.tags.map((tag, index) => (
                            <Tag key={index} color="blue">{tag}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="发布新帖子"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入帖子标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            required
          >
            <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #ccc' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={html}
                onCreated={setEditor}
                onChange={editor => setHtml(editor.getHtml())}
                mode="default"
                style={{ height: '400px', overflowY: 'hidden' }}
              />
            </div>
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Input placeholder="输入标签，用逗号分隔" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full"
              loading={submitting}
            >
              发布
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Forum;
