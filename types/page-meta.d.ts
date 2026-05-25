declare module '#app' {
  interface PageMeta {
    /** Permisos requeridos (basta con tener uno de la lista). */
    permissions?: string[];
  }
}

export {};
