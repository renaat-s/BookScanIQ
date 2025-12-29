import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatDialog from "@/components/ChatDialog";
import { N8nUploadResponse } from "@/types/document-capture";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DocumentCapture = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [userName, setUserName] = useState("there");
  const [receiptData, setReceiptData] = useState<Record<string, unknown> | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload documents.",
        variant: "destructive",
      });
      navigate("/detect-invoices");
    }
  }, [user, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("timestamp", new Date().toISOString());

      const { data, error } = await supabase.functions.invoke("upload-receipt", {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || "Upload failed");
      }

      const result: N8nUploadResponse = data;
      
      // Validate response structure
      if (typeof result !== 'object' || result === null) {
        throw new Error("Invalid response format from server");
      }
      
      // Check if categorization failed
      if (result.categorizationFailed || result.needsMoreInfo) {
        // Store receipt data for chat dialog
        if (result.receiptData) {
          setReceiptData(result.receiptData as Record<string, unknown>);
        }
        setShowChatDialog(true);
        if (result.userName) {
          setUserName(result.userName);
        }
      } else if (result.success !== false) {
        toast({
          title: "Success!",
          description: result.message || "Your invoice has been uploaded and categorized successfully",
        });
        handleClearImage();
      } else {
        throw new Error(result.message || "Upload processing failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Capture Invoice - InvoiceIQ</title>
        <meta name="description" content="Capture and upload invoices and receipts with InvoiceIQ's document capture tool" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Capture Invoice or Receipt</CardTitle>
                <CardDescription>
                  Take a photo or upload an image of your invoice or receipt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedImage ? (
                  <div className="space-y-4">
                    {/* Camera Capture - Mobile Optimized */}
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full h-32"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={32} />
                        <span className="text-lg">Take Photo</span>
                      </div>
                    </Button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* File Upload - Desktop Optimized */}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-32"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} />
                        <span className="text-lg">Upload from Device</span>
                      </div>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <p className="text-sm text-muted-foreground text-center">
                      Supported formats: JPG, PNG, HEIC (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedImage}
                        alt="Invoice preview"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleClearImage}
                      >
                        <X size={20} />
                      </Button>
                    </div>

                    {/* Upload Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleClearImage}
                        disabled={isUploading}
                      >
                        <X className="mr-2" size={18} />
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        className="flex-1"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        <Send className="mr-2" size={18} />
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      File: {file?.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Tips for Best Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Ensure the entire invoice is visible and in focus</li>
                  <li>• Use good lighting to avoid shadows</li>
                  <li>• Keep the camera parallel to the document</li>
                  <li>• Make sure all text is readable</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />

        <ChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          userName={userName}
          receiptData={receiptData}
          onCategorize={(category) => {
            toast({
              title: "Categorized!",
              description: `Receipt categorized as: ${category}`,
            });
            handleClearImage();
            setReceiptData(undefined);
            setShowChatDialog(false);
          }}
        />
      </div>
    </>
  );
};

export default DocumentCapture;
