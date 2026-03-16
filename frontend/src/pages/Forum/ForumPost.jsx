import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, Tag, List, Input, message, Spin, Divider, Modal, Form } from 'antd';
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  LikeOutlined, 
  MessageOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { forumAPI, uploadAPI } from '../../services/api';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

const { TextArea } = Input;

const ForumPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editor, setEditor] = useState(null);
  const [editHtml, setEditHtml] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');
  const currentUser = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const canEdit = currentUser && post && (currentUser.id === post.authorId || currentUser.role === 'admin');

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await forumAPI.getPost(id);
      setPost(response.data);
    } catch (error) {
      message.error('获取帖子详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      return;
    }
    try {
      await forumAPI.likePost(id);
      message.success('点赞成功');
      fetchPost();
    } catch (error) {
      message.error('点赞失败');
    }
  };

  const handleComment = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      return;
    }
    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      await forumAPI.addComment(id, { content: commentContent });
      message.success('评论发布成功');
      setCommentContent('');
      fetchPost();
    } catch (error) {
      message.error('评论发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = () => {
    editForm.setFieldsValue({
      title: post.title,
      tags: post.tags ? post.tags.join(', ') : '',
    });
    setEditHtml(post.content);
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!editor || editor.isEmpty()) {
      message.warning('请输入帖子内容');
      return;
    }

    setEditLoading(true);
    try {
      const postData = {
        title: values.title,
        content: editHtml,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      };

      await forumAPI.updatePost(id, postData);
      message.success('帖子更新成功');
      setIsEditModalVisible(false);
      fetchPost();
    } catch (error) {
      message.error('更新失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setEditLoading(false);
    }
  };

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

  const toolbarConfig = {};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">帖子不存在</p>
        <Button onClick={() => navigate('/forum')} className="mt-4">
          返回论坛
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/forum')}>
          返回
        </Button>
        <h1 className="text-2xl font-bold">帖子详情</h1>
        {canEdit && (
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={handleEditClick}
            className="ml-auto"
          >
            编辑
          </Button>
        )}
      </div>

      {/* 帖子内容 */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <Avatar 
            icon={<UserOutlined />} 
            src={post.User?.avatar}
            className="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-lg">{post.User?.username || '匿名用户'}</span>
              <span className="text-gray-400 text-sm">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-4">{post.title}</h2>
            <div 
              className="text-gray-700 mb-4 forum-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 text-gray-500">
              <span className="flex items-center gap-1">
                <EyeOutlined /> {post.views || 0}
              </span>
              <Button 
                type="link" 
                icon={<LikeOutlined />}
                onClick={handleLike}
                className="flex items-center gap-1"
              >
                {post.likes || 0}
              </Button>
              <span className="flex items-center gap-1">
                <MessageOutlined /> {post.Comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 评论区 */}
      <Card>
        <Divider orientation="left">
          <MessageOutlined /> 评论 ({post.Comments?.length || 0})
        </Divider>

        {/* 评论输入 */}
        {isLoggedIn ? (
          <div className="mb-6">
            <TextArea
              rows={3}
              placeholder="发表你的评论..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="mb-3"
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleComment}
              loading={submitting}
            >
              发表评论
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center mb-6">
            <p className="text-gray-500 mb-2">登录后才能发表评论</p>
            <Button type="primary" onClick={() => navigate('/login')}>
              去登录
            </Button>
          </div>
        )}

        {/* 评论列表 */}
        <List
          itemLayout="horizontal"
          dataSource={post.Comments || []}
          renderItem={(comment) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<UserOutlined />}
                    src={comment.User?.avatar}
                    className="bg-gradient-to-br from-blue-500 to-indigo-600"
                  />
                }
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.User?.username || '匿名用户'}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                }
                description={
                  <div className="text-gray-700 mt-1">
                    {comment.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 编辑帖子弹窗 */}
      <Modal
        title="编辑帖子"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={editForm} onFinish={handleEditSubmit} layout="vertical">
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
                value={editHtml}
                onCreated={setEditor}
                onChange={editor => setEditHtml(editor.getHtml())}
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
              loading={editLoading}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ForumPost;
