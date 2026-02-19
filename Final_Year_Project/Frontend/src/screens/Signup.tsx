import { SignUp, SignedIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

function Signup() {
  return (
    <>
      {/* Redirect if already logged in */}
      <SignedIn>
        <Navigate to="/home" replace />
      </SignedIn>

      {/* Show only signup page */}
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <SignUp
          path="/signup"
          routing="path"
          signInUrl="/login"
          redirectUrl="/home"
        />
      </div>
    </>
  );
}

export default Signup;
