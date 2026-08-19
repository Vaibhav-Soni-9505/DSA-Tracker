import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/app/providers";
import { ProgressProvider } from "@/hooks/useProgress";
import { SimulatedDateProvider } from "@/hooks/useSimulatedDate";
import { AuthProvider } from "@/features/auth/AuthContext";
import { router } from "@/app/router";

export default function App() {
  return (
    <ThemeProvider>
      <SimulatedDateProvider>
        <AuthProvider>
          <ProgressProvider>
            <RouterProvider router={router} />
          </ProgressProvider>
        </AuthProvider>
      </SimulatedDateProvider>
    </ThemeProvider>
  );
}
