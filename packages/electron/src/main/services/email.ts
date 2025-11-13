import nodemailer from 'nodemailer';
import { logEmailSent } from './stats';

interface EmailConfig {
  host: string;
  user: string;
  pass: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// 邮件配置
const EMAIL_CONFIG: EmailConfig = {
  host: 'smtp.163.com',
  user: '18267094443@163.com',
  pass: 'YFTv7Jkbzku7CNQu',
};

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass,
    },
  });
};

// 发送邮件
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"RSS阅读器" <${EMAIL_CONFIG.user}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    return false;
  }
}

// 分享文章到邮箱
export async function shareArticleByEmail(
  to: string,
  article: {
    title: string;
    link: string;
    author?: string;
    pubDate?: string;
    description?: string;
  },
  userId?: string,
  articleId?: string
): Promise<boolean> {
  const pubDateStr = article.pubDate 
    ? new Date(article.pubDate).toLocaleString('zh-CN')
    : '未知';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #24292e;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          border-bottom: 1px solid #e1e4e8;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #0366d6;
        }
        .meta {
          font-size: 14px;
          color: #586069;
          margin: 5px 0;
        }
        .description {
          background: #f6f8fa;
          border-left: 4px solid #0366d6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 3px;
        }
        .link-button {
          display: inline-block;
          padding: 10px 20px;
          background: #0366d6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
        .link-button:hover {
          background: #0256c7;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e4e8;
          font-size: 12px;
          color: #586069;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${article.title}</h1>
        ${article.author ? `<div class="meta">作者: ${article.author}</div>` : ''}
        <div class="meta">发布时间: ${pubDateStr}</div>
      </div>
      
      ${article.description ? `
        <div class="description">
          ${article.description}
        </div>
      ` : ''}
      
      <div>
        <a href="${article.link}" class="link-button">阅读原文 →</a>
      </div>
      
      <div class="footer">
        <p>此邮件由 RSS 阅读器自动发送</p>
      </div>
    </body>
    </html>
  `;

  const success = await sendEmail({
    to,
    subject: `[RSS分享] ${article.title}`,
    html,
  });

  // 记录邮件发送日志
  if (userId) {
    try {
      await logEmailSent({
        userId,
        articleId,
        recipientEmail: to,
        articleTitle: article.title,
        articleLink: article.link,
        success,
        errorMessage: success ? undefined : '发送失败',
      });
    } catch (error) {
      console.error('记录邮件日志失败:', error);
    }
  }

  return success;
}
