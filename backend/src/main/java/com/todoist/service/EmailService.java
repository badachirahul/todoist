package com.todoist.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends invitation emails via the configured SMTP (Gmail). Best-effort: if mail
 * isn't configured (blank from-address) or sending fails, it logs and returns —
 * an invite is still created so the flow never breaks during local dev.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendInvite(String toEmail, String inviterName, String projectName, String acceptUrl) {
        if (from == null || from.isBlank()) {
            log.warn("Mail not configured (app.mail.from blank) — skipping invite email to {} (accept: {})", toEmail, acceptUrl);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, "UTF-8");
            h.setFrom(from, inviterName + " via Todoist");
            h.setTo(toEmail);
            h.setSubject(inviterName + " added you to " + projectName + " in Todoist");
            h.setText(buildHtml(inviterName, projectName, acceptUrl), true);
            mailSender.send(msg);
            log.info("Invite email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}: {}", toEmail, e.getMessage());
        }
    }

    /** Notify a remaining project member that a collaborator was removed (or left). */
    public void sendRemoval(String toEmail, String removedName, String projectName) {
        if (from == null || from.isBlank()) {
            log.warn("Mail not configured (app.mail.from blank) — skipping removal email to {}", toEmail);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, "UTF-8");
            h.setFrom(from, "Todoist");
            h.setTo(toEmail);
            h.setSubject("Collaborator removed: " + removedName + " was removed from \"" + projectName + "\"");
            h.setText(buildRemovalHtml(removedName, projectName), true);
            mailSender.send(msg);
            log.info("Removal email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send removal email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildRemovalHtml(String removedName, String projectName) {
        return """
                <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;text-align:center;color:#202020">
                  <p style="color:#888;font-size:13px">collaborator removed</p>
                  <h2 style="font-size:20px">%s was removed from a project in Todoist:</h2>
                  <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0;text-align:left"># %s</div>
                  <p style="color:#555;font-size:14px">You'll still be able to see the tasks and comments they added, but they no longer have access to the project itself.</p>
                </div>
                """.formatted(removedName, projectName);
    }

    private String buildHtml(String inviterName, String projectName, String acceptUrl) {
        return """
                <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;text-align:center;color:#202020">
                  <p style="color:#888;font-size:13px">pending invite</p>
                  <h2 style="font-size:20px">%s invited you to collaborate on the %s project in Todoist.</h2>
                  <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0;text-align:left"># %s</div>
                  <a href="%s" style="display:inline-block;background:#dc4c3e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Accept invite</a>
                  <p style="color:#888;font-size:12px;margin-top:16px">Or paste this link: <br>%s</p>
                </div>
                """.formatted(inviterName, projectName, projectName, acceptUrl, acceptUrl);
    }
}
