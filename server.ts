import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { VEHICLE_MAKES, VEHICLE_MODELS, getLocalSpecs } from "./src/localRegistry.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("[Gemini] API Client initialized successfully.");
  } catch (err) {
    console.error("[Gemini] Error initializing GoogleGenAI client:", err);
  }
} else {
  console.log("[Gemini] No valid API Key found. App will run in offline local database fallback mode.");
}

// API Routes

// 1. Get standard makes
app.get("https://car-make-model-validator-47453693119.asia-southeast1.run.app/api/makes", (req, res) => {
  res.json({ makes: VEHICLE_MAKES });
});

// 2. Get standard models for a given make
app.get("https://car-make-model-validator-47453693119.asia-southeast1.run.app/api/models", (req, res) => {
  const make = req.query.make as string;
  if (!make) {
    return res.status(400).json({ error: "Missing 'make' query parameter." });
  }

  // Case-insensitive search
  const foundMake = VEHICLE_MAKES.find(
    (m) => m.toLowerCase() === make.trim().toLowerCase()
  );

  if (foundMake) {
    res.json({ make: foundMake, models: VEHICLE_MODELS[foundMake] || [] });
  } else {
    // If we don't recognize the make, return an empty array
    res.json({ make, models: [] });
  }
});

// 3. Validate make and model (incorporates spotty connection simulation & fallbacks)
app.post("https://car-make-model-validator-47453693119.asia-southeast1.run.app/api/validate", async (req, res) => {
  const { make, model, year, simulateOffline, simulateDelay } = req.body;

  if (!make || !model || !year) {
    return res.status(400).json({
      error: "Missing required fields. Please specify 'make', 'model', and 'year'."
    });
  }

  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2027) {
    return res.status(400).json({
      error: "Invalid year. Please enter a valid model year between 1900 and 2027."
    });
  }

  // Simulate network delay if requested by user for the Unhappy Path (Spotty 3G)
  if (simulateDelay) {
    console.log(`[Network Simulation] Delaying response by 3000ms to mimic 3G...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Check if simulated offline mode is enabled
  if (simulateOffline) {
    console.log(`[Network Simulation] Offline mode simulated. Returning local database fallback.`);
    const fallbackData = getLocalSpecs(make, model, parsedYear);
    return res.json({
      ...fallbackData,
      dataSource: "local_database_fallback",
      offlineStatus: "simulated_offline"
    });
  }

  // If Gemini API is available, try to fetch specifications
  if (ai) {
    try {
      console.log(`[Gemini] Requesting validation for: ${parsedYear} ${make} ${model}`);
      const prompt = `Please validate the following vehicle details and provide technical specifications for auto shop floor staff:
Year: ${parsedYear}
Make: "${make}"
Model: "${model}"

If there are obvious spelling errors or typos in the make or model (e.g., "Toyta" -> "Toyota", "Camryy" -> "Camry", "hond" -> "Honda"), correct them and set typoCorrected to true.
Provide highly realistic technical specifications. If the vehicle is completely unrecognized, fictional, or has never existed, set isValid to false and provide a low confidence. Keep the specifications grounded in true mechanical reality.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN, description: "Whether this is a real, commercially sold car model in the specified year" },
              confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
              normalizedMake: { type: Type.STRING, description: "The corrected, capitalized standard manufacturer name" },
              normalizedModel: { type: Type.STRING, description: "The corrected, capitalized standard model name" },
              normalizedYear: { type: Type.INTEGER, description: "The model year" },
              type: { type: Type.STRING, description: "Vehicle category (e.g. Sedan, SUV, Truck, Coupe, Van, Wagon)" },
              engine: { type: Type.STRING, description: "Standard, typical engine configuration for this model (e.g., '2.5L 4-Cylinder DOHC' or '3.5L V6')" },
              fuelType: { type: Type.STRING, description: "Standard fuel type (e.g. Regular Unleaded, Premium Unleaded, Diesel, Electric)" },
              oilSpec: { type: Type.STRING, description: "Recommended oil weight and crankcase capacity with filter (e.g., 'SAE 0W-20 (4.6 quarts)')" },
              tirePressure: { type: Type.STRING, description: "Recommended standard cold tire pressure (e.g., '32 PSI Front / 32 PSI Rear')" },
              coolantCapacity: { type: Type.STRING, description: "Coolant capacity and coolant fluid type spec" },
              commonIssues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-4 typical mechanical or electrical failures, wear items, or TSB notices for this model/year"
              },
              recalls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 1-3 critical safety recalls or major recall bulletins for this model range"
              },
              maintenanceSchedule: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 4-5 key maintenance checklist steps and intervals (e.g. rotating tires, engine oil flushes, timing belt changes)"
              },
              typoCorrected: { type: Type.BOOLEAN, description: "Whether a spelling mistake was detected and corrected" }
            },
            required: [
              "isValid", "confidence", "normalizedMake", "normalizedModel", "normalizedYear",
              "type", "engine", "fuelType", "oilSpec", "tirePressure", "coolantCapacity",
              "commonIssues", "recalls", "maintenanceSchedule", "typoCorrected"
            ]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const result = JSON.parse(responseText.trim());
        console.log(`[Gemini] Validation successful. Result parsed.`);
        return res.json({
          ...result,
          originalMake: make,
          originalModel: model,
          dataSource: "gemini_ai"
        });
      }
    } catch (err) {
      console.error("[Gemini] API Call failed or timed out. Falling back to local offline specs registry:", err);
      // Fallback on error to satisfy spotty internet criteria
      const fallbackData = getLocalSpecs(make, model, parsedYear);
      return res.json({
        ...fallbackData,
        dataSource: "local_database_fallback",
        networkError: true
      });
    }
  }

  // Fallback if no Gemini Client is available
  console.log(`[Fallback] Running lookup on local vehicle specs dictionary.`);
  const localData = getLocalSpecs(make, model, parsedYear);
  return res.json(localData);
});

// Configure Vite middleware in development or static folder in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Vite] Middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Production] Static files served from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
