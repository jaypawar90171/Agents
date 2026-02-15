import { SignIn, SignedIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

function Login() {
  return (
    <>
      {/* Redirect if already logged in */}
      <SignedIn>
        <Navigate to="/home" replace />
      </SignedIn>

      {/* Show only login page */}
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
          redirectUrl="/home"
        />
      </div>
    </>
  );
}

export default Login;
