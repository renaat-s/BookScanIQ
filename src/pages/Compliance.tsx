import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Lock, Server, Eye, FileCheck, Database } from "lucide-react";
import { Helmet } from "react-helmet-async";

const sections = [
  {
    icon: Lock,
    title: "Encryption",
    intro:
      "All data is encrypted both in transit and at rest using industry-standard AES-256 encryption. Your invoice data, bank statements, and financial information are secured with the same level of encryption used by major financial institutions.",
    points: [
      "TLS 1.3 encryption for all data in transit",
      "AES-256 encryption for data at rest",
      "Encrypted database backups",
      "Secure API key management with n8n encryption",
    ],
  },
  {
    icon: FileCheck,
    title: "GDPR Compliance",
    intro: "InvoiceIQ is fully GDPR compliant. We respect your privacy and give you complete control over your data.",
    points: [
      "Right to access your data at any time",
      "Right to deletion — we permanently delete your data upon request",
      "Data portability — export all your data in standard formats",
      "Transparent data processing practices",
      "Data Processing Agreements available for enterprise customers",
    ],
  },
  {
    icon: Eye,
    title: "Data Privacy",
    intro: "Your invoice data belongs to you, and only you.",
    points: [
      "No data selling: We will never sell or share your invoice data with third parties",
      "No advertising: Your data is not used for targeted advertising",
      "Minimal data collection: We only collect what's necessary to provide the service",
      "Anonymized analytics: Usage statistics are fully anonymized",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure & Hosting",
    intro: "Your data is hosted on secure, GDPR-compliant servers located in the EU and UK.",
    points: [
      "Self-hosted Docker infrastructure: Complete control over data location",
      "EU/UK data centers: All data stored within GDPR jurisdiction",
      "Regular security audits: Infrastructure is regularly tested and updated",
      "Automated backups: Daily encrypted backups with 30-day retention",
    ],
  },
  {
    icon: Database,
    title: "Data Retention",
    intro: "We only keep your data as long as you need it.",
    points: [
      "Active data retained while your subscription is active",
      "30-day grace period after cancellation (in case you change your mind)",
      "Permanent deletion after 30 days of cancellation",
      "Immediate deletion available upon request",
    ],
  },
];

const Compliance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Security & Compliance - InvoiceIQ Data Protection</title>
        <meta name="description" content="InvoiceIQ security measures: AES-256 encryption, GDPR compliance, EU/UK data hosting, and enterprise-grade data protection for your financial information." />
        <meta name="keywords" content="invoice security, GDPR compliance, data encryption, financial data protection, secure invoice processing" />
        <link rel="canonical" href="https://invoice-iq.com/compliance" />
      </Helmet>
      <Header />
      <main className="bg-gradient-subtle">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant flex items-center justify-center">
                <Shield className="w-9 h-9 text-violet-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight py-1">
                Security & Data Protection
              </h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
              <p className="text-lg text-muted-foreground font-light tracking-[-0.005em] max-w-xl mx-auto leading-relaxed">
                Your financial data is protected with enterprise-grade security
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {sections.map(({ icon: Icon, title, intro, points }) => (
                <article
                  key={title}
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-elegant hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 p-8 md:p-10"
                >
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-violet-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h2 className="text-2xl font-light tracking-tight text-foreground">{title}</h2>
                      <p className="text-muted-foreground font-light leading-relaxed">{intro}</p>
                      <ul className="space-y-2">
                        {points.map((p) => (
                          <li key={p} className="flex items-start gap-3 text-muted-foreground font-light leading-relaxed">
                            <span className="text-violet-500 mt-1.5 text-xs">●</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}

              <div className="mt-10 p-8 md:p-10 bg-gradient-to-br from-violet-500/10 via-card/60 to-fuchsia-500/10 backdrop-blur-sm border border-violet-500/20 rounded-3xl shadow-elegant text-center">
                <h3 className="text-xl font-light tracking-tight mb-3">Questions about our security?</h3>
                <p className="text-muted-foreground font-light mb-6 max-w-xl mx-auto leading-relaxed">
                  We're happy to provide additional security documentation or answer specific questions about our compliance measures.
                </p>
                <a
                  href="mailto:info@invoice-iq.com"
                  className="inline-block text-violet-500 hover:text-violet-400 transition-colors font-light"
                >
                  Contact Security Team →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Compliance;
