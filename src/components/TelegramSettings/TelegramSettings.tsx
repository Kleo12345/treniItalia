'use client';

import { useState } from 'react';
import { useFollowedTrains } from '@/context/FollowedTrainsContext';
import { useLocale } from '@/context/LocaleContext';
import styles from './TelegramSettings.module.css';

export default function TelegramSettings({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const { telegramSettings, saveTelegramSettings, sendTelegramMessage } = useFollowedTrains();

  const [token, setToken] = useState(telegramSettings.token);
  const [chatId, setChatId] = useState(telegramSettings.chatId);
  const [enabled, setEnabled] = useState(telegramSettings.enabled);
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const handleSave = () => {
    saveTelegramSettings({ enabled, token: token.trim(), chatId: chatId.trim() });
    onClose();
  };

  const handleTest = async () => {
    if (!token.trim() || !chatId.trim()) {
      setTestStatus('error');
      setTestError(t('telegram.fillBoth', { defaultValue: 'Please fill in both fields first.' }));
      return;
    }
    // Save temp settings to use in context, then send
    saveTelegramSettings({ enabled, token: token.trim(), chatId: chatId.trim() });
    setTestStatus('loading');
    setTestError('');
    const result = await sendTelegramMessage(`🚆 <b>Treni Italia</b>\n${t('telegram.testMessage', { defaultValue: 'Test notification. Your Telegram integration is working!' })}`);
    if (result.ok) {
      setTestStatus('ok');
    } else {
      setTestStatus('error');
      setTestError(result.error ?? 'Unknown error');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Telegram SVG icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <h2>{t('telegram.title', { defaultValue: 'Telegram Notifications' })}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className={styles.description}>
          {t('telegram.description', { defaultValue: 'Get notified on Telegram when a followed train reaches a new station.' })}
        </p>

        <div className={styles.enableRow}>
          <span className={styles.enableLabel}>{t('telegram.enable', { defaultValue: 'Enable Telegram Notifications' })}</span>
          <button
            className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
            onClick={() => setEnabled(v => !v)}
            aria-label="Toggle Telegram notifications"
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.fields}>
          <label className={styles.fieldLabel}>
            {t('telegram.botToken', { defaultValue: 'Bot Token' })}
            <span className={styles.fieldHint}>{t('telegram.botTokenHint', { defaultValue: 'From @BotFather on Telegram' })}</span>
          </label>
          <div className={styles.tokenRow}>
            <input
              className={styles.input}
              type={showToken ? 'text' : 'password'}
              placeholder="123456789:ABCdefGHI..."
              value={token}
              onChange={e => setToken(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button className={styles.eyeBtn} onClick={() => setShowToken(v => !v)} type="button" aria-label="Toggle token visibility">
              {showToken ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <label className={styles.fieldLabel}>
            {t('telegram.chatId', { defaultValue: 'Chat ID' })}
            <span className={styles.fieldHint}>{t('telegram.chatIdHint', { defaultValue: 'Your user ID or group ID' })}</span>
          </label>
          <input
            className={styles.input}
            type="text"
            placeholder="-1001234567890"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            autoComplete="off"
          />
        </div>

        {testStatus === 'ok' && (
          <div className={styles.success}>✓ {t('telegram.testSuccess', { defaultValue: 'Test message sent successfully!' })}</div>
        )}
        {testStatus === 'error' && (
          <div className={styles.error}>✗ {testError}</div>
        )}

        <div className={styles.actions}>
          <button className={styles.testBtn} onClick={handleTest} disabled={testStatus === 'loading'}>
            {testStatus === 'loading' ? t('app.loading', { defaultValue: 'Loading...' }) : t('telegram.test', { defaultValue: 'Send Test Message' })}
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            {t('settings.save', { defaultValue: 'Save' })}
          </button>
        </div>
      </div>
    </div>
  );
}
