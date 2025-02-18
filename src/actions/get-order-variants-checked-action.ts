'use server';

import { db } from '@/firebase/db';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { fetchOrderDetailAction } from './fetch-order-detail-action';

type OrderVariantsCheckedViewModel = {
  type: 'success';
  data: {
    checkedCount: number;
    totalCount: number;
  };
} | {
  type: 'error';
  message: string;
};

export const getOrderVariantsCheckedAction = async (
  orderId: string,
): Promise<OrderVariantsCheckedViewModel> => {
  try {
    // Récupérer les détails de la commande pour calculer le nombre total de variantes
    const orderResult = await fetchOrderDetailAction(orderId);
    if (orderResult.type === 'error') {
      return {
        type: 'error',
        message: orderResult.message,
      };
    }

    // Calculer le nombre total de variantes
    const totalCount = orderResult.data.products.reduce((acc, product) => {
      return acc + product.quantity;
    }, 0);

    // Si pas de variantes, retourner 0/0
    if (totalCount === 0) {
      return {
        type: 'success',
        data: {
          checkedCount: 0,
          totalCount: 0,
        },
      };
    }

    // Récupérer toutes les variantes cochées de la commande
    const variantsRef = collection(db, 'variants-ordered');
    const q = query(variantsRef, where('orderId', '==', orderId), where('checked', '==', true));
    const querySnapshot = await getDocs(q);

    return {
      type: 'success',
      data: {
        checkedCount: querySnapshot.size,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error checking variants:', error);
    return {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
