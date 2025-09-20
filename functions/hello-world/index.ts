// Supabase Edge Function for handling AI analysis and external API calls
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, data } = await req.json()

    switch (action) {
      case 'analyze_report':
        return await handleReportAnalysis(data)
      
      case 'get_air_quality':
        return await handleAirQualityRequest(data)
      
      case 'chatbot_response':
        return await handleChatbotRequest(data)
      
      case 'schedule_appointment':
        return await handleAppointmentScheduling(data, supabase)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleReportAnalysis(data: any) {
  const { reportText, userId, reportId } = data

  try {
    // Here you would integrate with OpenAI or other AI service
    // For demo purposes, we'll simulate analysis based on keywords
    
    const analysis = await simulateAIAnalysis(reportText)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Analysis failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function simulateAIAnalysis(reportText: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const keywords = reportText.toLowerCase()
  let analysis = {
    summary: "Medical report analysis completed successfully.",
    findings: [] as string[],
    recommendations: [] as string[],
    riskLevel: "low" as "low" | "moderate" | "high",
    confidence: 0.85,
    detectedConditions: [] as string[]
  }

  // Analyze for asthma-related keywords
  if (keywords.includes('asthma') || keywords.includes('wheezing') || keywords.includes('shortness of breath')) {
    analysis.findings.push("Respiratory symptoms consistent with asthma detected")
    analysis.recommendations.push("Continue prescribed bronchodilator therapy")
    analysis.recommendations.push("Monitor peak flow readings daily")
    analysis.recommendations.push("Avoid known environmental triggers")
    analysis.detectedConditions.push("Asthma")
    analysis.riskLevel = "moderate"
    analysis.confidence = 0.92
  }

  if (keywords.includes('allergen') || keywords.includes('allergy') || keywords.includes('ige')) {
    analysis.findings.push("Allergic sensitization patterns identified")
    analysis.recommendations.push("Consider comprehensive allergy testing")
    analysis.recommendations.push("Implement environmental control measures")
    analysis.recommendations.push("Discuss immunotherapy options with allergist")
    analysis.detectedConditions.push("Allergic Rhinitis")
  }

  if (keywords.includes('peak flow') || keywords.includes('spirometry') || keywords.includes('fev1')) {
    analysis.findings.push("Pulmonary function testing results available")
    analysis.recommendations.push("Regular spirometry monitoring recommended")
    analysis.recommendations.push("Optimize bronchodilator therapy based on results")
  }

  if (keywords.includes('eosinophil') || keywords.includes('inflammation')) {
    analysis.findings.push("Inflammatory markers present")
    analysis.recommendations.push("Consider anti-inflammatory treatment")
    analysis.recommendations.push("Monitor inflammatory biomarkers")
    analysis.riskLevel = "moderate"
  }

  if (keywords.includes('severe') || keywords.includes('emergency') || keywords.includes('hospitalization')) {
    analysis.findings.push("History of severe asthma exacerbations")
    analysis.recommendations.push("Develop comprehensive asthma action plan")
    analysis.recommendations.push("Consider step-up therapy")
    analysis.recommendations.push("Regular specialist follow-up recommended")
    analysis.riskLevel = "high"
    analysis.confidence = 0.95
  }

  // Air quality related findings
  if (keywords.includes('pollution') || keywords.includes('pm2.5') || keywords.includes('air quality')) {
    analysis.findings.push("Environmental air quality concerns noted")
    analysis.recommendations.push("Use air quality monitoring apps")
    analysis.recommendations.push("Consider air purifiers for indoor spaces")
    analysis.recommendations.push("Limit outdoor activities during high pollution days")
  }

  // Default analysis if no specific keywords found
  if (analysis.findings.length === 0) {
    analysis.findings.push("General health parameters reviewed")
    analysis.recommendations.push("Continue regular medical follow-up")
    analysis.recommendations.push("Maintain healthy lifestyle practices")
    analysis.recommendations.push("Monitor symptoms and seek care if worsening")
  }

  return analysis
}

async function handleAirQualityRequest(data: any) {
  const { city, coordinates } = data
  
  try {
    // Here you would call a real air quality API like OpenWeatherMap or AQI API
    // For demo, we'll simulate realistic air quality data for Indian cities
    
    const airQualityData = await simulateAirQualityData(city, coordinates)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: airQualityData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Air quality data unavailable',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function simulateAirQualityData(city: string, coordinates: any) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Base AQI values for major Indian cities (realistic ranges)
  const cityAQIBase: { [key: string]: number } = {
    'delhi': 250,
    'mumbai': 120,
    'kolkata': 140,
    'chennai': 90,
    'bangalore': 80,
    'hyderabad': 110,
    'pune': 95,
    'ahmedabad': 130,
    'jaipur': 160,
    'lucknow': 180,
    'kanpur': 200,
    'nagpur': 100,
    'indore': 120,
    'thane': 115,
    'bhopal': 125,
    'visakhapatnam': 70,
    'pimpri': 100,
    'patna': 170,
    'vadodara': 110,
    'ghaziabad': 220
  }
  
  const baseAQI = cityAQIBase[city.toLowerCase()] || 100
  const variation = Math.random() * 40 - 20 // ±20 variation
  const currentAQI = Math.max(0,```typescript
 Math.round(baseAQI + variation))
  
  // Generate realistic pollutant data based on AQI
  const pm25 = Math.round(currentAQI * 0.6 + Math.random() * 20)
  const pm10 = Math.round(pm25 * 1.5 + Math.random() * 30)
  const no2 = Math.round(currentAQI * 0.3 + Math.random() * 15)
  const so2 = Math.round(currentAQI * 0.2 + Math.random() * 10)
  const co = Math.round(currentAQI * 0.1 + Math.random() * 5)
  const o3 = Math.round(currentAQI * 0.4 + Math.random() * 20)
  
  // Determine AQI category
  let category = 'Good'
  let color = '#00E400'
  if (currentAQI > 50) { category = 'Moderate'; color = '#FFFF00' }
  if (currentAQI > 100) { category = 'Unhealthy for Sensitive Groups'; color = '#FF7E00' }
  if (currentAQI > 150) { category = 'Unhealthy'; color = '#FF0000' }
  if (currentAQI > 200) { category = 'Very Unhealthy'; color = '#8F3F97' }
  if (currentAQI > 300) { category = 'Hazardous'; color = '#7E0023' }
  
  return {
    city: city,
    aqi: currentAQI,
    category: category,
    color: color,
    pollutants: {
      pm25: { value: pm25, unit: 'μg/m³' },
      pm10: { value: pm10, unit: 'μg/m³' },
      no2: { value: no2, unit: 'ppb' },
      so2: { value: so2, unit: 'ppb' },
      co: { value: co, unit: 'ppm' },
      o3: { value: o3, unit: 'ppb' }
    },
    timestamp: new Date().toISOString(),
    forecast: generateForecast(currentAQI),
    healthRecommendations: getHealthRecommendations(currentAQI, category)
  }
}

function generateForecast(baseAQI: number) {
  const forecast = []
  for (let i = 1; i <= 3; i++) {
    const variation = Math.random() * 60 - 30
    const forecastAQI = Math.max(0, Math.round(baseAQI + variation))
    
    let category = 'Good'
    if (forecastAQI > 50) category = 'Moderate'
    if (forecastAQI > 100) category = 'Unhealthy for Sensitive Groups'
    if (forecastAQI > 150) category = 'Unhealthy'
    if (forecastAQI > 200) category = 'Very Unhealthy'
    if (forecastAQI > 300) category = 'Hazardous'
    
    const date = new Date()
    date.setDate(date.getDate() + i)
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      aqi: forecastAQI,
      category: category
    })
  }
  return forecast
}

function getHealthRecommendations(aqi: number, category: string) {
  const recommendations = {
    general: [],
    asthma: [],
    activities: []
  }
  
  if (aqi <= 50) {
    recommendations.general.push("Air quality is satisfactory for most people")
    recommendations.asthma.push("Good day for outdoor activities")
    recommendations.activities.push("All outdoor activities are safe")
  } else if (aqi <= 100) {
    recommendations.general.push("Air quality is acceptable for most people")
    recommendations.asthma.push("Sensitive individuals should limit prolonged outdoor exertion")
    recommendations.activities.push("Outdoor activities are generally safe")
  } else if (aqi <= 150) {
    recommendations.general.push("Members of sensitive groups may experience health effects")
    recommendations.asthma.push("People with asthma should limit outdoor activities")
    recommendations.activities.push("Reduce prolonged or heavy outdoor exertion")
  } else if (aqi <= 200) {
    recommendations.general.push("Everyone may begin to experience health effects")
    recommendations.asthma.push("People with asthma should avoid outdoor activities")
    recommendations.activities.push("Avoid prolonged outdoor exertion")
  } else if (aqi <= 300) {
    recommendations.general.push("Health warnings of emergency conditions")
    recommendations.asthma.push("Stay indoors and use air purifiers")
    recommendations.activities.push("Avoid all outdoor activities")
  } else {
    recommendations.general.push("Health alert: everyone may experience serious health effects")
    recommendations.asthma.push("Emergency conditions - stay indoors with air purification")
    recommendations.activities.push("Avoid all outdoor activities - health emergency")
  }
  
  return recommendations
}

async function handleChatbotRequest(data: any) {
  const { message, userId, chatHistory } = data
  
  try {
    // Here you would integrate with OpenAI ChatGPT API
    // For demo, we'll use our asthma-focused response system
    
    const response = await generateAsthmaResponse(message, chatHistory)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Chatbot service unavailable',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function generateAsthmaResponse(message: string, chatHistory: any[]) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const lowerMessage = message.toLowerCase()
  
  // Enhanced asthma knowledge base
  const responses: { [key: string]: string } = {
    // Symptoms and diagnosis
    symptoms: "Common asthma symptoms include:\n\n• **Wheezing** - a whistling sound when breathing\n• **Shortness of breath** - especially during activities\n• **Chest tightness** - feeling like a band around your chest\n• **Coughing** - often worse at night or early morning\n• **Difficulty sleeping** due to breathing problems\n\nIf you experience severe symptoms like difficulty speaking, blue lips, or extreme shortness of breath, seek immediate medical attention! 🚨",
    
    // Triggers and prevention
    triggers: "Common asthma triggers include:\n\n**Environmental:**\n• Air pollution and smog\n• Dust mites and allergens\n• Pet dander\n• Pollen (seasonal)\n• Cold air\n\n**Lifestyle:**\n• Smoke (cigarettes, cooking)\n• Strong scents/perfumes\n• Exercise (exercise-induced asthma)\n• Stress and strong emotions\n• Respiratory infections\n\n💡 **Tip:** Keep an asthma diary to identify your personal triggers!",
    
    // Medications
    medication: "Asthma medications fall into two main categories:\n\n**Quick-Relief (Rescue) Inhalers:**\n• Albuterol (ProAir, Ventolin)\n• Used during asthma attacks\n• Should provide relief within 15 minutes\n\n**Long-Term Control:**\n• Inhaled corticosteroids (Flovent, Pulmicort)\n• Combination inhalers (Advair, Symbicort)\n• Taken daily to prevent symptoms\n\n⚠️ **Important:** Always follow your doctor's prescribed treatment plan and never stop medications without consulting them!",
    
    // Emergency situations
    emergency: "**Seek immediate emergency care if you experience:**\n\n🚨 **Severe symptoms:**\n• Cannot speak in full sentences\n• Lips or fingernails turn blue\n• Extreme difficulty breathing\n• Rescue inhaler doesn't help\n• Peak flow drops below 50% of personal best\n\n**Emergency Action:**\n1. Use rescue inhaler immediately\n2. Call 911 or go to ER\n3. Take rescue inhaler every 20 minutes\n4. Stay calm and sit upright\n\n**Always have an Asthma Action Plan with emergency contacts!**",
    
    // Air quality and environment
    airquality: "Air quality significantly impacts asthma:\n\n**Daily Monitoring:**\n• Check AQI (Air Quality Index) daily\n• AQI > 100: Limit outdoor activities\n• AQI > 150: Stay indoors if possible\n\n**Indoor Air Quality:**\n• Use HEPA air purifiers\n• Keep humidity 30-50%\n• Regular cleaning to reduce dust\n• Avoid smoking indoors\n\n**Seasonal Considerations:**\n• High pollen days: Keep windows closed\n• Winter: Warm up gradually before going out\n• Monsoon: Watch for mold growth\n\n🌬️ Our air quality checker can help you plan your activities!",
    
    // Exercise and lifestyle
    exercise: "Exercise is beneficial for asthma when managed properly:\n\n**Safe Exercise Tips:**\n• Use pre-exercise inhaler if prescribed\n• Warm up for 10-15 minutes gradually\n• Choose asthma-friendly activities (swimming, walking)\n• Exercise indoors during high pollution days\n• Cool down slowly\n\n**Warning Signs to Stop:**\n• Wheezing or coughing\n• Chest tightness\n• Shortness of breath beyond normal exertion\n• Dizziness or fatigue\n\n🏃‍♂️ **Remember:** Exercise-induced asthma is manageable - don't avoid physical activity entirely!",
    
    // Diet and nutrition
    diet: "While no diet cures asthma, certain foods may help:\n\n**Beneficial Foods:**\n• **Omega-3 rich** - fish, walnuts, flax seeds\n• **Antioxidants** - berries, leafy greens, tomatoes\n• **Magnesium** - spinach, almonds, dark chocolate\n• **Vitamin D** - fortified foods, sunlight exposure\n\n**Foods to Limit:**\n• Processed foods high in preservatives\n• Sulfites (wine, dried fruits)\n• Foods you're allergic to\n• Excess salt\n\n🥗 **Tip:** Maintain a healthy weight as obesity can worsen asthma symptoms.",
    
    // Managing stress and mental health
    stress: "Stress and emotions can trigger asthma:\n\n**Stress Management:**\n• Practice deep breathing exercises\n• Try meditation or yoga\n• Regular sleep schedule (7-9 hours)\n• Stay connected with support system\n\n**Breathing Techniques:**\n• **4-7-8 Breathing:** Inhale 4, hold 7, exhale 8\n• **Diaphragmatic breathing** for relaxation\n• **Pursed lip breathing** during mild symptoms\n\n🧘‍♀️ **Remember:** Mental health affects physical health - consider counseling if stress is overwhelming.",
    
    // Peak flow monitoring
    peakflow: "Peak Flow Meters help monitor asthma control:\n\n**How to Use:**\n1. Stand up straight\n2. Take deep breath\n3. Seal lips around mouthpiece\n4. Blow out as hard and fast as possible\n5. Record best of 3 attempts\n\n**Zone System:**\n• **Green (80-100%):** Good control\n• **Yellow (50-79%):** Caution - follow action plan\n• **Red (<50%):** Medical alert - seek help\n\n📊 **Best practice:** Monitor daily and share results with your doctor.",
    
    // Travel tips
    travel: "Traveling with asthma requires preparation:\n\n**Before Travel:**\n• Pack extra medications\n• Get travel insurance\n• Research local healthcare\n• Check air quality at destination\n\n**Flying Tips:**\n• Carry inhalers in carry-on\n• Inform airline of medical needs\n• Stay hydrated\n• Move around during long flights\n\n✈️ **Always bring a letter from your doctor about your medications and medical devices.**"
  }
  
  // Advanced keyword matching for better responses
  if (lowerMessage.includes('symptom') || lowerMessage.includes('wheezing') || lowerMessage.includes('cough')) {
    return responses.symptoms
  }
  
  if (lowerMessage.includes('trigger') || lowerMessage.includes('cause') || lowerMessage.includes('avoid')) {
    return responses.triggers
  }
  
  if (lowerMessage.includes('medication') || lowerMessage.includes('inhaler') || lowerMessage.includes('treatment')) {
    return responses.medication
  }
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('attack') || lowerMessage.includes('severe')) {
    return responses.emergency
  }
  
  if (lowerMessage.includes('air quality') || lowerMessage.includes('pollution') || lowerMessage.includes('aqi')) {
    return responses.airquality
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('physical activity')) {
    return responses.exercise
  }
  
  if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('nutrition')) {
    return responses.diet
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('breathing technique')) {
    return responses.stress
  }
  
  if (lowerMessage.includes('peak flow') || lowerMessage.includes('monitor') || lowerMessage.includes('measure')) {
    return responses.peakflow
  }
  
  if (lowerMessage.includes('travel') || lowerMessage.includes('trip') || lowerMessage.includes('vacation')) {
    return responses.travel
  }
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! 👋 I'm your AsthmaCare AI assistant. I'm here to help you with asthma-related questions including symptoms, triggers, medications, air quality, and emergency care. What would you like to know about managing your asthma today?"
  }
  
  // Default helpful response with suggestions
  return `I'm here to help with asthma-related questions! Here are some topics I can assist with:

🔹 **Symptoms & Triggers** - Understanding what causes your asthma
🔹 **Medications** - Information about inhalers and treatments  
🔹 **Air Quality** - How pollution affects your breathing
🔹 **Exercise** - Safe physical activity with asthma
🔹 **Emergency Care** - When and how to seek immediate help
🔹 **Lifestyle** - Diet, stress management, and daily care

You can ask me something like:
• "What are common asthma triggers?"
• "How do I use my inhaler properly?"
• "What should I do during an asthma attack?"

**Remember:** This is educational information only. Always consult your healthcare provider for personalized medical advice! 👩‍⚕️`
}

async function handleAppointmentScheduling(data: any, supabase: any) {
  const { userId, appointmentData } = data
  
  try {
    // Save appointment to database
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        user_id: userId,
        patient_name: appointmentData.patientName,
        email: appointmentData.email,
        phone: appointmentData.phone,
        preferred_date: appointmentData.preferredDate,
        symptoms: appointmentData.symptoms,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Here you could integrate with calendar systems, send emails, etc.
    
    return new Response(
      JSON.stringify({ 
        success: true,
        appointment: appointment,
        message: 'Appointment scheduled successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to schedule appointment',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}