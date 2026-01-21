import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";

import { FileText, Upload, X, Check, Loader2, FileUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const FileInvoices = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, HEIC, or image file (JPEG, PNG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadSuccess(false);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', selectedFile.name);
      formData.append('timestamp', new Date().toISOString());

      const { error } = await supabase.functions.invoke('file-invoice', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      setUploadSuccess(true);
      toast({
        title: "Invoice Filed Successfully",
        description: "Your invoice has been archived and logged.",
      });

      // Reset after delay
      setTimeout(() => {
        handleClearFile();
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred while filing your invoice.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <>
        <Helmet>
          <title>File Invoices | InvoiceIQ</title>
          <meta name="description" content="File your invoices and log transactions securely with InvoiceIQ." />
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center px-4 py-16">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to file your invoices and log transactions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={handleSignIn} variant="hero" size="lg">
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>File Invoices | InvoiceIQ</title>
        <meta name="description" content="File your invoices and log transactions securely with InvoiceIQ." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                File Invoices & Log Transactions
              </h1>
              <p className="text-muted-foreground">
                Upload your invoices to archive them in Google Drive and log transaction data to Google Sheets.
              </p>
            </div>

            {/* Upload Card */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileUp className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-lg font-medium text-foreground mb-1">
                      Click to upload invoice
                    </span>
                    <span className="text-sm text-muted-foreground mb-4">
                      PDF, HEIC, JPEG, PNG, or WEBP (max 10MB)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.heic,.heif,.jpg,.jpeg,.png,.webp,application/pdf,image/heic,image/heif,image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button variant="hero-secondary" size="lg" className="pointer-events-none">
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </label>
                ) : (
                  <div className="space-y-6">
                    {/* File Preview */}
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                        </p>
                      </div>
                      {!isUploading && !uploadSuccess && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearFile}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Upload Status */}
                    {uploadSuccess ? (
                      <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          Invoice filed successfully!
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          onClick={handleClearFile}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="hero"
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Filing Invoice...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              File Invoice
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    Upload your invoice document (PDF or image)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    Our system archives the file to your connected Google Drive
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    Transaction data is automatically logged to your Google Sheet
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FileInvoices;
