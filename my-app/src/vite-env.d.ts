/// <reference types="vite/client" />

declare module "leaflet/dist/images/*.png" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}
