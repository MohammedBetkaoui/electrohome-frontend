import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes.tsx";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./data/store";

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            duration: 3500,
            style: { fontFamily: "inherit" },
          }}
        />
      </StoreProvider>
    </AuthProvider>
  );
}