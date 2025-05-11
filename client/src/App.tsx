import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Worlds from "@/pages/worlds";
import WorldDetail from "@/pages/world-detail";
import Characters from "@/pages/characters";
import CharacterChat from "@/pages/character-chat";
import SceneGenerator from "@/pages/scene-generator";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/worlds" component={Worlds} />
        <Route path="/worlds/:id" component={WorldDetail} />
        <Route path="/characters" component={Characters} />
        <Route path="/chat/:id" component={CharacterChat} />
        <Route path="/scenes" component={SceneGenerator} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
