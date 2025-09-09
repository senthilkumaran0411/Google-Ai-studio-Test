import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedContent, CodeAnalysisResult, ClarifiedConcept } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas for JSON responses
const codeAnalysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        recognizedCode: { 
            type: Type.STRING, 
            description: "The code transcribed from the image or provided text. Format it correctly with newlines and indentation.",
            nullable: true 
        },
        timeComplexity: { 
            type: Type.STRING, 
            description: "The Big O time complexity of the code (e.g., 'O(n)', 'O(n^2)', 'O(log n)').",
            nullable: true 
        },
        explanation: { 
            type: Type.STRING, 
            description: "A clear, concise explanation of why the code has this time complexity. Break down the logic step-by-step.",
            nullable: true 
        },
        recommendations: { 
            type: Type.STRING, 
            description: "Suggestions for optimizing the code or alternative algorithms that would be more efficient. If the code is already optimal, state that.",
            nullable: true 
        },
        optimizedCode: {
            type: Type.STRING,
            description: "If possible, provide an optimized version of the code. If the original code is already optimal, this can be null or empty.",
            nullable: true
        },
        error: { 
            type: Type.STRING, 
            description: "An error message if the input could not be processed as code.",
            nullable: true 
        }
    }
};

const extractedTextSchema = {
    type: Type.OBJECT,
    properties: {
        extractedText: { 
            type: Type.STRING, 
            description: "All the text recognized from the image, preserving paragraphs and line breaks as best as possible."
        }
    },
    required: ['extractedText']
};

const clarifiedConceptSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A concise title for the concept (e.g., 'Quantum Entanglement', 'The Krebs Cycle')."
        },
        simplifiedExplanation: {
            type: Type.STRING,
            description: "The core explanation of the concept, tailored to the requested style. Keep it clear, direct, and easy to follow."
        },
        analogy: {
            type: Type.STRING,
            description: "A relatable analogy to help understand the concept. If the style is 'With an Analogy', this should be particularly strong. Otherwise, provide a simpler one or a metaphorical example."
        }
    },
    required: ['title', 'simplifiedExplanation', 'analogy']
};

interface QuizOptions {
    numQuestions: number;
    difficulty: string;
    questionTypes: string;
}

const parseJsonResponse = <T>(rawText: string): T => {
    let jsonText = "";
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
    
    if (jsonMatch && (jsonMatch[1] || jsonMatch[2])) {
        jsonText = jsonMatch[1] || jsonMatch[2];
    } else {
        console.error("Could not find a valid JSON object in the AI response:", rawText);
        throw new Error("The AI returned a response that could not be processed. Please try again.");
    }

    try {
        return JSON.parse(jsonText) as T;
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", jsonText, parseError);
        throw new Error("The AI returned a malformed response. Please try again.");
    }
};

/**
 * Generates a summary, key takeaways, and a quiz for a given YouTube video URL.
 * It uses the Google Search tool to find information about the video.
 * @param youtubeUrl The URL of the YouTube video.
 * @param options The customization options for the quiz.
 * @returns A promise that resolves to the generated content.
 */
export const generateContentFromUrl = async (youtubeUrl: string, options: QuizOptions): Promise<GeneratedContent> => {
    const { numQuestions, difficulty, questionTypes } = options;

    let questionTypeInstruction = "";
    if (questionTypes === 'Mix') {
        questionTypeInstruction = "Include a mix of 'multiple-choice' and 'short-answer' types.";
    } else if (questionTypes === 'Multiple Choice') {
        questionTypeInstruction = "All questions MUST be 'multiple-choice' type.";
    } else if (questionTypes === 'Short Answer') {
        questionTypeInstruction = "All questions MUST be 'short-answer' type.";
    }

    const prompt = `
        You are an expert video analyst and educator. Your task is to analyze the content of the YouTube video at the following URL and generate an educational summary, key takeaways, a vocabulary list, and a customized quiz.

        YouTube URL: ${youtubeUrl}

        Please use your search capabilities to find the transcript or detailed information about this video's content.

        Based on the video's content, you must provide a response in a single, valid JSON object.
        - The final output must be ONLY the raw JSON text. Do not include any text, markdown, or code block syntax outside of the JSON object itself.
        - All newline characters inside any JSON string value must be properly escaped (e.g., use \\n).

        The JSON object must conform to the following structure:
        {
          "summary": "A concise, academic summary of the video content, between 150 and 250 words. It should be broken into paragraphs with clear topic sentences.",
          "keyTakeaways": [
            "A key insight or important fact from the video.",
            "Another key insight or important fact from the video."
          ],
          "vocabulary": [
            {
              "term": "An important term from the video.",
              "definition": "A concise definition of the term as it relates to the video's context."
            }
          ],
          "quiz": [
            {
              "question": "A quiz question based on the video.",
              "type": "multiple-choice",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "The correct option text."
            },
            {
              "question": "A short-answer question.",
              "type": "short-answer",
              "answer": "The correct short answer."
            }
          ]
        }
        
        Important Rules for the Vocabulary List:
        - Identify 5-7 important or potentially difficult terms from the video.
        - Provide clear and concise definitions.

        Important Rules for the Quiz:
        - Create exactly ${numQuestions} questions.
        - The difficulty of the questions should be: ${difficulty}.
        - ${questionTypeInstruction}
        - For 'multiple-choice' questions, provide exactly 4 options and ensure the 'answer' field matches one of the options.
        - For 'short-answer' questions, do not include an 'options' field.

        Important Rules for the whole response:
        - The summary should be well-structured.
        - Provide at least 3-5 key takeaways.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const parsedData = parseJsonResponse<GeneratedContent>(response.text);
        
        const summaryText = parsedData.summary?.toLowerCase() || '';
        if (!parsedData.summary || !parsedData.quiz || !parsedData.keyTakeaways || !parsedData.vocabulary || parsedData.quiz.length === 0 || summaryText.includes("could not be established") || summaryText.includes("unable to access") || summaryText.includes("cannot be generated")) {
            console.warn("AI indicated failure or returned incomplete data:", parsedData.summary);
            throw new Error("The AI was unable to access or analyze the content of this YouTube video. This can happen with private videos, live streams, or newly uploaded content. Please try a different video.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error generating content with Gemini API:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
};


/**
 * Analyzes an image of code to determine its time complexity and suggest improvements.
 * @param imageBase64 The base64 encoded string of the code image.
 * @returns A promise that resolves to the code analysis results.
 */
export const analyzeCodeFromImage = async (imageBase64: string): Promise<CodeAnalysisResult> => {
    const textPart = {
        text: `
            You are an expert code analyst specializing in algorithm efficiency. Analyze the provided image of code.
            Your response will be structured as JSON based on the provided schema.

            - Transcribe the code from the image into the 'recognizedCode' field.
            - Determine its Big O time complexity.
            - Explain the reasoning for the time complexity.
            - Provide recommendations for optimization.
            - Provide an optimized version of the code in the 'optimizedCode' field. If the code is already optimal, you can leave this field empty.
            
            If the image does not appear to contain code, or the code is completely illegible, return an error message in the 'error' field.
        `
    };

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: codeAnalysisResponseSchema,
            }
        });

        const parsedData = JSON.parse(response.text) as { error?: string } & CodeAnalysisResult;

        if (parsedData.error) {
            throw new Error(parsedData.error);
        }
        
        if (!parsedData.recognizedCode || !parsedData.timeComplexity || !parsedData.explanation || !parsedData.recommendations) {
            throw new Error("The AI returned an incomplete analysis. Please try again.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error analyzing code image with Gemini API:", error);
        if (error instanceof Error) {
            throw error; // Re-throw known errors
        }
        throw new Error("An unknown error occurred while analyzing the code.");
    }
};

/**
 * Analyzes a string of code to determine its time complexity and suggest improvements.
 * @param code The string of code to analyze.
 * @returns A promise that resolves to the code analysis results.
 */
export const analyzeCodeFromText = async (code: string): Promise<CodeAnalysisResult> => {
    const prompt = `
        You are an expert code analyst specializing in algorithm efficiency. Analyze the provided code.
        Your response must be a valid JSON object based on the provided schema.
        
        - The user's code is provided below. Place it in the 'recognizedCode' field, formatted correctly.
        - Determine its Big O time complexity.
        - Explain the reasoning for the time complexity.
        - Provide recommendations for optimization.
        - Provide an optimized version of the code in the 'optimizedCode' field. If the code is already optimal, you can leave this field empty.

        If the provided text does not appear to be valid code, return an error message in the 'error' field.

        ---
        ${code}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: codeAnalysisResponseSchema,
            }
        });
        
        const parsedData = JSON.parse(response.text) as { error?: string } & CodeAnalysisResult;

        if (parsedData.error) {
            throw new Error(parsedData.error);
        }
        
        if (!parsedData.recognizedCode || !parsedData.timeComplexity || !parsedData.explanation || !parsedData.recommendations) {
            throw new Error("The AI returned an incomplete analysis. Please try again.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error analyzing code text with Gemini API:", error);
        if (error instanceof Error) {
            throw error; // Re-throw known errors
        }
        throw new Error("An unknown error occurred while analyzing the code.");
    }
};

/**
 * Extracts text from a provided image using OCR.
 * @param imageBase64 The base64 encoded string of the image.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (imageBase64: string): Promise<string> => {
    const textPart = {
        text: `
            You are an Optical Character Recognition (OCR) expert. Analyze the provided image and extract all the text content you can find.
            Your response will be structured as JSON based on the provided schema.
            If the image contains no discernible text, return an empty string for "extractedText".
        `
    };

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: extractedTextSchema,
            }
        });

        const parsedData = JSON.parse(response.text) as { extractedText: string };
        
        if (typeof parsedData.extractedText === 'undefined') {
            throw new Error("The AI response did not contain the expected 'extractedText' field.");
        }

        return parsedData.extractedText;

    } catch (error) {
        console.error("Error extracting text from image with Gemini API:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while extracting text from the image.");
    }
};


/**
 * Clarifies a complex concept or text.
 * @param conceptText The text or concept to clarify.
 * @param explanationStyle The desired style of explanation.
 * @returns A promise that resolves to the clarified concept.
 */
export const clarifyConcept = async (conceptText: string, explanationStyle: string): Promise<ClarifiedConcept> => {
    const prompt = `
        You are an expert educator with a talent for making complex topics simple. Your task is to analyze the user's input and break it down into an easy-to-understand explanation.
        Your response must be a valid JSON object based on the provided schema.

        User's Input: "${conceptText}"
        Explanation Style: ${explanationStyle}
        
        Important Rules:
        - If the user's input is a block of text, first identify the core concept and use that for the 'title'.
        - The 'simplifiedExplanation' should directly address the user's input.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: clarifiedConceptSchema,
            }
        });

        const parsedData = JSON.parse(response.text) as ClarifiedConcept;
        
        if (!parsedData.title || !parsedData.simplifiedExplanation || !parsedData.analogy) {
             throw new Error("The AI returned an incomplete explanation. Please try again.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error clarifying concept with Gemini API:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while clarifying the concept.");
    }
};