import React, { useState } from 'react';
import { Home, Compass, CalendarRange, Gamepad2, Download } from 'lucide-react';
import MarketPrices from './components/MarketPrices';
import NewsFeed from './components/NewsFeed';
import CalendarWidget from './components/CalendarWidget';
import WeatherWidget from './components/WeatherWidget';
import HoroscopeWidget from './components/HoroscopeWidget';
import SudokuGame from './components/SudokuGame';
import XiangqiGame from './components/XiangqiGame';
import SnakeGame from './components/SnakeGame';
import Calculator from './components/Calculator';
import CurrencyConverter from './components/CurrencyConverter';
import './index.css';

import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeGame, setActiveGame] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  React.useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const inApp = /FBAN|FBAV|Messenger|Zalo|Instagram|TikTok|BytedanceWebview/i.test(ua);
    const isAndroidDevice = /android/i.test(ua);
    
    setIsIOS(isIosDevice);
    setIsInAppBrowser(inApp);
    setIsAndroid(isAndroidDevice);
    
    // We intentionally do NOT return early if `display-mode: standalone` is true.
    // Reason: When opened inside another PWA (like Edutech), Android Chrome Custom Tabs 
    // can sometimes inherit the 'standalone' display mode, which would hide our install button.
    // By removing the early return, the button will always be accessible to users in these environments.

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    if (isIosDevice || inApp || isAndroidDevice) {
       setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|Edg|OPR|Opera|SamsungBrowser/i.test(navigator.userAgent);

    if (isChrome && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'entertainment') {
      setActiveGame(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <>
      {/* Header */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="app-title">DAILY INFO</h1>
          <p className="app-subtitle" style={{ maxWidth: '240px', lineHeight: '1.4' }}>{getGreeting()}! Cùng cập nhật thông tin nhanh nào.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showInstallBanner && (
             <button 
                onClick={handleInstallClick}
                style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)' }}
             >
               <Download size={16} /> Cài App
             </button>
          )}
          <WeatherWidget />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'home' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CalendarWidget />
            <HoroscopeWidget />
            <MarketPrices />
            <NewsFeed />
          </div>
        )}
        {activeTab === 'explore' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <NewsFeed />
          </div>
        )}
        {activeTab === 'utilities' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Calculator />
            <CurrencyConverter />
            <CalendarWidget />
            <HoroscopeWidget />
            <MarketPrices />
          </div>
        )}
        {activeTab === 'entertainment' && !activeGame && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <Gamepad2 size={24} color="#06b6d4" />
               <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0b525b' }}>Thư Viện Trò Chơi</h2>
             </div>
             
             {/* Xiangqi Card */}
             <div onClick={() => setActiveGame('xiangqi')} className="glass-panel" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #fca5a5, #ef4444)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', border: '1px solid rgba(255,255,255,0.6)' }} className="emoji-3d">
                   ♟️
                </div>
                <div>
                   <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#7f1d1d', marginBottom: '4px' }}>Cờ Tướng</h3>
                   <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Sandbox đối kháng tự do cực đỉnh.</p>
                </div>
             </div>

             {/* Sudoku Card */}
             <div onClick={() => setActiveGame('sudoku')} className="glass-panel" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #7dd3fc, #0ea5e9)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', border: '1px solid rgba(255,255,255,0.6)' }} className="emoji-3d">
                   🧩
                </div>
                <div>
                   <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0369a1', marginBottom: '4px' }}>Sudoku Trí Tuệ</h3>
                   <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Rèn luyện tư duy với lưới 9x9 cổ điển.</p>
                </div>
             </div>

             {/* Snake Card */}
             <div onClick={() => setActiveGame('snake')} className="glass-panel" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #34d399, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', border: '1px solid rgba(255,255,255,0.6)' }} className="emoji-3d">
                   🐍
                </div>
                <div>
                   <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>Rắn Săn Mồi</h3>
                   <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Trò chơi giải trí kinh điển mọi thời đại.</p>
                </div>
             </div>
          </div>
        )}
        
        {activeTab === 'entertainment' && activeGame === 'xiangqi' && (
          <XiangqiGame onBack={() => setActiveGame(null)} />
        )}
        
        {activeTab === 'entertainment' && activeGame === 'sudoku' && (
          <SudokuGame onBack={() => setActiveGame(null)} />
        )}

        {activeTab === 'entertainment' && activeGame === 'snake' && (
          <SnakeGame onBack={() => setActiveGame(null)} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <div className="icon-wrapper">
            <Home size={22} />
          </div>
          <span>Tổng Hợp</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => handleTabChange('explore')}
        >
          <div className="icon-wrapper">
            <Compass size={22} />
          </div>
          <span>Tin Tức</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'utilities' ? 'active' : ''}`}
          onClick={() => handleTabChange('utilities')}
        >
          <div className="icon-wrapper">
            <CalendarRange size={22} />
          </div>
          <span>Tiện Ích</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'entertainment' ? 'active' : ''}`}
          onClick={() => handleTabChange('entertainment')}
        >
          <div className="icon-wrapper">
            <Gamepad2 size={22} />
          </div>
          <span>Giải Trí</span>
        </button>
      </nav>

      {showInstallModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937', margin: 0 }}>
                📲 Cài đặt ứng dụng
              </h2>
              <button onClick={() => setShowInstallModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#6b7280', padding: 0 }}>
                ✕
              </button>
            </div>

            {/* Warning text */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#d97706', fontWeight: 'bold', fontSize: '15px', margin: '0 0 8px 0' }}>⚠️ Bạn đang mở trong trình duyệt nhúng</p>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                Trình duyệt này không hỗ trợ cài đặt trực tiếp. Vui lòng mở bằng <strong>Chrome</strong> hoặc <strong>Safari</strong> để cài app.
              </p>
            </div>

            {/* Link box */}
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 8px 0' }}>Link ứng dụng:</p>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#334155', wordBreak: 'break-all', textAlign: 'center', marginBottom: '12px' }}>
                {window.location.href}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã copy link!');
                }}
                style={{ width: '100%', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)' }}
              >
                📋 Copy Link
              </button>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155', margin: '0 0 12px 0' }}>📌 Cách cài đặt:</p>
              <ol style={{ paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
                <li>Nhấn <strong>"Copy Link"</strong> ở trên.</li>
                <li>Mở ứng dụng <strong>Chrome</strong> trên điện thoại.</li>
                <li>Dán link vào thanh địa chỉ và truy cập.</li>
                <li>Nhấn menu 3 chấm <strong>⋮</strong> → chọn <strong>"Thêm vào MH chính"</strong> hoặc <strong>"Cài đặt ứng dụng"</strong>.</li>
              </ol>
            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowInstallModal(false)}
              style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
