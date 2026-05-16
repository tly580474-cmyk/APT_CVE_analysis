import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Tabs } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import { authAPI, uploadAPI } from '../../services/api';

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getMe();
      const userData = response.data;
      setUser(userData);
      setAvatarUrl(userData.avatar);
      form.setFieldsValue({
        username: userData.username,
        email: userData.email || '',
      });
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadAPI.uploadImage(formData);
      const newAvatarUrl = response.data.url;
      setAvatarUrl(newAvatarUrl);

      await authAPI.updateProfile({ avatar: newAvatarUrl });

      const updatedUser = { ...user, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      message.success('头像上传成功');
    } catch (error) {
      message.error('头像上传失败');
    }

    return false;
  };

  const handleUpdateProfile = async (values) => {
    setSaving(true);
    try {
      const response = await authAPI.updateProfile({
        username: values.username,
        email: values.email,
        avatar: avatarUrl,
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (values) => {
    setSaving(true);
    try {
      await authAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: '1',
      label: '基本信息',
      children: (
        <Form form={form} onFinish={handleUpdateProfile} layout="vertical">
          <Form.Item label="头像">
            <Upload name="avatar" accept="image/*" showUploadList={false} beforeUpload={handleAvatarUpload}>
              <div className="cursor-pointer">
                {avatarUrl ? (
                  <Avatar size={80} src={avatarUrl} />
                ) : (
                  <Avatar size={80} icon={<UserOutlined />} className="bg-gradient-to-br from-primary-500 to-primary-700" />
                )}
                <div className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                  <UploadOutlined /> 点击上传
                </div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item name="email" label="邮箱" rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>保存修改</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: '修改密码',
      children: (
        <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>修改密码</Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">个人资料</h1>
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <Tabs items={items} />
      </Card>
    </div>
  );
};

export default Profile;
