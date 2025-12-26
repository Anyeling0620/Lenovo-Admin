import React from 'react'
import { globalMessage } from '../utils/globalMessage'



const Index = () => {

  const str1 = `
    try{
      //接口调用及其他处理
    }catch(error){
      globalErrorHandler.handle(error, globalMessage.error)
      //其他处理
    }finally{
      //其他处理
    }
`

const str2 = `
  globalMessage.info('一般提示');
  globalMessage.success('成功提示');
  globalMessage.warning('警告提示');
  globalMessage.error('错误提示');
  globalMessage.loading('加载中');
还有一些进阶的使用方法同antd组件库的message组件，请自行查阅，此处只是封装了全局化的工具。
`
  return (
    <div>
      <pre>
        注意，接下来的分工不再只负责页面，将包含业务层处理，渲染数据的任务将全权交予你们负责。
        <br />
        接口调用函数我会提供在src/service/ 目录下，如何使用? 问ai去， 有兴趣做防抖可以使用ahooks依赖库的useRequest。
        <br />
        在trycatch块中的错误处理，请使用全局错误工具处理globalErrorHandler.handle()方法，
        至少携带两个参数，第一个是catch捕获的error，第二个是全局消息提示globalMessage.error()方法。
        <br />
        使用示例：
        <text className=' text-red-500' >{str1}</text>
        <br />
        在其他地方想使用消息提示：
        {str2}
        <br />
        img标签只要是渲染后端返回图片的，一律使用utils文件夹里的图片url处理工具函数<text className='text-red-500'>getImageUrl(imgName:string)</text>。
        <br/>
        此项目尽量使用<text className=' text-red-500' >antd组件库</text>；
        <br />
        此项目含有大量表单设计，对于表单，请使用zod进行表单验证，使用react-form-hooks库设计表单
        <br />
        <text className=' text-red-500' >禁止使用对话框/模态框设计表单</text>。
        请重新写一个页面进行表单设计。提交表单后使用Link返回原页面即可。
        <br />
        页面内容信息显示量要大，紧凑。padding和margin不要太大。
        内容字体不要大过菜单栏字体。

        <br />
        自己负责的页面请去App.tsx中注册路由。
        可以去SideMenu.tsx查看自己负责页面的路由。
        自己新建的页面自己负责路由命名和注册。

        <br />
        请不要修改Layouts文件夹现有代码。
        大家请在各个模块下新建文件夹，命名为自己的名字缩写或者其他标识，只要能辩认出是你负责的代码即可，用于保存自己负责的代码。

        <br />
        <text className=' text-red-500' >请认真完成，后面需要自己调试，除非是我后端的问题，否则不再插手前端。</text>


      </pre>
    </div>
  )
}

export default Index