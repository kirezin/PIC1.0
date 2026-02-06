import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Member } from "../types";

export const GeminiService = {
  analyzeAttendance: async (records: AttendanceRecord[], members: Member[]): Promise<string> => {
    if (records.length === 0) return "Sem dados suficientes para análise.";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare a summary payload to avoid sending massive JSON
    const today = new Date().toISOString().split('T')[0];
    const presentToday = records.filter(r => r.dateStr === today).length;
    
    // Group by date
    const byDate = records.reduce((acc, curr) => {
      acc[curr.dateStr] = (acc[curr.dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most frequent attendees
    const frequency = records.reduce((acc, curr) => {
      acc[curr.memberName] = (acc[curr.memberName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `
      Atue como um assistente administrativo de uma igreja.
      Aqui estão os dados resumidos de presença:
      - Total de membros cadastrados: ${members.length}
      - Presença hoje (${today}): ${presentToday}
      - Histórico por data: ${JSON.stringify(byDate)}
      - Frequência por membro: ${JSON.stringify(frequency)}

      Por favor, forneça um relatório curto e encorajador em Português (Brasil). 
      Inclua:
      1. Um resumo da frequência recente.
      2. Destaque os dias de maior movimento.
      3. Sugira uma ação pastoral simples (ex: ligar para quem faltou se houver queda drástica).
      Mantenha o tom acolhedor e profissional.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Não foi possível gerar a análise.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Erro ao conectar com a Inteligência Artificial.";
    }
  }
};