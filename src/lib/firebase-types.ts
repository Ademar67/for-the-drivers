// This file contains TypeScript types for your Firestore data model.
// It is generated based on the entities defined in your backend.json file.
import type { Timestamp } from "firebase/firestore";

/**
 * Represents a customer of Liqui Moly.
 */
export interface Cliente {
  id: string; // Unique identifier for the Cliente entity.
  nombre: string; // Name of the customer.
  direccion?: string; // Address of the customer.
  telefono?: string; // Phone number of the customer.
  email?: string; // Email address of the customer.
  nit?: string; // NIT (Tax ID) of the customer.
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Represents a follow-up activity with a customer or prospect.
 */
export interface Seguimiento {
  id: string; // Unique identifier for the Seguimiento entity.
  clienteId: string; // Reference to Cliente. (Relationship: Cliente 1:N Seguimiento)
  fecha: string; // Date of the follow-up activity.
  descripcion?: string; // Description of the follow-up activity.
  estado?: string; // Status of the follow-up activity (e.g., pending, completed).
}

/**
 * Represents a customer order.
 */
export interface Pedido {
  id: string; // Unique identifier for the Pedido entity.
  clienteId: string; // Reference to Cliente. (Relationship: Cliente 1:N Pedido)
  fecha: string; // Date of the order.
  total: number; // Total amount of the order.
  estado?: string; // Status of the order (e.g., pending, processed, shipped).
}

/**
 * Represents an invoice for a customer order.
 */
export interface Factura {
  id: string; // Unique identifier for the Factura entity.
  pedidoId: string; // Reference to Pedido. (Relationship: Pedido 1:1 Factura)
  fecha: string; // Date of the invoice.
  monto: number; // Amount of the invoice.
  estado?: string; // Status of the invoice (e.g., paid, unpaid).
}

/**
 * Represents a Liqui Moly product.
 */
export interface Producto {
  id: string; // Unique identifier for the Producto entity.
  nombre: string; // Name of the product.
  descripcion?: string; // Description of the product.
  precio: number; // Price of the product.
  imagenUrl?: string; // URL of the product image.
}

/**
 * Represents the many-to-many relation between Pedido and Producto
 */
export interface PedidoProducto {
  id: string; // Unique identifier for the PedidoProducto entity.
  pedidoId: string; // Reference to Pedido. (Relationship: Pedido N:N Producto)
  productoId: string; // Reference to Producto. (Relationship: Pedido N:N Producto)
  cantidad: number; // Amount of the product in the order
}
