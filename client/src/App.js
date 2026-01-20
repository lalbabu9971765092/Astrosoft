// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SharedInputLayout from "./components/SharedInputLayout";
import AstrologyForm from "./components/AstrologyForm";
import PlanetDetailsPage from "./components/PlanetDetailsPage";
import GocharPage from "./components/GocharPage";
import KpSignificatorsPage from "./components/KpSignificatorsPage";
import AshtakavargaPage from "./components/AshtakavargaPage";
import FestivalsPage from "./components/FestivalsPage";
import PrashnaTimeLocationPage from "./components/PrashnaTimeLocationPage";
import PrashnaNumberPage from "./components/PrashnaNumberPage";
import VarshphalPage from "./components/VarshphalPage";
import RemediesPage from "./components/RemediesPage";
import MuhurtaPage from "./components/MuhurtaPage";
import MonthlyYogasPage from "./components/MonthlyYogasPage";
import DivisionalChartsPage from "./components/DivisionalChartsPage";
import SavedChartsPage from "./components/SavedChartsPage";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import PrivateRoute from "./components/PrivateRoute";
import api from "./components/api"; // Assuming api setup for context
import MainLayout from "./components/MainLayout";
import MinimalLayout from "./components/MinimalLayout";
import PredictionPage from "./components/PredictionPage"; // Import PredictionPage

// Import the hook and context

import "./App.css";

// --- Context for shared calculation results ---
export const CalculationContext = React.createContext(null);

function AppWrapper() {
  // --- State for shared calculation results ---
  const [mainResult, setMainResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculationInputParams, setCalculationInputParams] = useState(null); // Store input params used

  // --- State for adjustments (passed down via context) ---
  const [adjustedBirthDateTimeString, setAdjustedBirthDateTimeString] =
    useState("");
  const [adjustedGocharDateTimeString, setAdjustedGocharDateTimeString] =
    useState("");
  const [locationForGocharTool, setLocationForGocharTool] = useState({
    lat: null,
    lon: null,
    name: "",
  });

  // --- Function to perform main calculation ---
  const performCalculation = async (params) => {
    setIsLoading(true);
    setError(null);
    setMainResult(null); // Clear previous result
    setCalculationInputParams(params); // Store the input parameters
    setAdjustedBirthDateTimeString(params.date); // Initialize adjusted time
    setAdjustedGocharDateTimeString(""); // Clear gochar time on new calculation
    setLocationForGocharTool({ lat: null, lon: null, name: "" }); // Clear gochar location

    try {
      const response = await api.post("/calculate", params);
      setMainResult(response.data);
    } catch (err) {
      console.error(
        "Main calculation error:",
        err.response?.data || err.message || err,
      );
      const backendError =
        err.response?.data?.error || err.response?.data?.message;
      setError(
        backendError || err.message || "Failed to fetch calculation results.",
      );
      setMainResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Context value ---
  const contextValue = {
    mainResult,
    isLoading,
    error,
    calculationInputParams,
    performCalculation, // Pass down the function
    // Adjustment state and setters
    adjustedBirthDateTimeString,
    setAdjustedBirthDateTimeString,
    adjustedGocharDateTimeString,
    setAdjustedGocharDateTimeString,
    locationForGocharTool,
    setLocationForGocharTool,
  };

  return (
    // Provide the context to all child routes
    <CalculationContext.Provider value={contextValue}>
      <Routes>
        <Route element={<PrivateRoute />}>
          {" "}
          {/* Add PrivateRoute here */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<SharedInputLayout />}>
              <Route index element={<AstrologyForm />} />
              <Route path="planets" element={<PlanetDetailsPage />} />
              <Route path="gochar" element={<GocharPage />} />
              <Route path="kp" element={<KpSignificatorsPage />} />
              <Route path="ashtakavarga" element={<AshtakavargaPage />} />
              <Route path="varshphal" element={<VarshphalPage />} />
              <Route path="muhurta" element={<MuhurtaPage />} />
              <Route path="festivals" element={<FestivalsPage />} />
              <Route path="yogas" element={<PredictionPage />} />{" "}
              {/* New PredictionPage Route */}
              <Route
                path="/divisional-charts"
                element={<DivisionalChartsPage />}
              />
            </Route>
            <Route path="/prashna-time" element={<PrashnaTimeLocationPage />} />
            <Route path="/prashna-number" element={<PrashnaNumberPage />} />
            <Route path="/remedies" element={<RemediesPage />} />
            <Route path="/monthly-yogas" element={<MonthlyYogasPage />} />
          </Route>
        </Route>
        <Route element={<MinimalLayout />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/forgotpassword" element={<ForgotPasswordScreen />} />
          <Route
            path="/resetpassword/:resettoken"
            element={<ResetPasswordScreen />}
          />
          <Route path="" element={<PrivateRoute />}>
            <Route path="/saved-charts" element={<SavedChartsPage />} />
          </Route>
        </Route>
      </Routes>
    </CalculationContext.Provider>
  );
}

// Wrap AppWrapper with Router
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper />
    </Router>
  );
}

export default App;
