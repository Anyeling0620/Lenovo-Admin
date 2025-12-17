import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <ConfigProvider theme={{
      //  algorithm: [theme.compactAlgorithm],
        components: {
          Input: {
            activeBorderColor: '#7c7c7c',
            hoverBorderColor: '#6c6c6c',
          },
          Layout: {
            headerBg: '#eeeeee',
            siderBg: '#f7f7f7',
            triggerBg: '#e1e1e1',
            triggerColor: '#000000',

          },
          Menu: {
            itemSelectedBg: '#d6d6d6',
            itemHoverBg: '#f0f0f0',
            itemActiveBg: '#e1e1e1',
          },
        },
      }}>
        <App />
        <div className='text-[#cccccc]'>

        </div>
      </ConfigProvider>
    </StrictMode>
  </BrowserRouter>,
)
