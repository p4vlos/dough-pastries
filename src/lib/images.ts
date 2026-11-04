import type { ImageMetadata } from 'astro';

const photos = import.meta.glob<{ default: ImageMetadata }>('../assets/menu/*.jpg', { eager: true });
const cutouts = import.meta.glob<{ default: ImageMetadata }>('../assets/cutouts/*.webp', { eager: true });

export const photo = (id: string) => photos[`../assets/menu/${id}.jpg`].default;
export const cutout = (id: string): ImageMetadata | undefined => cutouts[`../assets/cutouts/${id}.webp`]?.default;
