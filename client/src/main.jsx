import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/reset.css';
import './styles.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#ee4d2d',
          borderRadius: 6
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
