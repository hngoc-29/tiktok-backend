import { Injectable } from '@nestjs/common';
import { transporter } from 'src/config/mail';

@Injectable()
export class EmailService {
    async sendMail(to: string, subject: string, html: string): Promise<void> {
        await transporter.sendMail({
            from: `"TikTok Clone" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
    }
}
