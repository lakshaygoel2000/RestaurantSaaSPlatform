import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            404
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
