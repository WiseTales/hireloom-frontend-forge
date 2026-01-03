import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CompanySignup from "./pages/CompanySignup";
import Dashboard from "./pages/Dashboard";
import JobBoard from "./pages/JobBoard";
import JobDetail from "./pages/JobDetail";
import JobApply from "./pages/JobApply";
import SearchResults from "./pages/SearchResults";
import SavedJobs from "./pages/SavedJobs";
import AppliedJobs from "./pages/AppliedJobs";
import Feed from "./pages/Feed";
import NetworkSearch from "./pages/NetworkSearch";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Moderation from "./pages/Moderation";
import Events from "./pages/Events";
import SearchGlobal from "./pages/SearchGlobal";
import Interviews from "./pages/Interviews";
import InterviewFeedback from "./pages/InterviewFeedback";
import Referrals from "./pages/Referrals";
import Articles from "./pages/Articles";
import ArticleEditor from "./pages/ArticleEditor";
import ArticleView from "./pages/ArticleView";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Company from "./pages/Company";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<CompanySignup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<JobBoard />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/jobs/:id/apply" element={<JobApply />} />
              <Route path="/saved" element={<SavedJobs />} />
              <Route path="/applied" element={<AppliedJobs />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/interview/:id/feedback" element={<InterviewFeedback />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/network-search" element={<NetworkSearch />} />
              <Route path="/search-global" element={<SearchGlobal />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/events" element={<Events />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/article/new" element={<ArticleEditor />} />
              <Route path="/article/:id/edit" element={<ArticleEditor />} />
              <Route path="/article/:id" element={<ArticleView />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/company/:id" element={<Company />} />
              <Route path="/profile/:userId?" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
