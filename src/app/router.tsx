import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import SheetPage from "@/features/sheet/pages/SheetPage";
import RevisionPage from "@/features/revision/pages/RevisionPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "sheet", element: <SheetPage /> },
      { path: "revision", element: <RevisionPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
