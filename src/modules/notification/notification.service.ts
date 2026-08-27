import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

export type NotifyPayload = {
  title: string;
  message: string;
  type: string;
  action_url?: string;
  priority?: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async notifyUsers(userIds: number[], payload: NotifyPayload) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (!uniqueIds.length) return { in_app: 0, emailed: 0 };

    await this.prisma.user_Notification.createMany({
      data: uniqueIds.map((user_id) => ({
        user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority || 'normal',
        action_url: payload.action_url || null,
      })),
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, email_id: true, name: true },
    });

    let emailed = 0;
    for (const user of users) {
      if (!user.email_id) continue;
      const ok = await this.sendEmail(user.email_id, payload.title, payload.message, user.name);
      if (ok) emailed += 1;
    }

    return { in_app: uniqueIds.length, emailed };
  }

  async listForUser(userId: number, unreadOnly = false) {
    return this.prisma.user_Notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: number, notificationId: number) {
    const row = await this.prisma.user_Notification.findFirst({
      where: { id: notificationId, user_id: userId },
    });
    if (!row) return null;
    return this.prisma.user_Notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  async markAllRead(userId: number) {
    await this.prisma.user_Notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { message: 'All notifications marked as read' };
  }

  private async sendEmail(to: string, subject: string, message: string, name?: string | null) {
    const host = this.configService.get('SMTP_HOST');
    if (!host) {
      this.logger.warn(`SMTP not configured — skipped email to ${to}`);
      return false;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get('SMTP_PORT') || 587),
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER'),
        to,
        subject: `${subject} — TEST VISTA`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#212529;">TEST VISTA</h2>
            <p>Hello${name ? ` ${name}` : ''},</p>
            <p>${message}</p>
            <p style="color:#6c757d;font-size:12px;">This is an automated notification from Test Vista.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to email ${to}: ${(error as Error).message}`);
      return false;
    }
  }
}
