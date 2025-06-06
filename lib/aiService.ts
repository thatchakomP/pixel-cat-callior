// lib/aiService.ts
import Replicate from 'replicate'

interface FoodItem {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
}

const SAMPLE_FOODS: FoodItem[] = [
    { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Broccoli (1 cup)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
    { name: 'White Rice (1 cup cooked)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
    { name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
    { name: 'Burger', calories: 350, protein: 20, carbs: 30, fat: 15 },
    { name: 'Salad with Dressing', calories: 200, protein: 5, carbs: 15, fat: 12 },
]

// --- Mock / Placeholder AI for Food Detection ---
export const mockDetectFood = async (
    imageUrl: string
): Promise<{ detectedFoods: FoodItem[]; totalCalories: number }> => {
    console.log(`[AI Mock] Detecting food for: ${imageUrl}`)
    // Simulate AI processing time
    await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000)
    )

    const selectedFoods = []
    let totalCalories = 0
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const food = SAMPLE_FOODS[Math.floor(Math.random() * SAMPLE_FOODS.length)]
        selectedFoods.push(food)
        totalCalories += food.calories
    }
    return {
        detectedFoods: selectedFoods,
        totalCalories: totalCalories,
    }
}

// --- Replicate integration for Food Detection ---
export const detectFoodWithReplicate = async (
    imageUrl: string
): Promise<{ detectedFoods: FoodItem[]; totalCalories: number }> => {
    if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('Replicate API token is not set in environment variables.')
    }

    // Example food detection model from Replicate.
    // Replace the model ID and version with one that suits your needs.
    const modelId = 'cjwbw/food-classifier'
    const modelVersion = '9059bd9dce0f2bc56d4c3aac34d9e97f1fd7cd03f8f93c5b0bbdfe9eceea22bd'

    try {
        const output: any = await replicate.run(`${modelId}:${modelVersion}`, {
            input: { image: imageUrl },
        })

        const predictions =
            Array.isArray(output)
                ? output
                : output?.predictions || []

        const detectedFoods: FoodItem[] = []
        let totalCalories = 0

        for (const item of predictions) {
            const label =
                typeof item === 'string'
                    ? item
                    : item.label || item.class || item.name
            const food = SAMPLE_FOODS.find((f) =>
                f.name.toLowerCase().includes(label.toLowerCase())
            )
            if (food) {
                detectedFoods.push(food)
                totalCalories += food.calories
            }
        }

        return { detectedFoods, totalCalories }
    } catch (error: any) {
        console.error('[AI Replicate] Error detecting food:', error.message)
        throw new Error(`Failed to detect food: ${error.message}`)
    }
}

// --- Replicate Integration for Pixel Cat Generation ---
// Instantiate Replicate SDK with your API token
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

export const generateCatWithReplicate = async (prompt: string) => {
    const replicateApiToken = process.env.REPLICATE_API_TOKEN
    if (!replicateApiToken) {
        throw new Error('Replicate API token is not set in environment variables.')
    }

    // Add strong pixel art directives to the prompt for Replicate
    // IMPORTANT: The model ID and version below are for `fofr/text-to-pixelart` from Replicate.com.
    // You might choose a different model. If so, update the ID and its specific input parameters.
    const modelId = 'lucataco/pixart-xl-2'
    const modelVersion = '816c99673841b9448bc2539834c16d40e0315bbf92fef0317b57a226727409bb'

    const fullPrompt = `${prompt}, 8-bit pixel art, retro game style, low resolution, sharp pixels, isolated on transparent background.`

    console.log(`[AI Replicate] Generating cat for prompt: "${fullPrompt}"`)

    try {
        const output = await replicate.run(
            `${modelId}:${modelVersion}`, // Combine model ID and version
            {
                input: {
                    prompt: fullPrompt,
                    width: 256, // Recommended size for pixel art, check model's input options
                    height: 256,
                    // Other model-specific parameters you find on Replicate's model page
                },
            }
        )

        // Replicate usually returns an array of URLs for images
        if (Array.isArray(output) && output.length > 0) {
            const imageUrl = output[0] as string // Cast to string
            console.log(`[AI Replicate] Generated image URL: ${imageUrl}`)
            return { imageUrl }
        } else {
            throw new Error('Replicate API did not return an image URL.')
        }
    } catch (error: any) {
        console.error(`[AI Replicate] Error generating cat image:`, error.message)
        throw new Error(`Failed to generate cat image: ${error.message}`)
    }
}
