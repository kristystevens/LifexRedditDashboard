import * as nodemailer from 'nodemailer'

export interface Mention {
  id: string
  type: string
  subreddit: string
  permalink: string
  author?: string
  title?: string
  body?: string
  createdUtc: Date
  label: string
  confidence: number
  score: number
  keywordsMatched: string
  ingestedAt: Date
  manualLabel?: string
  manualScore?: number
  taggedBy?: string
  taggedAt?: Date
  ignored: boolean
  urgent: boolean
  numComments: number
}

export interface EmailConfig {
  from: string
  to: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
}

export interface EmailReport {
  newCount: number
  topNegative: Mention[]
  allMentions: Mention[]
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  /**
   * Send email report for new mentions
   */
  async sendMentionsReport(report: EmailReport): Promise<void> {
    if (report.newCount === 0) {
      console.log('No new mentions to report')
      return
    }

    const html = this.generateHTMLReport(report)
    const csv = this.generateCSVReport(report.allMentions)

    const mailOptions = {
      from: this.config.from,
      to: this.config.to,
      subject: `LifeX Mentions Report - ${report.newCount} new mentions`,
      html,
      attachments: [
        {
          filename: `lifex-mentions-${new Date().toISOString().split('T')[0]}.csv`,
          content: csv,
          contentType: 'text/csv',
        },
      ],
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Email report sent successfully for ${report.newCount} mentions`)
    } catch (error) {
      console.error('Failed to send email report:', error)
      throw error
    }
  }

  /**
   * Generate HTML email content
   */
  private generateHTMLReport(report: EmailReport): string {
    const { newCount, topNegative } = report

    const topNegativeHTML = topNegative
      .slice(0, 5)
      .map(mention => `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #dc2626; background-color: #fef2f2;">
          <strong>r/${mention.subreddit}</strong> - Score: ${mention.score}/100 (${mention.label})
          <br>
          <em>${mention.title || mention.body?.substring(0, 200) + '...' || 'No content'}</em>
          <br>
          <a href="https://reddit.com${mention.permalink}" target="_blank">View on Reddit</a>
        </div>
      `)
      .join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LifeX Mentions Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937;">LifeX Mentions Report</h1>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #374151;">Summary</h2>
              <p><strong>New mentions found:</strong> ${newCount}</p>
              <p><strong>Report generated:</strong> ${new Date().toLocaleString()}</p>
            </div>

            ${topNegative.length > 0 ? `
              <h2 style="color: #dc2626;">Top 5 Most Negative Mentions</h2>
              ${topNegativeHTML}
            ` : ''}

            <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
              <p><strong>Note:</strong> A CSV file with all new mentions is attached to this email.</p>
              <p>Score scale: 1 = most negative, 100 = most positive, 50 = neutral</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Generate CSV content for all mentions
   */
  private generateCSVReport(mentions: Mention[]): string {
    const headers = [
      'ID',
      'Type',
      'Subreddit',
      'Author',
      'Title',
      'Body',
      'Created UTC',
      'Label',
      'Confidence',
      'Score',
      'Keywords Matched',
      'Permalink',
      'Ingested At',
    ]

    const rows = mentions.map(mention => [
      mention.id,
      mention.type,
      mention.subreddit,
      mention.author || '',
      mention.title || '',
      mention.body || '',
      mention.createdUtc.toISOString(),
      mention.label,
      mention.confidence,
      mention.score,
      mention.keywordsMatched,
      mention.permalink,
      mention.ingestedAt.toISOString(),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Email configuration is valid')
      return true
    } catch (error) {
      console.error('Email configuration test failed:', error)
      return false
    }
  }
}

export function createEmailService(): EmailService {
  const config: EmailConfig = {
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO!,
    smtpHost: process.env.SMTP_HOST!,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER!,
    smtpPass: process.env.SMTP_PASS!,
  }

  // Validate required environment variables
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  })

  return new EmailService(config)
}
