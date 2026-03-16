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
      label: 'Basic Info',
      children: (
        <Form
          form={form}
          onFinish={handleUpdateProfile}
          layout="vertical"
        >
          <Form.Item label="Avatar">
            <Upload
              name="avatar"
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
            >
              <div className="cursor-pointer">
                {avatarUrl ? (
                  <Avatar size={80} src={avatarUrl} />
                ) : (
                  <Avatar size={80} icon={<UserOutlined />} className="bg-gradient-to-br from-blue-500 to-indigo-600" />
                )}
                <div className="text-sm text-gray-500 mt-2">
                  <UploadOutlined /> Click to upload
                </div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: '2',
      label: 'Change Password',
      children: (
        <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[{ required: true, message: 'Please enter new password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card>
        <Tabs items={items} />
      </Card>
    </div>
  );
};

export default Profile;
