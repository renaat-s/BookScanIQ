import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { ScrollText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - InvoiceIQ</title>
        <meta name="description" content="InvoiceIQ Terms of Service: User agreements, subscription terms, AI accuracy disclaimers, and legal terms for using our invoice automation service." />
        <meta name="keywords" content="terms of service, user agreement, subscription terms, legal terms" />
        <link rel="canonical" href="https://invoice-iq.com/terms" />
      </Helmet>
      <Header />
      <main className="bg-gradient-subtle">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant flex items-center justify-center">
                <ScrollText className="w-9 h-9 text-violet-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-tight py-1">
                Terms of Service
              </h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
              <p className="text-base text-muted-foreground font-light tracking-[-0.005em]">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 sm:px-6">
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
                <h2>1. Agreement to Terms</h2>
                <p>
                  By accessing or using InvoiceIQ ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
                </p>

                <h2>2. Service Description</h2>
                <p>
                  InvoiceIQ is an automated invoice processing service that uses AI to extract and structure data from invoices, and automate payment tracking and reminders.
                </p>

                <h2>3. User Accounts</h2>
                <h3>3.1 Account Creation</h3>
                <ul>
                  <li>You must provide accurate and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must be at least 18 years old to create an account</li>
                  <li>One person or business per account</li>
                </ul>

                <h3>3.2 Account Security</h3>
                <ul>
                  <li>You are responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>We are not liable for losses due to stolen or compromised credentials</li>
                </ul>

                <h2>4. Subscription and Payment</h2>
                <h3>4.1 Pricing and Billing</h3>
                <ul>
                  <li>Subscription fees are billed monthly or annually as selected</li>
                  <li>All fees are in GBP/USD/EUR (depending on your region)</li>
                  <li>Prices may change with 30 days' notice</li>
                  <li>You authorize automatic recurring charges to your payment method</li>
                </ul>

                <h3>4.2 Refunds</h3>
                <ul>
                  <li>Refunds are issued at our discretion</li>
                  <li>Unused subscription time is not refundable</li>
                  <li>Service issues may qualify for partial refunds</li>
                </ul>

                <h3>4.4 Cancellation</h3>
                <ul>
                  <li>You may cancel your subscription at any time</li>
                  <li>Cancellation takes effect at the end of the current billing period</li>
                  <li>No refunds for partial billing periods</li>
                  <li>Data retained for 30 days after cancellation, then permanently deleted</li>
                </ul>

                <h2>5. Acceptable Use</h2>
                <h3>5.1 You agree NOT to:</h3>
                <ul>
                  <li>Upload invoices or data you don't have rights to process</li>
                  <li>Use the Service for illegal activities or fraud</li>
                  <li>Attempt to reverse engineer, hack, or breach our security</li>
                  <li>Upload malware, viruses, or malicious code</li>
                  <li>Abuse, harass, or threaten our staff or other users</li>
                  <li>Scrape, crawl, or automatically collect data from the Service</li>
                  <li>Resell or redistribute access to the Service</li>
                </ul>

                <h3>5.2 Content Restrictions</h3>
                <ul>
                  <li>Do not upload invoices containing illegal content</li>
                  <li>We reserve the right to remove content that violates our policies</li>
                  <li>Repeated violations may result in account termination</li>
                </ul>

                <h2>6. Data and Intellectual Property</h2>
                <h3>6.1 Your Data</h3>
                <ul>
                  <li>You retain all rights to your invoice data and documents</li>
                  <li>You grant us a license to process your data to provide the Service</li>
                  <li>We do not claim ownership of your uploaded content</li>
                </ul>

                <h3>6.2 Our Intellectual Property</h3>
                <ul>
                  <li>InvoiceIQ owns all rights to the Service, software, and algorithms</li>
                  <li>You may not copy, modify, or distribute our software</li>
                  <li>Our brand name, logo, and content are protected by intellectual property laws</li>
                </ul>

                <h2>7. Service Limitations and Disclaimer</h2>
                <h3>7.1 AI Accuracy Disclaimer</h3>
                <p>
                  <strong>IMPORTANT:</strong> While our AI strives for high accuracy, automated invoice processing may occasionally produce errors.
                </p>
                <ul>
                  <li><strong>No Guarantee of Accuracy:</strong> We do not guarantee 100% accurate data extraction or categorization</li>
                  <li><strong>User Responsibility:</strong> You are responsible for reviewing and verifying all extracted data before making financial decisions</li>
                  <li><strong>Human Oversight Required:</strong> The Service is a tool to assist, not replace, human financial oversight</li>
                </ul>

                <h3>7.2 Service Availability</h3>
                <ul>
                  <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                  <li>Scheduled maintenance will be announced in advance when possible</li>
                  <li>We are not liable for losses due to service downtime</li>
                </ul>

                <h3>7.3 Data Loss</h3>
                <ul>
                  <li>We maintain regular backups but are not responsible for data loss</li>
                  <li>You should maintain your own backups of critical data</li>
                  <li>We recommend exporting important data regularly</li>
                </ul>

                <h2>8. Limitation of Liability</h2>
                <p>
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
                </p>
                <ul>
                  <li>We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>Our total liability is limited to the amount you paid in the last 12 months</li>
                  <li>We are not responsible for errors in invoice data extraction or matching</li>
                  <li>We are not liable for financial losses due to incorrect invoice processing</li>
                  <li>We are not responsible for late payments or missed payment deadlines</li>
                </ul>

                <h2>9. Third-Party Integrations</h2>
                <p>
                  The Service integrates with third-party platforms (Google Workspace, banks, accounting software). We are not responsible for:
                </p>
                <ul>
                  <li>Third-party service downtime or changes</li>
                  <li>Data security on third-party platforms</li>
                  <li>Accuracy of data imported from third parties</li>
                </ul>

                <h2>10. Termination</h2>
                <h3>10.1 By You</h3>
                <ul>
                  <li>You may cancel your account at any time through account settings</li>
                  <li>Data will be retained for 30 days after cancellation</li>
                </ul>

                <h3>10.2 By Us</h3>
                <p>We may suspend or terminate your account if:</p>
                <ul>
                  <li>You violate these Terms</li>
                  <li>Your payment fails and is not resolved within 7 days</li>
                  <li>You engage in fraudulent or illegal activity</li>
                  <li>We discontinue the Service (with 60 days' notice)</li>
                </ul>

                <h2>11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold InvoiceIQ harmless from any claims, losses, or damages arising from:
                </p>
                <ul>
                  <li>Your violation of these Terms</li>
                  <li>Your uploaded content or data</li>
                  <li>Your use of the Service in violation of applicable laws</li>
                  <li>Financial decisions made based on Service output</li>
                </ul>

                <h2>12. Changes to Terms</h2>
                <ul>
                  <li>We may update these Terms at any time</li>
                  <li>Material changes will be communicated via email or in-app notification</li>
                  <li>Continued use after changes constitutes acceptance</li>
                  <li>If you don't agree to new Terms, you must stop using the Service</li>
                </ul>

                <h2>13. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of England and Wales.
                </p>

                <h2>14. Dispute Resolution</h2>
                <ul>
                  <li>Before legal action, we encourage informal resolution by contacting support</li>
                  <li>For EU customers: You have the right to use EU Online Dispute Resolution platforms</li>
                </ul>

                <h2>15. Severability</h2>
                <p>
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
                </p>

                <h2>16. Entire Agreement</h2>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and InvoiceIQ.
                </p>

                <h2>17. Contact Information</h2>
                <p>For questions about these Terms:</p>
                <ul>
                  <li><strong>Email:</strong> info@invoice-iq.com</li>
                  <li><strong>Support:</strong> info@invoice-iq.com</li>
                </ul>
              </article>

              <div className="mt-8 p-8 bg-gradient-to-br from-violet-500/10 via-card/60 to-fuchsia-500/10 backdrop-blur-sm border border-violet-500/20 rounded-3xl shadow-elegant text-center">
                <p className="text-foreground font-light leading-relaxed max-w-2xl mx-auto">
                  By using InvoiceIQ, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
