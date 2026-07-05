export const VEHICLE_MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "Jeep",
  "Hyundai",
  "Subaru",
  "Tesla",
  "BMW",
  "Mercedes-Benz",
  "Lexus",
  "Dodge",
  "Ram",
  "GMC",
  "Kia",
  "Mazda",
  "Volkswagen"
];

export const VEHICLE_MODELS: Record<string, string[]> = {
  "Toyota": ["Camry", "Corolla", "RAV4", "Prius", "Tacoma", "Tundra", "Highlander", "Sienna", "4Runner"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "Fit", "Ridgeline", "HR-V"],
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Edge", "Focus", "Fusion", "Ranger", "Bronco"],
  "Chevrolet": ["Silverado", "Equinox", "Malibu", "Tahoe", "Suburban", "Cruze", "Camaro", "Colorado", "Bolt EV"],
  "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Murano", "Titan", "Versa", "LEAF"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona", "Ioniq 5", "Accent"],
  "Subaru": ["Outback", "Forester", "Impreza", "Legacy", "Crosstrek", "WRX", "Ascent"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "BMW": ["3 Series", "5 Series", "X3", "X5", "7 Series", "M3", "i4"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class", "A-Class", "Sprinter"],
  "Lexus": ["RX", "ES", "NX", "IS", "GX", "LS", "UX"],
  "Dodge": ["Charger", "Challenger", "Durango", "Grand Caravan", "Dart"],
  "Ram": ["1500", "2500", "3500", "ProMaster"],
  "GMC": ["Sierra", "Acadia", "Terrain", "Yukon", "Canyon"],
  "Kia": ["Optima", "Sorento", "Sportage", "Soul", "Forte", "Telluride", "EV6", "Rio"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9", "CX-30", "MX-5 Miata"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Golf", "Atlas", "ID.4", "Beetle"]
};

export interface VehicleSpecs {
  isValid: boolean;
  confidence: number;
  normalizedMake: string;
  normalizedModel: string;
  normalizedYear: number;
  type: string;
  engine: string;
  fuelType: string;
  oilSpec: string;
  tirePressure: string;
  coolantCapacity: string;
  commonIssues: string[];
  recalls: string[];
  maintenanceSchedule: string[];
  typoCorrected: boolean;
  originalMake: string;
  originalModel: string;
  dataSource: "gemini_ai" | "local_database_fallback";
}

export const LOCAL_VEHICLE_SPECS: Record<string, Partial<VehicleSpecs>> = {
  "toyota_camry": {
    type: "Sedan",
    engine: "2.5L 4-Cylinder DOHC (Dynamic Force)",
    fuelType: "Regular Unleaded",
    oilSpec: "SAE 0W-20 (4.6 quarts with filter replacement)",
    tirePressure: "35 PSI (Front) / 35 PSI (Rear)",
    coolantCapacity: "7.2 quarts (Toyota Super Long Life Coolant)",
    commonIssues: [
      "Torque converter shudder in older 6-speed models (2012-2014)",
      "Minor interior dashboard squeaks or rattle over bumps",
      "Power steering pump leakage in models older than 2011",
      "Excessive engine oil consumption in 2.4L engines (2007-2009)"
    ],
    recalls: [
      "Low-pressure fuel pump failure recall (2018-2020 models)",
      "Occasional airbag sensor calibration recall (2020-2021 models)"
    ],
    maintenanceSchedule: [
      "Replace Engine Oil & Filter: Every 5,000 - 10,000 miles",
      "Rotate Tires: Every 5,000 miles",
      "Replace Cabin & Engine Air Filters: Every 15,000 - 30,000 miles",
      "Replace Spark Plugs: Every 100,000 miles",
      "Flush Engine Coolant: Every 100,000 miles"
    ]
  },
  "honda_civic": {
    type: "Sedan / Hatchback",
    engine: "1.5L Turbocharged 4-Cylinder DOHC",
    fuelType: "Regular Unleaded",
    oilSpec: "SAE 0W-20 (3.7 quarts with filter replacement)",
    tirePressure: "32 PSI (Front) / 32 PSI (Rear)",
    coolantCapacity: "5.8 quarts (Honda Type 2 Blue Coolant)",
    commonIssues: [
      "Engine oil dilution in short-distance cold-weather driving (1.5T engine)",
      "A/C condenser leak or compressor shaft seal leak (2016-2020 models)",
      "Electric power steering rack binding or sticky steering sensation (2022-2023)"
    ],
    recalls: [
      "Fuel pump impeller swelling and stalling recall (2018-2020 models)",
      "Steering gearbox gear replacement recall (2022-2024 models)"
    ],
    maintenanceSchedule: [
      "Replace Engine Oil & Filter: Every 7,500 miles (or by Maintenance Minder)",
      "Rotate Tires: Every 7,500 miles",
      "Replace Brake Fluid: Every 3 years regardless of mileage",
      "Inspect & Adjust Valve Clearance: Every 60,000 miles",
      "Replace Spark Plugs: Every 100,000 miles"
    ]
  },
  "ford_f-150": {
    type: "Pickup Truck",
    engine: "3.5L EcoBoost V6 Twin-Turbo",
    fuelType: "Regular Unleaded / Premium Recommended for Towing",
    oilSpec: "SAE 5W-30 (6.0 quarts with filter)",
    tirePressure: "35 PSI (Front) / 40 PSI (Rear) (May vary based on payload config)",
    coolantCapacity: "12.0 quarts (Motorcraft Orange/Yellow Coolant)",
    commonIssues: [
      "Cam phaser rattle or knocking sound on cold start (3.5L Twin-Turbo)",
      "10R80 10-speed transmission harsh shifting, gear skipping, or hesitating",
      "Exhaust manifold warp or broken mounting studs causing ticking leaks",
      "Spark plug premature wear causing high-load engine misfires"
    ],
    recalls: [
      "Transmission downshift safety recall to 1st gear (2017-2018 models)",
      "Electric parking brake unintended activation (2021-2023 models)",
      "Windshield wiper motor failure recall (2020-2022 models)"
    ],
    maintenanceSchedule: [
      "Replace Engine Oil & Filter: Every 7,500 miles / 1 year",
      "Rotate Tires: Every 7,500 miles",
      "Replace Engine Air Filter: Every 30,000 miles",
      "Flush Transmission Fluid & Filter: Every 150,000 miles",
      "Replace Spark Plugs: Every 60,000 miles under severe load, or 100,000 miles"
    ]
  },
  "tesla_model_3": {
    type: "Sedan (Electric)",
    engine: "Dual Motor / Single Motor Permanent Magnet AC",
    fuelType: "Electric (Lithium-Ion Battery pack)",
    oilSpec: "N/A (No engine oil required. Reducer gearbox oil is lifetime)",
    tirePressure: "42 PSI (Front) / 42 PSI (Rear)",
    coolantCapacity: "Battery Thermal Coolant (Lifetime G-48 liquid fluid)",
    commonIssues: [
      "Upper control arm bushing wear causing squeaking or creaking sounds",
      "Rear bumper cover detaching when driving through deep standing water",
      "Moisture buildup inside the rear LED taillight lenses",
      "Cabin water ingress from misaligned trunk or door weather seals"
    ],
    recalls: [
      "Autopilot software update for enhanced driver monitoring (OTA update)",
      "Rearview camera coaxial cable wear from trunk lid opens (2017-2020 models)"
    ],
    maintenanceSchedule: [
      "Cabin Air Filter Replacement: Every 2 years",
      "Brake Caliper Clean & Lube: Annual (especially in road-salt climates)",
      "Wheel Alignment check: Every 12,000 miles",
      "A/C Desiccant Bag replacement: Every 4-6 years",
      "Brake Fluid Test for Moisture: Every 2 years"
    ]
  },
  "jeep_wrangler": {
    type: "SUV (Off-Road)",
    engine: "3.6L Pentastar V6 with eTorque",
    fuelType: "Regular Unleaded",
    oilSpec: "SAE 0W-20 (5.0 quarts with filter)",
    tirePressure: "35 PSI (Front) / 35 PSI (Rear)",
    coolantCapacity: "10.1 quarts (Mopar OAT 10 Year Coolant)",
    commonIssues: [
      "Death Wobble (violent front-end shaking after hitting bumps at highway speeds)",
      "Plastic oil filter adapter housing cracking and leaking oil into engine V",
      "Aluminium door hinge galvanic corrosion causing bubbling paint",
      "Occasional water leaks through the soft top zippers or removable Freedom panels"
    ],
    recalls: [
      "Steering damper stabilizer replacement for wobble issues (2018-2020 models)",
      "Hybrid 4xe power controller battery shutoff hazard (4xe PHEV models only)"
    ],
    maintenanceSchedule: [
      "Replace Engine Oil & Filter: Every 7,500 miles (or Oil Life indicator)",
      "Rotate Tires: Every 5,000 miles (5-tire rotation recommended)",
      "Inspect Transfer Case Fluid: Every 30,000 miles",
      "Replace Spark Plugs: Every 100,000 miles",
      "Change Front and Rear Axle Fluids: Every 40,000 miles under off-road use"
    ]
  }
};

export function getLocalSpecs(make: string, model: string, year: number): VehicleSpecs {
  const normMake = make.trim().toLowerCase();
  const normModel = model.trim().toLowerCase();
  const key = `${normMake}_${normModel}`;
  const defaultSpecs = LOCAL_VEHICLE_SPECS[key] || {
    type: "Passenger Vehicle",
    engine: "Standard Inline 4-Cylinder or V6 Engine",
    fuelType: "Regular Unleaded",
    oilSpec: "SAE 5W-30 (4.5 to 5.0 quarts with filter replacement)",
    tirePressure: "32 PSI (Front) / 32 PSI (Rear)",
    coolantCapacity: "6.5 quarts (Universal Extended Life Coolant)",
    commonIssues: [
      "Standard wear items like front brake pads and rotors.",
      "Wear on suspension struts and shock absorbers over 80,000 miles.",
      "Occasional minor vacuum leaks or oxygen sensor failures around 100,000 miles."
    ],
    recalls: [
      "No critical active safety recalls found in our immediate local offline database."
    ],
    maintenanceSchedule: [
      "Replace Engine Oil & Filter: Every 5,000 - 7,500 miles",
      "Rotate Tires & Inspect Brakes: Every 7,500 miles",
      "Inspect Engine Drive Belts & Hoses: Every 45,000 miles",
      "Replace Cabin & Engine Air Filters: Every 20,000 miles"
    ]
  };

  // Typo checking for common brands
  let resolvedMake = make.trim();
  let resolvedModel = model.trim();
  let typoCorrected = false;

  // Let's do simple fuzzy spelling fixes for makes
  const makeLower = resolvedMake.toLowerCase();
  if (makeLower.includes("toy") || makeLower.includes("toyo") || makeLower.includes("totoy")) {
    if (resolvedMake !== "Toyota") { resolvedMake = "Toyota"; typoCorrected = true; }
  } else if (makeLower.includes("hon") || makeLower.includes("hond")) {
    if (resolvedMake !== "Honda") { resolvedMake = "Honda"; typoCorrected = true; }
  } else if (makeLower.includes("for") || makeLower.includes("fod")) {
    if (resolvedMake !== "Ford") { resolvedMake = "Ford"; typoCorrected = true; }
  } else if (makeLower.includes("che") || makeLower.includes("chev")) {
    if (resolvedMake !== "Chevrolet") { resolvedMake = "Chevrolet"; typoCorrected = true; }
  } else if (makeLower.includes("nis") || makeLower.includes("niss")) {
    if (resolvedMake !== "Nissan") { resolvedMake = "Nissan"; typoCorrected = true; }
  } else if (makeLower.includes("jee") || makeLower.includes("jep")) {
    if (resolvedMake !== "Jeep") { resolvedMake = "Jeep"; typoCorrected = true; }
  } else if (makeLower.includes("sub") || makeLower.includes("subu")) {
    if (resolvedMake !== "Subaru") { resolvedMake = "Subaru"; typoCorrected = true; }
  } else if (makeLower.includes("tes") || makeLower.includes("tess")) {
    if (resolvedMake !== "Tesla") { resolvedMake = "Tesla"; typoCorrected = true; }
  }

  // Model corrections
  const modelLower = resolvedModel.toLowerCase();
  if (resolvedMake === "Toyota" && (modelLower.includes("cam") || modelLower.includes("cmry"))) {
    if (resolvedModel !== "Camry") { resolvedModel = "Camry"; typoCorrected = true; }
  } else if (resolvedMake === "Honda" && (modelLower.includes("civ") || modelLower.includes("cvic"))) {
    if (resolvedModel !== "Civic") { resolvedModel = "Civic"; typoCorrected = true; }
  } else if (resolvedMake === "Ford" && (modelLower.includes("150") || modelLower.includes("f150"))) {
    if (resolvedModel !== "F-150") { resolvedModel = "F-150"; typoCorrected = true; }
  } else if (resolvedMake === "Tesla" && (modelLower.includes("3") || modelLower.includes("mod3"))) {
    if (resolvedModel !== "Model 3") { resolvedModel = "Model 3"; typoCorrected = true; }
  } else if (resolvedMake === "Jeep" && (modelLower.includes("wrang") || modelLower.includes("rang"))) {
    if (resolvedModel !== "Wrangler") { resolvedModel = "Wrangler"; typoCorrected = true; }
  }

  return {
    isValid: VEHICLE_MAKES.includes(resolvedMake),
    confidence: VEHICLE_MAKES.includes(resolvedMake) ? 0.95 : 0.4,
    normalizedMake: resolvedMake,
    normalizedModel: resolvedModel,
    normalizedYear: isNaN(year) ? 2020 : year,
    type: defaultSpecs.type!,
    engine: defaultSpecs.engine!,
    fuelType: defaultSpecs.fuelType!,
    oilSpec: defaultSpecs.oilSpec!,
    tirePressure: defaultSpecs.tirePressure!,
    coolantCapacity: defaultSpecs.coolantCapacity!,
    commonIssues: defaultSpecs.commonIssues!,
    recalls: defaultSpecs.recalls!,
    maintenanceSchedule: defaultSpecs.maintenanceSchedule!,
    typoCorrected,
    originalMake: make,
    originalModel: model,
    dataSource: "local_database_fallback"
  };
}
