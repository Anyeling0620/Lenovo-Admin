import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography } from 'antd';
import globalErrorHandler from '../utils/globalAxiosErrorHandler';
import { globalMessage } from '../utils/globalMessage';
import { adminLogin } from '../services/api';
import loginBg from './login.png';
const PUZZLE_IMG = loginBg
// 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

const DEFAULT_FORM = { account: '114514', password: '123456' };

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || '/';
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingValues, setPendingValues] = useState<{ account: string; password: string } | null>(null);
  const [sliderPos, setSliderPos] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPos, setDragStartPos] = useState(0);

  const sliderWidth = 320;
  const handleWidth = 44;
  const sliderRange = sliderWidth - handleWidth;

  const puzzleWidth = 340;
  const puzzleHeight = 160;
  const pieceSize = 64;
  const piecePadding = 12;
  const missingX = 140;
  const missingY = 40;
  const pieceRange = puzzleWidth - pieceSize - piecePadding * 2;
  const sliderTarget = Math.max(
    0,
    Math.min(sliderRange, ((missingX - piecePadding) / pieceRange) * sliderRange),
  );
  const successTolerance = 8;
  const isSliderAligned = Math.abs(sliderPos - sliderTarget) <= successTolerance;

  const handleLogin = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const response = await adminLogin(values);
      if (response && 'sessionId' in response && typeof response.sessionId === 'string') {
        localStorage.setItem('admin_sessionId', response.sessionId);
      }
      window.dispatchEvent(new Event('login'));
      globalMessage.success('登录成功');
      navigate(fromPath, { replace: true });
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setLoading(false);
    }
  };

  const openCaptcha = (values: { account: string; password: string }) => {
    setPendingValues(values);
    setSliderPos(0);
    setShowCaptcha(true);
  };

  const onFinish = (values: { account: string; password: string }) => {
    openCaptcha(values);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragStartX(e.clientX);
    setDragStartPos(sliderPos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = e.clientX - dragStartX;
    const next = Math.min(Math.max(dragStartPos + delta, 0), sliderRange);
    setSliderPos(next);
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(sliderPos - sliderTarget) <= successTolerance && pendingValues) {
      setShowCaptcha(false);
      handleLogin(pendingValues);
    } else {
      // 未完成则回弹
      setTimeout(() => setSliderPos(0), 180);
    }
  };

  return (
    <div
      className="relative min-h-dvh grid place-items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <Card
        style={{
          width: 360,
          background: 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.28)',
          boxShadow: '0 15px 40px rgba(15,23,42,0.25)',
        }}
      >
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24, color:"white" }}>
          管理后台登录
        </Typography.Title>
        <Form initialValues={DEFAULT_FORM} layout="vertical" onFinish={onFinish}>
          <Form.Item label="账号" name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </Card>

      {showCaptcha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="w-[380px] rounded-2xl bg-white/80 backdrop-blur p-5 shadow-2xl">
            <div className="text-lg font-semibold text-gray-900 mb-3">请完成滑块验证</div>
            <div
              className="relative overflow-hidden rounded-xl border border-gray-200"
              style={{ width: puzzleWidth, height: puzzleHeight }}
            >
              <div
                className="absolute inset-0 bg-center bg-cover"
                style={{
                  backgroundImage: `url(${PUZZLE_IMG})`,
                  backgroundSize: `${puzzleWidth}px ${puzzleHeight}px`,
                }}
              />
              <div
                className="absolute rounded-lg bg-white/70 backdrop-blur"
                style={{ width: pieceSize, height: pieceSize, left: missingX, top: missingY, border: '1px dashed rgba(0,0,0,0.18)' }}
              />
              <div
                className="absolute rounded-lg shadow-lg border border-white/60 bg-center bg-cover"
                style={{
                  width: pieceSize,
                  height: pieceSize,
                  top: missingY,
                  left: piecePadding + (sliderPos / sliderRange) * pieceRange,
                  backgroundImage: `url(${PUZZLE_IMG})`,
                  backgroundPosition: `-${missingX}px -${missingY}px`,
                  backgroundSize: `${puzzleWidth}px ${puzzleHeight}px`,
                }}
              />
              <div className="absolute inset-x-4 bottom-3 flex items-center gap-2 rounded-full bg-gray-900/70 px-3 py-2 text-xs text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                向右拖动滑块，补全缺口
              </div>
            </div>

            <div className="mt-4">
              <div
                className="relative h-12 overflow-hidden rounded-full bg-gray-100 border border-gray-200"
                style={{ width: `${sliderWidth}px` }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-blue-500/70 to-cyan-400/80 transition-all"
                  style={{ width: sliderPos + handleWidth }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 select-none">
                  {isSliderAligned ? '验证成功' : '拖动滑块完成验证'}
                </div>
                <div
                  className="absolute top-0 h-full w-11 cursor-pointer rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 border border-gray-200 select-none"
                  style={{ left: sliderPos }}
                  onMouseDown={handleMouseDown}
                >
                  |||
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
