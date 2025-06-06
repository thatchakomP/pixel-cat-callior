// lib/aiService.ts
import axios from 'axios'
import Replicate from 'replicate'

// Initialize Replicate SDK with your API token
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

// --- Mock / Placeholder AI for Food Detection (remains unchanged) ---
export const mockDetectFood = async (imageUrl: string) => {
    console.log(`[AI Mock] Detecting food for: ${imageUrl}`)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), Math.random() * 2000 + 1000))
    const sampleFoods = [
        { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
        { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        { name: 'Broccoli (1 cup)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
        { name: 'White Rice (1 cup cooked)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
        { name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
        { name: 'Burger', calories: 350, protein: 20, carbs: 30, fat: 15 },
        { name: 'Salad with Dressing', calories: 200, protein: 5, carbs: 15, fat: 12 },
    ]
    const selectedFoods = []
    let totalCalories = 0
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const food = sampleFoods[Math.floor(Math.random() * sampleFoods.length)]
        selectedFoods.push(food)
        totalCalories += food.calories
    }
    return { detectedFoods: selectedFoods, totalCalories: totalCalories }
}

// --- STAGE 1: Generate Static Pixel Art Image (using fofr/text-to-pixelart) ---
export const generateStaticPixelCat = async (prompt: string): Promise<{ imageUrl: string }> => {
    const replicateApiToken = process.env.REPLICATE_API_TOKEN
    if (!replicateApiToken) throw new Error('Replicate API token is not set.')

    const modelId = 'fofr/text-to-pixelart'
    // --- IMPORTANT: Get the LATEST version from Replicate.com/fofr/text-to-pixelart ---
    // Go to the model page, look for "Latest version" and copy the long hash.
    const modelVersion = 'f59a7a140f2f768131557999719460058b8f36c535697669d658c7e148e1a66a' // <--- UPDATE THIS!

    const fullPrompt = `${prompt}, 8-bit pixel art, retro game style, low resolution, sharp pixels, isolated on transparent background.`

    console.log(`[AI Replicate - Static] Generating static pixel art for: "${fullPrompt}"`)

    try {
        const output = await replicate.run(`${modelId}:${modelVersion}`, {
            input: {
                prompt: fullPrompt,
                width: 256, // Size for static image
                height: 256,
            },
        })

        if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
            const imageUrl = output[0]
            console.log(`[AI Replicate - Static] Generated image URL: ${imageUrl}`)
            return { imageUrl }
        } else {
            console.error('[AI Replicate - Static] Unexpected output format:', output)
            throw new Error('Replicate API for static image did not return a valid URL.')
        }
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred during static image generation.'
        if (axios.isAxiosError(error) && error.response) {
            errorMessage =
                error.response.data.detail ||
                error.response.data.message ||
                error.response.statusText
        } else if (error instanceof Error) {
            errorMessage = error.message
        }
        console.error(
            `[AI Replicate - Static] Error generating static image: ${errorMessage}`,
            error
        )
        throw new Error(`Failed to generate static image: ${errorMessage}`)
    }
}

// --- STAGE 2: Animate the Static Pixel Art Image (using minimax/video-01-live) ---
export const generateAnimatedPixelCat = async (
    staticImageUrl: string, // Input: The static image URL from Stage 1
    animationPrompt: string // Input: e.g., "simple wave animation"
): Promise<{ videoUrl: string }> => {
    // Returns videoUrl now
    const replicateApiToken = process.env.REPLICATE_API_TOKEN
    if (!replicateApiToken) throw new Error('Replicate API token is not set.')

    const modelId = 'minimax/video-01-live'
    // --- IMPORTANT: Get the LATEST version from Replicate.com/minimax/video-01-live ---
    // Go to the model page, look for "Latest version" and copy the long hash.
    const modelVersion = 'c044ed3967d6438676d542036423c914b43441865913f02e05f013d332d9735d' // <--- UPDATE THIS!

    // Combine animation prompt with pixel art cues for video generation
    const fullPrompt = `${animationPrompt}. Starting with the provided pixel art cat. 8-bit pixel art, retro game style, sharp pixels, simple background, 1-second seamless loop.`

    console.log(
        `[AI Replicate - Video] Generating video for: "${fullPrompt}" with first_frame_image: "${staticImageUrl}"`
    )

    try {
        const output = await replicate.run(`${modelId}:${modelVersion}`, {
            input: {
                prompt: fullPrompt,
                first_frame_image: staticImageUrl, // <--- CRITICAL INPUT: The static image URL
                seed: Math.floor(Math.random() * 1000000), // Random seed for variety
                resolution: '256_256', // Or "512_512" if needed, check model's input options
                // duration: 1, // If model supports, limit duration for faster generation (check model's input)
                // fps: 10, // If model supports, adjust frames per second for more pixelated motion (check model's input)
            },
        })

        // minimax/video-01-live returns an object with a 'video' URL
        if (
            output &&
            typeof output === 'object' &&
            'video' in output &&
            typeof (output as any).video === 'string'
        ) {
            const videoUrl = (output as any).video
            console.log(`[AI Replicate - Video] Generated video URL: ${videoUrl}`)
            return { videoUrl } // Return as 'videoUrl'
        } else {
            console.error('[AI Replicate - Video] Unexpected output format from Replicate:', output)
            throw new Error(
                'Replicate API for video did not return a valid URL in the expected format.'
            )
        }
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred during video generation.'
        if (axios.isAxiosError(error) && error.response) {
            errorMessage =
                error.response.data.detail ||
                error.response.data.message ||
                error.response.statusText
        } else if (error instanceof Error) {
            errorMessage = error.message
        }
        console.error(`[AI Replicate - Video] Error generating video: ${errorMessage}`, error)
        throw new Error(`Failed to generate video: ${errorMessage}`)
    }
}
