"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMainStore } from "@/stores/mainStore";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { ProductVariant } from "@/types/productVariant";
import { ScanLine } from "lucide-react";

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.6;

interface POSScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCurrency: string;
  onProductScanned: (product: Product, variant: ProductVariant, quantity: number) => void;
}

export function POSScannerDialog({
  open,
  onOpenChange,
  selectedCurrency,
  onProductScanned,
}: POSScannerDialogProps) {
  const { toast } = useToast();
  const { products, fetchProductsByStore, currentStore } = useMainStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Load products when store changes
  useEffect(() => {
    if (currentStore && open) {
      fetchProductsByStore(currentStore);
    }
  }, [currentStore, fetchProductsByStore, open]);

  // Handle barcode scan result
  useEffect(() => {
    if (barcodeResult && products.length > 0) {
      findProductByBarcode(barcodeResult);
    }
  }, [barcodeResult, products]);

  // Reset state when dialog closes and cleanup on unmount
  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannedProduct(null);
      setSelectedVariant(null);
      setBarcodeResult(null);
      setQuantity(1);
      setError(null);
      setIsScannerActive(false);
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  const findProductByBarcode = (barcode: string) => {
    let foundVariant: ProductVariant | null = null;
    let foundProduct: Product | null = null;

    // Buscar por SKU
    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.sku === barcode) {
          foundVariant = variant;
          foundProduct = product;
          break;
        }
      }
      if (foundVariant) break;
    }

    // Buscar por variant ID
    if (!foundVariant) {
      for (const product of products) {
        const variant = product.variants.find(v => v.id === barcode);
        if (variant) {
          foundVariant = variant;
          foundProduct = product;
          break;
        }
      }
    }

    // Buscar por product ID
    if (!foundVariant) {
      const product = products.find(p => p.id === barcode);
      if (product) {
        foundProduct = product;
        if (product.variants.length === 1) {
          foundVariant = product.variants[0];
        }
      }
    }

    if (foundProduct) {
      setScannedProduct(foundProduct);
      if (foundVariant) {
        setSelectedVariant(foundVariant);
      } else if (foundProduct.variants.length > 0) {
        setSelectedVariant(foundProduct.variants[0]);
      }
      toast({
        title: "Producto encontrado",
        description: foundProduct.title,
      });
      // Continuar escaneando (no detener la cámara)
    } else {
      toast({
        variant: "destructive",
        title: "Producto no encontrado",
        description: `No se encontró un producto con código ${barcode}`,
      });
    }
  };

  const getVariantPrice = (variant: ProductVariant): number => {
    if (!variant.prices || variant.prices.length === 0) return 0;
    const price = variant.prices.find(p => p.currencyId === selectedCurrency);
    if (price) {
      return parseFloat(price.price.toString());
    }
    return parseFloat(variant.prices[0].price.toString());
  };

  const handleAddProduct = () => {
    if (!selectedVariant || !scannedProduct) return;

    onProductScanned(scannedProduct, selectedVariant, quantity);
    
    toast({
      title: "Producto añadido",
      description: `${quantity} x ${scannedProduct.title}`,
    });

    // Reset para escanear otro producto
    setScannedProduct(null);
    setSelectedVariant(null);
    setBarcodeResult(null);
    setQuantity(1);
    
    // El escáner continúa activo, no necesita reiniciarse
  };

  const startCamera = async () => {
    try {
      // Pequeño delay para asegurar que el video está montado en el DOM del Dialog
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        setError("El elemento de video no está disponible");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
            intervalIdRef.current = setInterval(captureFrameAndCrop, 100);
          }
        };
      }
      setIsScannerActive(true);
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("No se puede acceder a la cámara. Por favor, verifica los permisos.");
      setIsScannerActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsScannerActive(false);
  };

  const toggleScanner = () => {
    if (isScannerActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const captureFrameAndCrop = () => {
    if (!videoRef.current || !displayCroppedCanvasRef.current || !cropOverlayRef.current) return;

    const video = videoRef.current;
    const displayCanvas = displayCroppedCanvasRef.current;
    const displayContext = displayCanvas.getContext("2d");
    const overlayDiv = cropOverlayRef.current;

    if (!displayContext) return;

    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    let cropWidth, cropHeight;
    const videoRatio = video.videoWidth / video.videoHeight;

    if (videoRatio / DESIRED_CROP_ASPECT_RATIO > 1) {
      cropHeight = video.videoHeight * CROP_SIZE_FACTOR;
      cropWidth = cropHeight * DESIRED_CROP_ASPECT_RATIO;
    } else {
      cropWidth = video.videoWidth * CROP_SIZE_FACTOR;
      cropHeight = cropWidth / DESIRED_CROP_ASPECT_RATIO;
    }

    cropWidth = Math.min(cropWidth, video.videoWidth);
    cropHeight = Math.min(cropHeight, video.videoHeight);

    const MIN_CROP_WIDTH = 240;
    const MAX_CROP_WIDTH = 600;
    const MIN_CROP_HEIGHT = 80;
    const MAX_CROP_HEIGHT = 400;

    cropWidth = Math.max(MIN_CROP_WIDTH, Math.min(MAX_CROP_WIDTH, cropWidth));
    cropHeight = Math.max(MIN_CROP_HEIGHT, Math.min(MAX_CROP_HEIGHT, cropHeight));

    const cropX = (video.videoWidth - cropWidth) / 2;
    const cropY = (video.videoHeight - cropHeight) / 2;

    displayCanvas.width = cropWidth;
    displayCanvas.height = cropHeight;

    displayContext.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    overlayDiv.style.position = 'absolute';
    overlayDiv.style.left = `${(cropX / video.videoWidth) * 100}%`;
    overlayDiv.style.top = `${(cropY / video.videoHeight) * 100}%`;
    overlayDiv.style.width = `${(cropWidth / video.videoWidth) * 100}%`;
    overlayDiv.style.height = `${(cropHeight / video.videoHeight) * 100}%`;
    overlayDiv.style.border = '2px solid white';
    overlayDiv.style.borderRadius = '0.5rem';
    overlayDiv.style.pointerEvents = 'none';
    overlayDiv.style.boxSizing = 'border-box';

    const decodeCanvas = async () => {
      try {
        const result: Result = await codeReader.current.decodeFromCanvas(displayCanvas);
        console.log("Decoded barcode:", result.getText());
        setBarcodeResult(result.getText());
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotFoundException") {
          console.error("Decoding error:", err);
        }
      }
    };

    decodeCanvas();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Escanear Código de Barras (POS)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Scanner Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Escáner de Código de Barras</Label>
              <Button
                type="button"
                variant={isScannerActive ? "destructive" : "default"}
                size="sm"
                onClick={toggleScanner}
              >
                {isScannerActive ? "Detener" : "Iniciar"}
              </Button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden min-h-[400px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full min-h-[400px] object-cover ${isScannerActive ? '' : 'hidden'}`}
                style={{ maxHeight: '400px' }}
              />
              <div
                ref={cropOverlayRef}
                className={`absolute border-2 border-white rounded-lg pointer-events-none ${isScannerActive ? '' : 'hidden'}`}
              ></div>
              {!isScannerActive && (
                <div className="bg-muted rounded-lg flex items-center justify-center h-[400px] absolute inset-0">
                  <div className="text-center text-muted-foreground">
                    <ScanLine className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Presiona "Iniciar" para activar el escáner</p>
                  </div>
                </div>
              )}
            </div>

            <canvas
              ref={displayCroppedCanvasRef}
              className="hidden"
            />

            {barcodeResult && (
              <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-3 rounded-lg">
                <p className="text-sm font-medium">Código escaneado:</p>
                <p className="text-sm">{barcodeResult}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            {scannedProduct ? (
              <>
                <div>
                  <Label className="text-base font-semibold">Producto Escaneado</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <h3 className="font-medium">{scannedProduct.title}</h3>
                  </div>
                </div>

                {scannedProduct.variants.length > 1 && (
                  <div>
                    <Label htmlFor="variant-select">Variante:</Label>
                    <select
                      id="variant-select"
                      className="w-full mt-1 p-2 border rounded-lg bg-background"
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = scannedProduct.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                    >
                      {scannedProduct.variants.map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title} - {getVariantPrice(variant).toFixed(2)}
                          {variant.sku && ` (SKU: ${variant.sku})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="quantity">Cantidad:</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1"
                  />
                </div>

                <Button onClick={handleAddProduct} className="w-full">
                  Añadir al Pedido
                </Button>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ScanLine className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Escanea un código de barras para ver los detalles del producto</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
