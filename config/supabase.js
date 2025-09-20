// Supabase configuration and initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database tables structure:
/*
1. users table:
   - id (uuid, primary key)
   - email (text)
   - full_name (text)
   - created_at (timestamp)
   
2. chat_messages table:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - message (text)
   - response (text)
   - created_at (timestamp)
   
3. reports table:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - file_name (text)
   - file_url (text)
   - analysis_result (jsonb)
   - upload_date (timestamp)
   - status (text) - 'uploading', 'analyzing', 'completed'
   
4. appointments table:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - patient_name (text)
   - email (text)
   - phone (text)
   - preferred_date (date)
   - symptoms (text)
   - status (text) - 'pending', 'confirmed', 'cancelled'
   - created_at (timestamp)
*/

// Auth helpers
export const auth = {
  // Sign up new user
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const database = {
  // Chat messages
  async saveChatMessage(userId, message, response) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userId,
          message,
          response,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getChatHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Reports
  async saveReport(userId, fileName, fileUrl, analysisResult = null) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          user_id: userId,
          file_name: fileName,
          file_url: fileUrl,
          analysis_result: analysisResult,
          upload_date: new Date().toISOString(),
          status: analysisResult ? 'completed' : 'analyzing'
        }]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async updateReportAnalysis(reportId, analysisResult) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          analysis_result: analysisResult,
          status: 'completed'
        })
        .eq('id', reportId);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getUserReports(userId) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Appointments
  async saveAppointment(userId, appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          user_id: userId,
          ...appointmentData,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getUserAppointments(userId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('preferred_date', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Storage helpers
export const storage = {
  // Upload file to Supabase storage
  async uploadFile(bucket, filePath, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get public URL for file
  getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Delete file
  async deleteFile(bucket, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// AI Analysis helpers
export const aiAnalysis = {
  // Analyze medical report using AI
  async analyzeReport(reportText) {
    try {
      // This would typically call an AI service like OpenAI
      // For now, we'll simulate analysis
      const analysis = await this.simulateReportAnalysis(reportText);
      return { success: true, analysis };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Simulate report analysis (replace with actual AI service)
  async simulateReportAnalysis(reportText) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const keywords = reportText.toLowerCase();
    let analysis = {
      summary: "Analysis completed successfully.",
      findings: [],
      recommendations: [],
      riskLevel: "low",
      confidence: 0.85
    };

    // Analyze for asthma-related keywords
    if (keywords.includes('asthma') || keywords.includes('wheezing') || keywords.includes('shortness of breath')) {
      analysis.findings.push("Respiratory symptoms detected");
      analysis.recommendations.push("Continue prescribed inhaler medication");
      analysis.recommendations.push("Monitor air quality levels daily");
      analysis.riskLevel = "moderate";
    }

    if (keywords.includes('allergen') || keywords.includes('allergy')) {
      analysis.findings.push("Allergic reactions indicated");
      analysis.recommendations.push("Consider allergy testing");
      analysis.recommendations.push("Avoid known allergens");
    }

    if (keywords.includes('peak flow') || keywords.includes('spirometry')) {
      analysis.findings.push("Lung function tests present");
      analysis.recommendations.push("Regular peak flow monitoring recommended");
    }

    // Default analysis if no specific keywords found
    if (analysis.findings.length === 0) {
      analysis.findings.push("General health report reviewed");
      analysis.recommendations.push("Maintain regular check-ups");
      analysis.recommendations.push("Follow prescribed treatment plan");
    }

    return analysis;
  },

  // Get AI chatbot response
  async getChatbotResponse(message, chatHistory = []) {
    try {
      // This would typically call OpenAI or another AI service
      const response = await this.generateAsthmaResponse(message, chatHistory);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Generate asthma-related responses
  async generateAsthmaResponse(message, chatHistory = []) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Asthma-specific responses
    const responses = {
      symptoms: "Common asthma symptoms include wheezing, shortness of breath, chest tightness, and coughing. If you're experiencing severe symptoms, please seek immediate medical attention.",
      
      triggers: "Common asthma triggers include allergens (dust mites, pollen, pet dander), air pollution, cold air, exercise, stress, and respiratory infections. Identifying and avoiding your triggers is key to managing asthma.",
      
      medication: "Asthma medications include quick-relief inhalers (bronchodilators) for immediate symptoms and long-term control medications (corticosteroids) for daily management. Always follow your doctor's prescribed treatment plan.",
      
      emergency: "Seek emergency care if you experience severe shortness of breath, inability to speak in full sentences, blue lips or fingernails, or if your rescue inhaler isn't helping. Call emergency services immediately.",
      
      airquality: "Air quality significantly affects asthma. Check daily AQI levels, stay indoors when pollution is high, use air purifiers, and avoid outdoor activities during poor air quality days.",
      
      exercise: "Exercise can trigger asthma, but with proper management, most people with asthma can exercise safely. Use your pre-exercise inhaler if prescribed, warm up gradually, and choose asthma-friendly activities like swimming.",
      
      diet: "While no specific diet cures asthma, maintaining a healthy diet rich in fruits, vegetables, and omega-3 fatty acids may help reduce inflammation. Avoid foods that trigger your specific allergies."
    };
    
    // Check for keywords and return appropriate response
    if (lowerMessage.includes('symptom')) return responses.symptoms;
    if (lowerMessage.includes('trigger')) return responses.triggers;
    if (lowerMessage.includes('medication') || lowerMessage.includes('inhaler')) return responses.medication;
    if (lowerMessage.includes('emergency') || lowerMessage.includes('attack')) return responses.emergency;
    if (lowerMessage.includes('air quality') || lowerMessage.includes('pollution')) return responses.airquality;
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) return responses.exercise;
    if (lowerMessage.includes('diet') || lowerMessage.includes('food')) return responses.diet;
    
    // Default helpful response
    return "I'm here to help with asthma-related questions. You can ask me about symptoms, triggers, medications, air quality, exercise, or emergency care. For specific medical advice, please consult with your healthcare provider.";
  }
};

export default supabase;