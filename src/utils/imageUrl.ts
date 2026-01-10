
const baseURL = import.meta.env.VITE_API_BASE_URL 
// const avatarPath = import.meta.env.VITE_PUBLIC_AVATAR_PATH
const imagePath = import.meta.env.VITE_PUBLIC_LENOVO_IMAGE_PATH

// export const getAvatarUrl = (filename: string): string => {
//     return `${baseURL}/${avatarPath}/${filename}`
// }




// 返回图片url
export const getImageUrl = (filename: string|null|undefined): string => {
    if(!filename) return 'https://api.dicebear.com/7.x/bottts/png?seed=${Date.now()}'
    if(filename.startsWith('https://')) return filename
    return `${baseURL}/${imagePath}/${filename}`
}