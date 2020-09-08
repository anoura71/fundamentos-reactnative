import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';


interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}


interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}


const CartContext = createContext<CartContext | null>(null);


const CartProvider: React.FC = ({ children }) => {


  const [products, setProducts] = useState<Product[]>([]);


  useEffect(() => {

    /** Carregar itens a partir da Async Storage. */
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products'
      );
      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);


  /** Adicionar novo item ao carrinho. */
  const addToCart = useCallback(async product => {
    // Verifica se o produto já está no carrinho
    const productAlreadyInCart = products.find(p => p.id === product.id);
    let updatedProducts: Product[] = [];
    if (productAlreadyInCart) {
      // Se já existir, incrementa a quantidade do produto no carrinho
      updatedProducts = products.map(p => p.id === product.id
        ? { ...product, quantity: p.quantity + 1 }
        : p
      );
    } else {
      // Se não existir, inclui o produto no carrinho (quantidade = 1)
      updatedProducts = [...products, {
        ...product,
        quantity: 1,
      }];
    }
    setProducts(updatedProducts);

    // Atualiza a Async Storage
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products)
    );
  }, [products]);


  /** Incrementa em 1 unidade a quantidade do produto no carrinho. */
  const increment = useCallback(async id => {

    // Percorre o array e incrementa a quantidade do elemento selecionado
    const updatedProducts = products.map(product =>
      product.id === id
        ? { ...product, quantity: product.quantity + 1 }
        : product
    );
    setProducts(updatedProducts);

    // Atualiza a Async Storage
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(updatedProducts)
    );
  }, [products]);


  /** Decrementa em 1 unidade a quantidade do produto no carrinho.
   * Se a quantidade for zerada, remove o item do carrinho.
   */
  const decrement = useCallback(async id => {

    // Percorre o array e decrementa a quantidade do elemento selecionado
    const updatedProducts = products
      .map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product
      )
      .filter(product => product.quantity !== 0);
    setProducts(updatedProducts);

    // Atualiza a Async Storage
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(updatedProducts)
    );
  }, [products]);


  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );


  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};


function useCart(): CartContext {

  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}


export { CartProvider, useCart };
