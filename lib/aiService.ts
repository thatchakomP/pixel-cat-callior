// lib/aiService.ts
import axios from 'axios'

// --- Mock / Placeholder AI for Food Detection ---
export const mockDetectFood = async (imageUrl: string) => {
    console.log(`[AI Mock] Detecting food for: ${imageUrl}`)
    // Simulate AI processing time
    await new Promise((resolve) => {
        const delay = Math.random() * 2000 + 1000 // Calculate delay
        setTimeout(resolve, delay) // Corrected: callback (resolve), then delay
    })

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
        // 1 to 3 items
        const food = sampleFoods[Math.floor(Math.random() * sampleFoods.length)]
        selectedFoods.push(food)
        totalCalories += food.calories
    }

    return {
        detectedFoods: selectedFoods,
        totalCalories: totalCalories,
    }
}

// --- Mock / Placeholder AI for Pixel Cat Generation ---
const MOCK_CAT_IMAGES = [
    '/cats/cat-slim.png', // You need to place actual 8-bit cat images here
    '/cats/cat-normal.png',
    '/cats/cat-fat.png',
    '/cats/cat-obese.png',
    '/cats/cat-muscle.png',
    '/cats/cat-happy.png',
    '/cats/cat-sleepy.png',
]

export const mockGenerateCat = async (prompt: string) => {
    console.log(`[AI Mock] Generating cat for prompt: "${prompt}"`)
    await new Promise((resolve) => {
        const delay = Math.random() * 3000 + 1500 // Calculate delay
        setTimeout(resolve, delay) // Corrected: callback (resolve), then delay
    })

    let selectedImage = MOCK_CAT_IMAGES[Math.floor(Math.random() * MOCK_CAT_IMAGES.length)]
    if (prompt.includes('slim')) selectedImage = MOCK_CAT_IMAGES[0]
    else if (prompt.includes('normal')) selectedImage = MOCK_CAT_IMAGES[1]
    else if (prompt.includes('fat')) selectedImage = MOCK_CAT_IMAGES[2]
    else if (prompt.includes('obese')) selectedImage = MOCK_CAT_IMAGES[3]

    return { imageUrl: selectedImage }
}

// --- Real AI Integration (Example Structure - UNCOMMENT AND IMPLEMENT LATER) ---
/*
export const callRealFoodDetectionApi = async (imageUrl: string) => {
  const apiKey = process.env.MOCK_FOOD_AI_API_KEY; // Replace with actual API key
  const apiUrl = process.env.MOCK_FOOD_AI_API_URL; // Replace with actual API URL

  try {
    const response = await axios.post(`${apiUrl}/detect`, { imageUrl }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const detectedFoods = response.data.foods.map((item: any) => ({
      name: item.name,
      calories: item.nutrition.calories,
      protein: item.nutrition.protein,
      carbs: item.nutrition.carbs,
      fat: item.nutrition.fat,
    }));
    const totalCalories = response.data.totalCalories;
    return { detectedFoods, totalCalories };
  } catch (error) {
    console.error("Error calling real food detection API:", error);
    throw new Error("Failed to detect food.");
  }
};

export const callRealCatGenerationApi = async (prompt: string) => {
  const apiKey = process.env.MOCK_CAT_GEN_AI_API_KEY; // Replace with actual API key
  const apiUrl = process.env.MOCK_CAT_GEN_AI_API_URL; // Replace with actual API URL

  try {
    const response = await axios.post(`${apiUrl}/generate`, { prompt }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const imageUrl = response.data.imageUrl;
    return { imageUrl };
  } catch (error) {
    console.error("Error calling real cat generation API:", error);
    throw new Error("Failed to generate cat image.");
  }
};
*/
