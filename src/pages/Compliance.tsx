import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Server, Eye, FileCheck, Database } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Compliance = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Security & Compliance - InvoiceIQ Data Protection</title>
        <meta name="description" content="InvoiceIQ security measures: AES-256 encryption, GDPR compliance, EU/UK data hosting, and enterprise-grade data protection for your financial information." />
        <meta name="keywords" content="invoice security, GDPR compliance, data encryption, financial data protection, secure invoice processing" />
        <link rel="canonical" href="https://invoiceiq.com/compliance" />
      </Helmet>
      <Header />
      <main>
        <section className="py-20 md:py-32 bg-gradient-subtle">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                  <Shield className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">Security & Data Protection</h1>
              <p className="text-xl text-muted-foreground">
                Your financial data is protected with enterprise-grade security
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Encryption</h2>
                      <p className="text-muted-foreground">
                        All data is encrypted both in transit and at rest using industry-standard AES-256 encryption. Your invoice data, bank statements, and financial information are secured with the same level of encryption used by major financial institutions.
                      </p>
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>TLS 1.3 encryption for all data in transit</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>AES-256 encryption for data at rest</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Encrypted database backups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Secure API key management with n8n encryption</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">GDPR Compliance</h2>
                      <p className="text-muted-foreground">
                        InvoiceIQ is fully GDPR compliant. We respect your privacy and give you complete control over your data.
                      </p>
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Right to access your data at any time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Right to deletion - we permanently delete your data upon request</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Data portability - export all your data in standard formats</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Transparent data processing practices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Data Processing Agreements available for enterprise customers</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Data Privacy</h2>
                      <p className="text-muted-foreground">
                        Your invoice data belongs to you, and only you.
                      </p>
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>No data selling:</strong> We will never sell or share your invoice data with third parties</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>No advertising:</strong> Your data is not used for targeted advertising</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Minimal data collection:</strong> We only collect what's necessary to provide the service</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Anonymized analytics:</strong> Usage statistics are fully anonymized</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Infrastructure & Hosting</h2>
                      <p className="text-muted-foreground mb-4">
                        Your data is hosted on secure, GDPR-compliant servers located in the EU and UK.
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Self-hosted Docker infrastructure:</strong> Complete control over data location</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>EU/UK data centers:</strong> All data stored within GDPR jurisdiction</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Regular security audits:</strong> Infrastructure is regularly tested and updated</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong>Automated backups:</strong> Daily encrypted backups with 30-day retention</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Data Retention</h2>
                      <p className="text-muted-foreground">
                        We only keep your data as long as you need it.
                      </p>
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Active data retained while your subscription is active</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>30-day grace period after cancellation (in case you change your mind)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Permanent deletion after 30 days of cancellation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>Immediate deletion available upon request</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-12 p-8 bg-primary/5 rounded-lg text-center">
                <h3 className="text-xl font-bold mb-4">Questions about our security?</h3>
                <p className="text-muted-foreground mb-6">
                  We're happy to provide additional security documentation or answer specific questions about our compliance measures.
                </p>
                <a 
                  href="mailto:security@invoiceiq.com" 
                  className="inline-block text-primary font-semibold hover:underline"
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