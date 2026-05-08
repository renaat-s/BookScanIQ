import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - InvoiceIQ</title>
        <meta name="description" content="InvoiceIQ Privacy Policy: How we collect, use, and protect your invoice and financial data. GDPR compliant with full transparency." />
        <meta name="keywords" content="privacy policy, data protection, GDPR, invoice data privacy" />
        <link rel="canonical" href="https://invoice-iq.com/privacy" />
      </Helmet>
      <Header />
      <main className="bg-gradient-subtle">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant flex items-center justify-center">
                <ShieldCheck className="w-9 h-9 text-violet-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight py-1">
                Privacy Policy
              </h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
              <p className="text-base text-muted-foreground font-light tracking-[-0.005em]">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <article className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant p-8 md:p-12 prose prose-lg max-w-none
                prose-headings:font-light prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-foreground/90
                prose-p:text-muted-foreground prose-p:font-light prose-p:leading-relaxed
                prose-li:text-muted-foreground prose-li:font-light prose-li:leading-relaxed
                prose-strong:text-foreground prose-strong:font-normal
                prose-a:text-violet-500 hover:prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                prose-ul:my-4">
                <h2>1. Introduction</h2>
                <p>
                  InvoiceIQ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our invoice processing service.
                </p>

                <h2>2. Information We Collect</h2>
                <h3>2.1 Information You Provide</h3>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, company name, and billing information</li>
                  <li><strong>Invoice Data:</strong> Invoices, receipts, and related financial documents you upload</li>
                  <li><strong>Bank Statements:</strong> Transaction data for matching purposes</li>
                  <li><strong>Communications:</strong> Messages you send to our support team</li>
                </ul>

                <h3>2.2 Automatically Collected Information</h3>
                <ul>
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                  <li><strong>Cookies:</strong> We use essential cookies for authentication and preferences</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul>
                  <li>Provide and maintain our invoice processing service</li>
                  <li>Process and match your invoices with bank transactions</li>
                  <li>Send payment reminders and notifications</li>
                  <li>Improve our AI matching algorithms</li>
                  <li>Provide customer support</li>
                  <li>Send important service updates and security alerts</li>
                  <li>Generate anonymized usage statistics</li>
                </ul>

                <h2>4. Google API Services & OAuth Scopes</h2>
                <p>
                  When you sign in with Google, InvoiceIQ requests the following Google OAuth scopes. Each scope is used solely for the purpose described below, and InvoiceIQ's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </p>
                <ul>
                  <li><strong>gmail.readonly</strong> (<code>https://www.googleapis.com/auth/gmail.readonly</code>) — Used to scan your inbox for invoice and receipt emails during Backlog Scans. We only read messages to identify and extract invoice data; we never modify, delete, or send email on your behalf using this scope.</li>
                  <li><strong>drive.file</strong> (<code>https://www.googleapis.com/auth/drive.file</code>) — Used to create an organized folder structure and store uploaded invoices in your Google Drive. We can only access files and folders that InvoiceIQ creates; we cannot read or modify any other files in your Drive.</li>
                  <li><strong>spreadsheets</strong> (<code>https://www.googleapis.com/auth/spreadsheets</code>) — Used to log processed invoices into your personal Google Sheets transaction ledger that InvoiceIQ creates for you.</li>
                </ul>
                <p>
                  We do not use Google user data for advertising, do not sell it, and do not allow humans to read it except (a) with your explicit consent, (b) for security investigations, or (c) to comply with applicable law. You may revoke InvoiceIQ's access at any time from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions page</a> or by using the "Disconnect Google" option on your <a href="/settings">Settings page</a>.
                </p>

                <h2>5. Data Processing and AI</h2>
                <p>
                  Your invoice data is processed by our AI Agent to extract information such as vendor names, amounts, dates, and line items. This processing happens automatically and securely. We use machine learning to improve matching accuracy, but your specific invoice data is never used to train models for other customers.
                </p>

                <h2>6. How We Share Your Information</h2>
                <p>We do NOT sell, rent, or trade your personal information. We only share data in these limited circumstances:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Trusted third parties who help us operate our service (e.g., cloud hosting, email delivery)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                </ul>

                <h2>7. Data Security</h2>
                <p>We implement industry-standard security measures:</p>
                <ul>
                  <li>AES-256 encryption for data at rest</li>
                  <li>TLS 1.3 encryption for data in transit</li>
                  <li>Secure, GDPR-compliant EU/UK data centers</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                </ul>

                <h2>8. Your Rights (GDPR)</h2>
                <p>If you're located in the EU/UK, you have the following rights:</p>
                <ul>
                  <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
                  <li><strong>Right to Data Portability:</strong> Export your data in a standard format</li>
                  <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                </ul>

                <h2>9. Data Retention & Deletion</h2>
                <p>
                  We retain your data only as long as your account is active or as needed to provide the service. You are in full control and can request deletion at any time.
                </p>
                <h3>9.1 Retention Periods</h3>
                <ul>
                  <li>Active accounts: data is retained while your account is in use</li>
                  <li>After cancellation: a 30-day grace period, then permanent deletion</li>
                  <li>Backups: retained for up to 30 days, then automatically deleted</li>
                </ul>
                <h3>9.2 How to Request Deletion</h3>
                <p>You can delete your data at any time using any of the following methods:</p>
                <ul>
                  <li><strong>In-app:</strong> Go to <a href="/settings">Settings</a> and click <strong>"Delete My Account &amp; Data"</strong>. This permanently removes your profile, stored Google/Xero/QuickBooks tokens, scan history, and invoice metadata from our systems.</li>
                  <li><strong>Disconnect Google only:</strong> Use the <strong>"Disconnect Google"</strong> button on the <a href="/settings">Settings</a> page to revoke our access to your Gmail, Drive, and Sheets without deleting your account. You can also revoke access from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions page</a>.</li>
                  <li><strong>By email:</strong> Send a deletion request to <a href="mailto:info@invoice-iq.com">info@invoice-iq.com</a> from your account email and we will action it within 30 days.</li>
                </ul>
                <p>
                  <strong>Important:</strong> Files that InvoiceIQ has saved into <em>your own</em> Google Drive and entries written into <em>your own</em> Google Sheets remain in your Google account and are not deleted by us, because they belong to you. You may delete them yourself at any time directly from Google Drive / Sheets.
                </p>

                <h2>10. Cookies and Tracking</h2>
                <p>We use the following types of cookies:</p>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                  <li><strong>Analytics Cookies:</strong> Anonymized usage statistics to improve our service</li>
                </ul>
                <p>We do NOT use advertising or tracking cookies.</p>

                <h2>11. Third-Party Services</h2>
                <p>We integrate with:</p>
                <ul>
                  <li><strong>Google Workspace:</strong> For invoice uploads and document management</li>
                  <li><strong>Email Providers:</strong> For sending payment reminders and notifications</li>
                  <li><strong>Payment Processors:</strong> For handling subscription payments (we do not store credit card details)</li>
                  <li><strong>Accounting Platforms (Xero, QuickBooks):</strong> For syncing invoice data to your accounting software, only after you have explicitly authenticated with these platforms</li>
                </ul>

                <h3>11.1 Sharing with Accounting Platforms</h3>
                <p>
                  InvoiceIQ may transmit invoice data (including vendor name, amount, date, and attached documents) to third-party accounting platforms such as Xero and QuickBooks, solely at the user's explicit request and only after the user has independently authenticated with those platforms. InvoiceIQ does not share data with any third party without the user's informed consent.
                </p>

                <h2>12. Children's Privacy</h2>
                <p>
                  Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
                </p>

                <h2>13. International Data Transfers</h2>
                <p>
                  Your data is stored on servers located in the EU and UK. If you're accessing our service from outside these regions, your data will be transferred to and processed in the EU/UK under GDPR protection.
                </p>

                <h2>14. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We'll notify you of significant changes via email or through the platform. Continued use of the service after changes constitutes acceptance of the updated policy.
                </p>

                <h2>15. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or want to exercise your data rights:
                </p>
                <ul>
                  <li><strong>Email:</strong> info@invoice-iq.com</li>
                  <li><strong>Data Protection Officer:</strong> info@invoice-iq.com</li>
                </ul>

                <h2>16. Legal Basis for Processing (GDPR)</h2>
                <p>We process your data based on:</p>
                <ul>
                  <li><strong>Contract Performance:</strong> To provide the service you've subscribed to</li>
                  <li><strong>Legitimate Interests:</strong> To improve our service and prevent fraud</li>
                  <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Consent:</strong> For marketing communications (you can opt out anytime)</li>
                </ul>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
