import React from 'react';
import { Card, Typography, Alert, Divider, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

const Index = () => {
  const str1 = `try {
  // 接口调用及其他处理
} catch (error) {
  globalErrorHandler.handle(error, globalMessage.error);
  // 其他处理
} finally {
  // 其他处理
}`;

  const str2 = `globalMessage.info('一般提示');
globalMessage.success('成功提示');
globalMessage.warning('警告提示');
globalMessage.error('错误提示');
globalMessage.loading('加载中');
// 还有一些进阶的使用方法同 antd 组件库的 message 组件，请自行查阅，此处只是封装了全局化的工具。`;

  return (
    <div className="p-6">
      <Card title={<Title level={3}>开发规范与注意事项</Title>} bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="重要提示"
            description="接下来的分工不再只负责页面，将包含业务层处理，渲染数据的任务将全权交予你们负责。"
            type="warning"
            showIcon
          />

          <Typography>
            <Title level={4}>1. 接口与错误处理</Title>
            <Paragraph>
              接口调用函数提供在 <Text code>src/services/</Text> 目录下。如果有兴趣做防抖，可以使用 <Text code>ahooks</Text> 库的 <Text code>useRequest</Text>。
            </Paragraph>
            <Paragraph>
              在 <Text code>try-catch</Text> 块中的错误处理，请使用全局错误工具 <Text code>globalErrorHandler.handle()</Text> 方法。
              至少携带两个参数：<Text code>catch</Text> 捕获的 <Text code>error</Text> 和全局消息提示 <Text code>globalMessage.error()</Text> 方法。
            </Paragraph>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <pre className="text-sm font-mono m-0">{str1}</pre>
            </div>

            <Divider />

            <Title level={4}>2. 全局消息提示</Title>
            <Paragraph>在其他地方使用消息提示：</Paragraph>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <pre className="text-sm font-mono m-0">{str2}</pre>
            </div>

            <Divider />

            <Title level={4}>3. 静态资源与组件</Title>
            <Paragraph>
              <ul>
                <li>
                  图片资源：渲染后端返回的图片，一律使用工具函数 <Text code copyable>getImageUrl(imgName: string)</Text>
                </li>
                <li>
                  组件库：此项目尽量使用 <Text strong type="danger">Ant Design (antd)</Text> 组件库。
                </li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>4. 表单设计规范</Title>
            <Paragraph>
              此项目含有大量表单设计。对于表单：
              <ul>
                <li>请使用 <Text code>zod</Text> 进行表单验证。</li>
                <li>请使用 <Text code>react-hook-form</Text> 库设计表单。</li>
                <li>
                  <Text type="danger" strong>禁止使用对话框/模态框设计表单。</Text> 请重新写一个页面进行表单设计，提交表单后使用 <Text code>Link</Text> 返回原页面即可。
                </li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>5. UI 与 布局</Title>
            <Paragraph>
              <ul>
                <li>页面内容信息显示量要大，紧凑。Padding 和 Margin 不要太大。</li>
                <li>内容字体不要大过菜单栏字体。</li>
                <li>请不要修改 <Text code>Layouts</Text> 文件夹现有代码。</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>6. 路由与代码组织</Title>
            <Paragraph>
              <ul>
                <li>自己负责的页面请去 <Text code>App.tsx</Text> 中注册路由。</li>
                <li>可以去 <Text code>SideMenu.tsx</Text> 查看自己负责页面的路由。自己新建的页面自己负责路由命名和注册。</li>
                <li>
                  大家请在各个模块下新建文件夹，命名为自己的名字缩写或者其他标识，只要能辩认出是你负责的代码即可。
                </li>
              </ul>
            </Paragraph>

            <Alert
              message="最后强调"
              description="请认真完成，后面需要自己调试，除非是我后端的问题，否则不再插手前端。"
              type="error"
              showIcon
            />
          </Typography>
        </Space>
      </Card>
    </div>
  );
};

export default Index;