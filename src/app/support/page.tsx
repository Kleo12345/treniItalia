'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import Header from '@/components/Header/Header';
import styles from './page.module.css';

export default function SupportPage() {
  const { t } = useLocale();
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate network delay for realism
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      
      const form = e.target as HTMLFormElement;
      form.reset();
      
      // Auto-hide success message
      setTimeout(() => setIsSent(false), 6000);
    }, 800);
  };

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.content}>
        <div className={styles.headerArea}>
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            {t('app.title')}
          </Link>
          <h1 className={styles.title}>{t('support.title')}</h1>
          <p className={styles.subtitle}>{t('support.subtitle')}</p>
        </div>

        <div className={styles.supportContainer}>
          <div className={styles.contactPanel}>
            <h2>{t('support.contactInfo')}</h2>
            <div className={styles.infoItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{t('support.address')}</span>
            </div>
            <div className={styles.infoItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>{t('support.phone')}</span>
            </div>
            <div className={styles.infoItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>{t('support.emailAddress')}</span>
            </div>
          </div>

          <div className={styles.formPanel}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">{t('support.name')}</label>
                <input type="text" id="name" required className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">{t('support.email')}</label>
                <input type="email" id="email" required className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">{t('support.subject')}</label>
                <input type="text" id="subject" required className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">{t('support.message')}</label>
                <textarea id="message" rows={5} required className={styles.textarea}></textarea>
              </div>
              
              <button type="submit" className={styles.submitButton} disabled={isSending}>
                {isSending ? (
                  <>
                    <svg className="skeleton" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    {t('app.loading')}
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    {t('support.send')}
                  </>
                )}
              </button>
              
              {isSent && (
                <div className={styles.successMessage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  {t('support.successMessage')}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
