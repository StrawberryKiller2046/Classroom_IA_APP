import { HashRouter, Route, Routes } from "react-router-dom"
import AppShell from "@/components/layout/AppShell"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import ActivityGenerator from "@/pages/ActivityGenerator"
import ActivityHistory from "@/pages/ActivityHistory"
import Classrooms from "@/pages/Classrooms"
import ClassroomDetail from "@/pages/ClassroomDetail"
import GradingScreen from "@/pages/GradingScreen"
import Dashboard from "@/pages/Dashboard"
import Planner from "@/pages/Planner"
import PlannerEditor from "@/pages/PlannerEditor"

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ActivityGenerator />} />
          <Route path="/history" element={<ActivityHistory />} />
          <Route path="/classrooms" element={<Classrooms />} />
          <Route path="/classrooms/:classroomId" element={<ClassroomDetail />} />
          <Route
            path="/classrooms/:classroomId/grade/:activityId/:studentId"
            element={<GradingScreen />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/planner/:planId" element={<PlannerEditor />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
