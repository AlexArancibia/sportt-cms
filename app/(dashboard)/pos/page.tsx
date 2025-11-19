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

// Aspect ratio and crop size factor
const DESIRED_CROP_ASPECT_RATIO = 3 / 2;
const CROP_SIZE_FACTOR = 0.6;

type CartItem = {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku?: string | null;
};

export default function VirtualPOS() {
  const { toast } = useToast();
  const { products, fetchProductsByStore, createOrder, currentStore, fetchOrdersByStore, orders } = useMainStore();
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
        imageUrl: selectedVariant.imageUrls?.[0] || scannedProduct.imageUrls?.[0]
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
    setCart(cart.map(item => 
      item.variantId === variantId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Función auxiliar para extraer el número de orden
  const extractOrderNumber = (orderNumber: number | string | null | undefined): number | null => {
    if (typeof orderNumber === "number" && Number.isFinite(orderNumber)) {
      return orderNumber;
    }
    if (typeof orderNumber === "string") {
      const match = orderNumber.match(/\d+/g);
      if (match) {
        const parsed = Number.parseInt(match.join(""), 10);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  };

  // Función fallback para calcular el siguiente número desde las órdenes locales
  const getNextOrderNumber = (existingOrders: Array<{ orderNumber?: number | string | null; createdAt?: Date | string | null }>): number => {
    const STARTING_ORDER_NUMBER = 1000;
    
    if (!existingOrders || existingOrders.length === 0) {
      return STARTING_ORDER_NUMBER;
    }

    // Ordenar por fecha de creación (más reciente primero)
    const sortedOrders = [...existingOrders]
      .filter((order) => order.createdAt != null)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt!).getTime();
        const dateB = new Date(b.createdAt!).getTime();
        return dateB - dateA;
      });

    // Buscar el primer número válido
    for (const order of sortedOrders) {
      const orderNumber = extractOrderNumber(order.orderNumber);
      if (orderNumber !== null && orderNumber >= STARTING_ORDER_NUMBER) {
        return orderNumber + 1;
      }
    }

    return STARTING_ORDER_NUMBER;
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

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada",
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Obtener la última orden del servidor para calcular el siguiente número
      let nextOrderNumber = 1000;
      try {
        const latestOrderResponse = await fetchOrdersByStore(currentStore, { 
          sortBy: 'createdAt', 
          sortOrder: 'desc', 
          limit: 1 
        });
        const latestOrder = latestOrderResponse?.data?.[0];
        nextOrderNumber = latestOrder?.orderNumber 
          ? latestOrder.orderNumber + 1 
          : getNextOrderNumber(orders || []);
      } catch {
        // En caso de error, usar cálculo local
        nextOrderNumber = getNextOrderNumber(orders || []);
      }

      const orderData = {
        storeId: currentStore,
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

      const createdOrder = await createOrder(orderData);
      toast({
        title: "Pedido creado",
        description: `Pedido #${createdOrder.orderNumber} creado con éxito`,
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
      setError("Unable to access the camera. Please check permissions.");
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
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">POS Virtual</h1>
        <Button 
          onClick={togglePOS}
          variant={isPOSActive ? "destructive" : "default"}
        >
          {isPOSActive ? "Desactivar POS" : "Activar POS"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Escanear Producto</h2>
          
          {isPOSActive ? (
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg border"
              />
              <div
                ref={cropOverlayRef}
                className="absolute border-2 border-white rounded-lg pointer-events-none"
              ></div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center h-64">
              <p className="text-gray-500">POS desactivado</p>
            </div>
          )}

          <canvas
            ref={displayCroppedCanvasRef}
            className="hidden"
          />

          {barcodeResult && (
            <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4">
              Código escaneado: {barcodeResult}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div className="bg-white rounded-lg shadow p-4">
          {scannedProduct ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Producto Escaneado</h2>
              
              <div className="mb-4">
                <h3 className="font-medium">{scannedProduct.title}</h3>
                {scannedProduct.variants.length > 1 && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-1">Variante:</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = scannedProduct.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                    >
                      {scannedProduct.variants.map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title} - S/ {getVariantPrice(variant).toFixed(2)}
                          {variant.sku && ` (SKU: ${variant.sku})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cantidad:</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              <Button onClick={addToCart} className="w-full">
                Añadir al Pedido
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isPOSActive 
                ? "Escanee un código de barras para ver los detalles del producto" 
                : "Active el POS para escanear productos"}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Pedido Actual</h2>
        
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay productos en el pedido
          </div>
        ) : (
          <>
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.variantId} className="py-3 flex items-center">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded mr-4"
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="text-sm text-gray-600">
                      <p>S/ {item.price.toFixed(2)}</p>
                      {item.sku && <p>SKU: {item.sku}</p>}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="mx-2 w-8 text-center">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 text-red-500"
                      onClick={() => removeFromCart(item.variantId)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>S/ {calculateTotal().toFixed(2)}</span>
              </div>

              <Button 
                onClick={handleCreateOrder} 
                className="w-full mt-4"
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? "Creando Pedido..." : "Crear Pedido"}
              </Button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}