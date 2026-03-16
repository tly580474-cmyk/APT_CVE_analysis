import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // 调用后端API进行登录
      const response = await authAPI.login(values);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card title="用户登录" className="w-96">
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            还没有账号？<a href="/register">立即注册</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
