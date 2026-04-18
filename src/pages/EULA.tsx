import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const EULA = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>End User License Agreement (EULA) - InvoiceIQ</title>
        <meta
          name="description"
          content="InvoiceIQ End User License Agreement (EULA): License grant, permitted use, restrictions, third-party integrations (QuickBooks, Xero, Google), and liability terms."
        />
        <meta name="keywords" content="EULA, end user license agreement, software license, InvoiceIQ license" />
        <link rel="canonical" href="https://invoice-iq.com/eula" />
      </Helmet>
      <Header />
      <main>
        <section className="py-20 md:py-32 bg-gradient-subtle">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">End User License Agreement</h1>
              <p className="text-xl text-muted-foreground">Last updated: April 2026</p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto prose prose-lg prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground">
              <h2>1. Acceptance of Agreement</h2>
              <p>
                This End User License Agreement ("EULA" or "Agreement") is a legal contract between you ("User", "you")
                and InvoiceIQ, developed by NANOCLONE Systems ("InvoiceIQ", "we", "us"), governing your use of the
                InvoiceIQ software, web application, edge functions, and related services (collectively, the
                "Software"). By accessing, installing, or using the Software, you agree to be bound by this EULA. If you
                do not agree, do not use the Software.
              </p>

              <h2>2. License Grant</h2>
              <p>
                Subject to your compliance with this EULA and any active subscription, InvoiceIQ grants you a limited,
                non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Software
                solely for your internal business or personal bookkeeping purposes.
              </p>

              <h2>3. Permitted Use</h2>
              <ul>
                <li>Connect your Google account to allow Gmail invoice detection and Google Drive storage.</li>
                <li>Connect your QuickBooks Online and/or Xero accounts to sync extracted invoice data.</li>
                <li>Upload invoice documents (PDF, HEIC, JPG, PNG) for AI-based extraction and categorization.</li>
                <li>Access automation workflows that file invoices into your accounting platform of choice.</li>
              </ul>

              <h2>4. Restrictions</h2>
              <p>You agree NOT to:</p>
              <ul>
                <li>Reverse engineer, decompile, or disassemble the Software.</li>
                <li>Resell, sublicense, rent, lease, or distribute the Software to third parties.</li>
                <li>Use the Software to process data you do not own or are not authorized to access.</li>
                <li>Attempt to bypass authentication, subscription gating, or rate limits.</li>
                <li>
                  Use the Software to violate any applicable law, including data protection (GDPR, CCPA) or financial
                  regulations.
                </li>
                <li>Upload malicious content, malware, or content that infringes third-party intellectual property.</li>
              </ul>

              <h2>5. Third-Party Integrations</h2>
              <p>
                The Software integrates with third-party services including, but not limited to, Google (Gmail, Drive,
                Sheets), Intuit QuickBooks Online, Xero, and Stripe. Your use of these integrations is governed by the
                respective terms and privacy policies of those providers:
              </p>
              <ul>
                <li>
                  <strong>Intuit QuickBooks:</strong> By connecting QuickBooks, you authorize InvoiceIQ to read and
                  write transaction, vendor, and account data on your behalf. Your use is also subject to the{" "}
                  <a
                    href="https://www.intuit.com/legal/terms/en-us/quickbooks/online/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Intuit Terms of Service
                  </a>
                  .
                </li>
                <li>
                  <strong>Xero:</strong> By connecting Xero, you authorize InvoiceIQ to access organization, contact,
                  and invoice data via the Xero API, subject to Xero's developer and end-user terms.
                </li>
                <li>
                  <strong>Google:</strong> By connecting Google, you grant InvoiceIQ scoped access to read invoice
                  emails and store/organize files in your Google Drive. InvoiceIQ's use of Google APIs adheres to the
                  Google API Services User Data Policy, including the Limited Use requirements.
                </li>
              </ul>
              <p>
                You may revoke any integration at any time from your account settings or directly from the third-party
                provider. InvoiceIQ is not responsible for the availability, behavior, or pricing of third-party
                services.
              </p>

              <h2>6. Data Ownership</h2>
              <p>
                You retain ownership of all data you upload or sync through the Software ("User Data"). You grant
                InvoiceIQ a limited license to process User Data solely to provide the Service. We do not sell your
                data, train public AI models on your data, or share it with advertisers.
              </p>

              <h2>7. AI Output Disclaimer</h2>
              <p>
                The Software uses AI to extract and categorize invoice information. While we strive for high accuracy,
                AI-generated output may contain errors. You are solely responsible for reviewing and verifying all
                extracted data, categorizations, and accounting entries before relying on them for tax, financial, or
                legal purposes. InvoiceIQ is not a substitute for a qualified accountant or tax professional.
              </p>

              <h2>8. Subscription, Fees, and Termination</h2>
              <p>
                Access to certain features requires an active paid subscription. Fees, billing cycles, and refund terms
                are described on the Pricing page and in our Terms of Service. We may suspend or terminate your license
                immediately if you breach this EULA, fail to pay fees, or misuse the Software.
              </p>

              <h2>9. Intellectual Property</h2>
              <p>
                The Software, including all code, design, branding, logos, and documentation, is the exclusive property
                of NANOCLONE Systems and is protected by copyright, trademark, and other intellectual property laws.
                This EULA does not transfer any ownership rights to you.
              </p>

              <h2>10. Disclaimer of Warranties</h2>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, INVOICEIQ AND NANOCLONE SYSTEMS SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE,
                DATA, OR GOODWILL ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SOFTWARE. OUR TOTAL AGGREGATE
                LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>

              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless InvoiceIQ, NANOCLONE Systems, and their affiliates from any
                claims, damages, or expenses arising from your misuse of the Software or violation of this EULA.
              </p>

              <h2>13. Modifications to the EULA</h2>
              <p>
                We may update this EULA from time to time. Material changes will be communicated via email or in-app
                notice. Continued use of the Software after the effective date constitutes acceptance of the revised
                terms.
              </p>

              <h2>14. Governing Law</h2>
              <p>
                This EULA shall be governed by and construed in accordance with the laws of the jurisdiction in which
                NANOCLONE Systems is registered, without regard to its conflict of law principles.
              </p>

              <h2>15. Contact</h2>
              <p>
                Questions about this EULA can be sent to our support team via the contact options listed on{" "}
                <a href="/about" className="text-primary hover:underline">
                  the About page
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EULA;
