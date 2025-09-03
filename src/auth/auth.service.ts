import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken'; // Thêm dòng này
import { PrismaService } from '../config/database';
import { transporter } from '../config/mail';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  async signIn(body): Promise<any> {
    const { email, password } = body;

    // Tìm user theo email hoặc username
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT token
    const payload = { id: user.id, email: user.email, username: user.username, active: user.active, isAdmin: user.isAdmin };
    const token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, { expiresIn: '7d' });

    // Trả về user (loại bỏ password) và token
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, refreshToken, success: true };
  }

  async signUp(body: any): Promise<any> {
  try {
    const { fullname, username, email, password } = body;

    if (!fullname || !username || !email || !password) {
      throw new BadRequestException('Vui lòng điền đầy đủ thông tin');
    }

    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Kiểm tra username hợp lệ
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      throw new BadRequestException(
        'Username chỉ được chứa chữ, số và dấu gạch dưới (_) và không được có dấu cách hay ký tự đặc biệt'
      );
    }

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new UnauthorizedException('Người dùng đã tồn tại');
    }

    // Mã hóa password
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);

    // Tạo user mới
    await this.prisma.user.create({
      data: {
        fullname,
        username,
        email,
        password: hash,
        avatarUrl: `https://taphoammo.net/img/tai-khoan-tiktok-clone-avatar-cong-khai-tim-va-follow-co-cookie-tut-ngon.png`
      }
    });

    return {
      success: true,
      message: 'Tạo tài khoản thành công'
    };

  } catch (error: any) {
    console.error('Error signUp:', error);

    if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException('Đã xảy ra lỗi khi tạo tài khoản');
  }
}

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);

      // (Optionally) check DB nếu muốn đảm bảo refreshToken hợp lệ
      const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw new UnauthorizedException('User not found');

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, username: user.username, active: user.active, isAdmin: user.isAdmin },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: '1d' }
      );

      const newRefreshToken = jwt.sign(
        { id: user.id, email: user.email, username: user.username, active: user.active, isAdmin: user.isAdmin },
        process.env.JWT_REFRESH_TOKEN,
        { expiresIn: '7d' }
      );

      return {
        user,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        success: true,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmailToken(token: string): Promise<any> {
    // Tìm token trong bảng EmailVerificationToken
    const emailToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!emailToken) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Ép kiểu Date sau khi chắc chắn emailToken không null
    const expiresAt = new Date(emailToken.expiresAt);
    if (expiresAt < new Date()) {
      throw new UnauthorizedException('Token đã hết hạn');
    }

    // Kích hoạt tài khoản user
    const user = await this.prisma.user.update({
      where: { id: emailToken.userId },
      data: { active: true }
    });

    // Xóa tất cả token của user sau khi xác thực
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: emailToken.userId }
    });
    const payload = { id: user.id, email: user.email, username: user.username, active: user.active, isAdmin: user.isAdmin };
    const accesstoken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, { expiresIn: '7d' });
    return { message: 'Xác thực email thành công', token: accesstoken, refreshToken, success: true };
  }

  async sendVerificationEmail(email: string, token: string): Promise<{ success: boolean, message?: string }> {
    try {
      const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Xác thực email TikTok Clone',
        text: `Chào bạn!

Cảm ơn bạn đã đăng ký TikTok Clone.
Nhấn vào liên kết sau để xác thực email:
${verificationUrl}

Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `
  <!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Xác thực email</title>
      <style>
        /* Reset cơ bản cho email */
        html,body{margin:0!important;padding:0!important;height:100%!important;width:100%!important}
        *{box-sizing:border-box}
        a{ text-decoration:none }
        img{ border:0; line-height:100%; outline:none; text-decoration:none; }
        /* Gmail iOS tăng font */
        *[x-apple-data-detectors]{ color:inherit!important; text-decoration:none!important; }
        /* Dark mode (nhiều client hỗ trợ) */
        @media (prefers-color-scheme: dark){
          body, .email-bg { background:#0b0f14 !important; }
          .card { background:#121821 !important; border-color:#1e2733 !important; }
          .text { color:#e6edf3 !important; }
          .muted { color:#8b98a5 !important; }
          .btn { background:#22d3ee !important; color:#0b0f14 !important; }
        }
      </style>
    </head>
    <body style="background:#f4f6f8; margin:0; padding:0;">
      <!-- Preheader (ẩn) -->
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">
        Nhấn để xác thực email của bạn cho TikTok Clone.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background:#f4f6f8;">
        <tr>
          <td align="center" style="padding:24px;">
            <!-- Card -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
              <tr>
                <td class="card" style="
                  background:#ffffff;
                  border:1px solid #e6e9ee;
                  border-radius:16px;
                  padding:32px;
                  font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
                ">
                  <!-- Logo / Title -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom:8px;">
                        <!-- Logo dạng chữ để tránh phải nhúng ảnh -->
                        <div style="font-weight:800; font-size:22px; letter-spacing:0.2px;">
                          <span style="display:inline-block;padding:6px 10px;border-radius:10px;background:#000;color:#fff;">TikTok</span>
                          <span style="display:inline-block;margin-left:6px;padding:6px 10px;border-radius:10px;background:#ff2d55;color:#fff;">Clone</span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Heading -->
                  <h1 class="text" style="margin:16px 0 8px; font-size:22px; line-height:1.3; color:#0b1220;">
                    Xác thực email của bạn
                  </h1>

                  <!-- Body -->
                  <p class="text" style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#273142;">
                    Chào bạn, cảm ơn bạn đã đăng ký sử dụng TikTok Clone. Vui lòng nhấn nút bên dưới để hoàn tất việc xác thực email.
                  </p>

                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" target="_blank"
                           class="btn"
                           style="
                             display:inline-block;
                             background:#111827;
                             color:#ffffff;
                             font-weight:700;
                             font-size:15px;
                             padding:12px 20px;
                             border-radius:12px;
                             line-height:1;
                           ">
                          Xác thực email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Fallback link -->
                  <p class="muted" style="margin:16px 0 0; font-size:13px; line-height:1.6; color:#5b6676;">
                    Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:
                  </p>
                  <p style="word-break:break-all; margin:6px 0 18px;">
                    <a href="${verificationUrl}" style="color:#0ea5e9;">${verificationUrl}</a>
                  </p>

                  <hr style="border:none;border-top:1px solid #eef1f4; margin:18px 0;">

                  <!-- Help + Footer -->
                  <p class="muted" style="margin:0 0 6px; font-size:12px; color:#6b7280;">
                    Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email.
                  </p>
                  <p class="muted" style="margin:0; font-size:12px; color:#6b7280;">
                    © ${new Date().getFullYear()} TikTok Clone. Mọi quyền được bảo lưu.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:14px 6px; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:12px; color:#93a1af;">
                  Gửi từ hệ thống tự động – vui lòng không trả lời email này.
                </td>
              </tr>
            </table>
            <!-- /Card -->
          </td>
        </tr>
      </table>
    </body>
  </html>
  `,
      });

      return { success: true, message: 'Đã gửi email xác thực' };
    } catch (error) {
      return { success: false, message: 'Gửi email xác thực thất bại' };
    }
  }

  async handleSendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
    // Tìm user
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { success: false, message: 'Không tìm thấy người dùng' };
    }
    if (user.active) {
      return { success: true, message: 'Tài khoản đã được kích hoạt' };
    }
    // Tạo token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await this.prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt }
    });
    // Gửi email
    return this.sendVerificationEmail(email, token);
  }

  async sendForgotPasswordEmail(email: string): Promise<{ success: boolean; message?: string }> {
    // Tìm user
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { success: false, message: 'Không tìm thấy người dùng' };
    }
    // Tạo token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt }
    });
    // Gửi email
    try {
      const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Yêu cầu đặt lại mật khẩu TikTok Clone',
        text: `Chào bạn!

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TikTok Clone của bạn.
Nhấn vào liên kết sau để đặt lại mật khẩu:
${resetUrl}

Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `
  <!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Đặt lại mật khẩu</title>
      <style>
        body{margin:0;padding:0;background:#f4f6f8}
        table{border-collapse:collapse}
        a{text-decoration:none}
        @media (prefers-color-scheme: dark){
          body,.email-bg{background:#0b0f14!important}
          .card{background:#121821!important;border-color:#1e2733!important}
          .text{color:#e6edf3!important}
          .muted{color:#8b98a5!important}
          .btn{background:#22d3ee!important;color:#0b0f14!important}
        }
      </style>
    </head>
    <body>
      <!-- Preheader (ẩn) -->
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Yêu cầu đặt lại mật khẩu TikTok Clone của bạn.
      </div>

      <table role="presentation" width="100%" class="email-bg">
        <tr>
          <td align="center" style="padding:24px;">
            <table role="presentation" width="100%" style="max-width:560px;">
              <tr>
                <td class="card" style="background:#fff;border:1px solid #e6e9ee;border-radius:16px;padding:32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
                  <div style="font-weight:800;font-size:22px;text-align:center;margin-bottom:8px">
                    <span style="display:inline-block;padding:6px 10px;border-radius:10px;background:#000;color:#fff;">TikTok</span>
                    <span style="display:inline-block;margin-left:6px;padding:6px 10px;border-radius:10px;background:#ff2d55;color:#fff;">Clone</span>
                  </div>

                  <h1 class="text" style="font-size:22px;margin:16px 0 8px;color:#0b1220">Đặt lại mật khẩu</h1>
                  <p class="text" style="font-size:15px;line-height:1.6;color:#273142;margin:0 0 16px">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tiếp tục.
                  </p>

                  <table role="presentation" align="center" style="margin:20px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" target="_blank" class="btn"
                          style="display:inline-block;background:#111827;color:#fff;font-weight:700;font-size:15px;padding:12px 20px;border-radius:12px;">
                          Đặt lại mật khẩu
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p class="muted" style="font-size:13px;color:#5b6676;margin:16px 0 6px">
                    Hoặc sao chép và dán liên kết sau vào trình duyệt:
                  </p>
                  <p style="word-break:break-all;margin:6px 0 18px">
                    <a href="${resetUrl}" style="color:#0ea5e9">${resetUrl}</a>
                  </p>

                  <hr style="border:none;border-top:1px solid #eef1f4;margin:18px 0">
                  <p class="muted" style="font-size:12px;color:#6b7280;margin:0 0 6px">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                  </p>
                  <p class="muted" style="font-size:12px;color:#6b7280;margin:0">
                    © ${new Date().getFullYear()} TikTok Clone. Mọi quyền được bảo lưu.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-size:12px;color:#93a1af;padding:14px 6px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
                  Gửi từ hệ thống tự động – vui lòng không trả lời email này.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `,
      });
      return { success: true, message: 'Đã gửi email đặt lại mật khẩu' };
    } catch (error) {
      return { success: false, message: 'Gửi email đặt lại mật khẩu thất bại' };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    // Tìm token
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' };
    }
    if (newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }
    // Mã hóa mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);
    // Cập nhật mật khẩu
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hash }
    });
    // Xóa tất cả token đặt lại mật khẩu của user
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });
    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}
