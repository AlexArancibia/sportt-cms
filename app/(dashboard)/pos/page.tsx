"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMainStore } from "@/stores/mainStore";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { ProductVariant } from "@/types/productVariant";
import { ProductStatus } from "@/types/common";
import { Currency } from "@/types/currency";

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.6; // Aumentado para hacer el recuadro más grande

type CartItem = {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku?: string | null;
  inventoryQuantity?: number;
};

// Colores globales
const COLORS = {
  primary: 'bg-blue-600',
  primaryHover: 'hover:bg-blue-700',
  secondary: 'bg-gray-200',
  secondaryHover: 'hover:bg-gray-300',
  success: 'bg-green-600',
  successHover: 'hover:bg-green-700',
  danger: 'bg-red-600',
  dangerHover: 'hover:bg-red-700',
  textPrimary: 'text-gray-800',
  textSecondary: 'text-gray-600',
  textLight: 'text-white',
  border: 'border-gray-300',
};

export default function VirtualPOS() {
  const { toast } = useToast();
  const { products, fetchProductsByStore, createOrder, currentStore } = useMainStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCroppedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPOSActive, setIsPOSActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "cart">("scanner");
  const codeReader = useRef(new BrowserMultiFormatReader());
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Load products when store changes
  useEffect(() => {
    if (currentStore) {
      fetchProductsByStore(currentStore);
    }
  }, [currentStore, fetchProductsByStore]);

  // Handle barcode scan result
  useEffect(() => {
    if (barcodeResult && products.length > 0) {
      findProductByBarcode(barcodeResult);
    }
  }, [barcodeResult, products]);

  const findProductByBarcode = (barcode: string) => {
    let foundVariant: ProductVariant | null = null;
    let foundProduct: Product | null = null;

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
    return parseFloat(variant.prices[0].price.toString());
  };

  const addToCart = () => {
    if (!selectedVariant || !scannedProduct) return;

    const existingItemIndex = cart.findIndex(item => item.variantId === selectedVariant.id);

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      const price = getVariantPrice(selectedVariant);
      
      const newItem: CartItem = {
        variantId: selectedVariant.id,
        productId: scannedProduct.id,
        title: `${scannedProduct.title} - ${selectedVariant.title}`,
        price: price,
        quantity: quantity,
        sku: selectedVariant.sku || null,
        imageUrl: selectedVariant.imageUrls?.[0] || scannedProduct.imageUrls?.[0],
        inventoryQuantity: selectedVariant.inventoryQuantity
      };
      setCart([...cart, newItem]);
    }

    setScannedProduct(null);
    setSelectedVariant(null);
    setBarcodeResult(null);
    setQuantity(1);
    toast({
      title: "Añadido al carrito",
      description: `${quantity} x ${scannedProduct.title}`,
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter(item => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const cartItem = cart.find(item => item.variantId === variantId);
    if (cartItem && cartItem.inventoryQuantity !== undefined && newQuantity > cartItem.inventoryQuantity) {
      if (!scannedProduct?.allowBackorder) {
        newQuantity = cartItem.inventoryQuantity;
      }
    }
    setCart(cart.map(item => 
      item.variantId === variantId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El carrito está vacío",
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      const orderData = {
        storeId: currentStore,
        orderNumber: Math.floor(1000 + Math.random() * 9000),
        customerInfo: {
          firstName: "Cliente",
          lastName: "POS Virtual",
          email: "pos@virtual.com",
          phone: "000000000",
          isAuthenticated: false
        },
        currencyId: "curr_795fd17e-128e",
        lineItems: cart.map(item => ({
          variantId: item.variantId,
          title: item.title,
          quantity: item.quantity,
          price: item.price.toString(),
          totalDiscount: "0"
        })),
        financialStatus: "PAID",
        fulfillmentStatus: "FULFILLED",
        shippingStatus: "DELIVERED",
        source: "pos",
        totalPrice: calculateTotal().toString(),
        subtotalPrice: calculateTotal().toString(),
        totalTax: "0",
        totalDiscounts: "0"
      };

      await createOrder(orderData);
      toast({
        title: "Pedido creado",
        description: `Pedido #${orderData.orderNumber} creado con éxito`,
      });
      setCart([]);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el pedido",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const togglePOS = () => {
    if (isPOSActive) {
      // Stop camera and scanning
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setIsPOSActive(false);
    } else {
      // Start camera and scanning
      startCamera();
      setIsPOSActive(true);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          intervalIdRef.current = setInterval(captureFrameAndCrop, 100);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("No se pudo acceder a la cámara. Por favor verifica los permisos.");
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
    overlayDiv.style.border = '4px solid white';
    overlayDiv.style.borderRadius = '0.5rem';
    overlayDiv.style.pointerEvents = 'none';
    overlayDiv.style.boxSizing = 'border-box';
    overlayDiv.style.boxShadow = '0 0 0 100vmax rgba(0, 0, 0, 0.5)';

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className={`${COLORS.primary} text-white p-4 shadow-md`}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">POS Móvil</h1>
          <Button 
            onClick={togglePOS}
            variant={isPOSActive ? "destructive" : "outline"}
            size="sm"
            className={`${isPOSActive ? COLORS.danger : 'bg-white text-blue-600'}`}
          >
            {isPOSActive ? "Apagar" : "Encender"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          className={`flex-1 py-3 font-medium ${activeTab === "scanner" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("scanner")}
        >
          Escanear
        </button>
        <button
          className={`flex-1 py-3 font-medium ${activeTab === "cart" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("cart")}
        >
          Pedido ({cart.length})
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "scanner" ? (
          <div className="flex flex-col h-full">
            {/* Scanner Section */}
            <div className="flex-1 bg-black relative">
              {isPOSActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div
                    ref={cropOverlayRef}
                    className="absolute border-4 border-white rounded-lg pointer-events-none shadow-lg"
                    style={{
                      boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.5)'
                    }}
                  ></div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white p-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg font-medium">POS desactivado</p>
                  <p className="text-gray-300 mt-1">Presiona "Encender" para comenzar a escanear</p>
                </div>
              )}

              <canvas
                ref={displayCroppedCanvasRef}
                className="hidden"
              />
            </div>

            {/* Product Info Section */}
            {scannedProduct && (
              <div className="bg-white p-4 border-t shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{scannedProduct.title}</h2>
                    {scannedProduct.vendor && (
                      <p className="text-sm text-gray-500">Proveedor: {scannedProduct.vendor}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setScannedProduct(null);
                      setBarcodeResult(null);
                    }}
                    className="text-gray-500"
                  >
                    ✕
                  </button>
                </div>

                {selectedVariant && (
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Inventario:</span>
                      <span className={selectedVariant.inventoryQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {selectedVariant.inventoryQuantity} unidades
                      </span>
                    </div>
                    {selectedVariant.sku && (
                      <div className="flex justify-between">
                        <span className="font-medium">SKU:</span>
                        <span>{selectedVariant.sku}</span>
                      </div>
                    )}
                    {selectedVariant.weightValue && (
                      <div className="flex justify-between">
                        <span className="font-medium">Peso:</span>
                        <span>{selectedVariant.weightValue} kg</span>
                      </div>
                    )}
                  </div>
                )}

                {scannedProduct.variants.length > 1 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Variante:</label>
                    <select
                      className="w-full p-2 border rounded bg-white"
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = scannedProduct.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                    >
                      {scannedProduct.variants.map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title} - S/ {getVariantPrice(variant).toFixed(2)}
                          {variant.sku && ` (${variant.sku})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border rounded-lg text-xl"
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min="1"
                      max={selectedVariant?.inventoryQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="mx-2 w-16 text-center"
                    />
                    <button 
                      onClick={() => {
                        const max = selectedVariant?.inventoryQuantity || Infinity;
                        setQuantity(Math.min(max, quantity + 1))
                      }}
                      className="w-10 h-10 flex items-center justify-center border rounded-lg text-xl"
                    >
                      +
                    </button>
                  </div>
                  <Button 
                    onClick={addToCart} 
                    className={`${COLORS.primary} ${COLORS.primaryHover} flex-1 ml-4 py-2`}
                    disabled={!selectedVariant || (selectedVariant.inventoryQuantity <= 0 && !scannedProduct.allowBackorder)}
                  >
                    {selectedVariant?.inventoryQuantity && selectedVariant?.inventoryQuantity <= 0 && !scannedProduct.allowBackorder ? 
                      "Sin stock" : "Añadir"}
                  </Button>
                </div>
                {selectedVariant?.inventoryQuantity && selectedVariant?.inventoryQuantity <= 0 && scannedProduct.allowBackorder && (
                  <p className="text-xs text-yellow-600 mt-1">Producto en backorder</p>
                )}
              </div>
            )}

            {/* Feedback de escaneo */}
            {barcodeResult && !scannedProduct && (
              <div className="bg-yellow-50 text-yellow-800 p-3 text-center">
                Buscando producto: {barcodeResult}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cart Section */}
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg">No hay productos en el pedido</p>
                  <p className="text-sm mt-1">Escanea productos para comenzar</p>
                  <Button 
                    onClick={() => setActiveTab("scanner")}
                    className={`mt-4 ${COLORS.primary} ${COLORS.primaryHover}`}
                  >
                    Ir al Escáner
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.variantId} className="bg-white p-3 rounded-lg shadow-sm border flex">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded mr-3"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-blue-600 font-semibold">S/ {item.price.toFixed(2)}</p>
                          <div className="text-xs text-gray-500 space-y-1 mt-1">
                            {item.sku && <p>SKU: {item.sku}</p>}
                            {item.inventoryQuantity !== undefined && (
                              <p>Stock: {item.inventoryQuantity}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center mt-2">
                            <button 
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border rounded-lg"
                            >
                              -
                            </button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                              className="mx-2 w-12 text-center"
                            />
                            <button 
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border rounded-lg"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.variantId)}
                              className="ml-auto text-red-500"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between font-semibold text-lg mb-4">
                      <span>Total:</span>
                      <span>S/ {calculateTotal().toFixed(2)}</span>
                    </div>

                    <Button 
                      onClick={handleCreateOrder} 
                      className={`w-full ${COLORS.success} ${COLORS.successHover} py-3 text-lg`}
                      disabled={isCreatingOrder}
                    >
                      {isCreatingOrder ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </span>
                      ) : (
                        "Finalizar Pedido"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden flex bg-white border-t">
        <button
          className={`flex-1 py-3 flex flex-col items-center ${activeTab === "scanner" ? "text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("scanner")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs mt-1">Escanear</span>
        </button>
        <button
          className={`flex-1 py-3 flex flex-col items-center ${activeTab === "cart" ? "text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("cart")}
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Pedido</span>
        </button>
      </div>
    </div>
  );
}