import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatBot from '../common/ChatBot';

const styles = {
  footer: { background: '#1565c0', color: 'white', textAlign: 'center', padding: '1.5rem', marginTop: '3rem', fontSize: '0.9rem' },
  main: { minHeight: 'calc(100vh - 200px)' },
};

export default function Layout() {
  return (
    <>
      <Header />
      <main style={styles.main}>
        <Outlet />
      </main>
      <footer style={styles.footer}>
        <p>© 2026 AI Hypermarket — AI-Driven Personalized Shopping | CS5500 Project</p>
      </footer>
      <ChatBot />
    </>
  );
}
