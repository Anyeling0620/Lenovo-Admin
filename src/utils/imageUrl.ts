
const baseURL = import.meta.env.VITE_API_BASE_URL 
const avatarPath = import.meta.env.VITE_PUBLIC_AVATAR_PATH
const productImagePath = import.meta.env.VITE_PUBLIC_PRODUCT_IMAGE_PATH

export const getAvatarUrl = (filename: string): string => {
    return `${baseURL}/${avatarPath}/${filename}`
}

export const getProductImageUrl = (filename: string): string => {
    return `${baseURL}/${productImagePath}/${filename}`
}