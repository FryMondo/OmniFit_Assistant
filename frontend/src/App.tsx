import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Auth from './pages/Auth/Auth.tsx';
import Dashboard from './pages/Dashboard/Dashboard.tsx';
import Nutrition from './pages/Nutrition/Nutrition.tsx';
import MacroCalculator from './pages/MacroCalculator/MacroCalculator.tsx';
import MyMeals from "./pages/MyMeals/MyMeals.tsx";
import Profile from "./pages/Profile/Profile.tsx";
import Workouts from "./pages/Workouts/Workouts.tsx";
import ProgramGenerator from "./pages/ProgramGenerator/ProgramGenerator.tsx";
import MyPlan from "./pages/MyPlan/MyPlan.tsx";
import PersonalRecords from "./pages/PersonalRecords/PersonalRecords.tsx";
import Gyms from "./pages/Gyms/Gyms.tsx";
import GymDetails from "./pages/Gyms/GymDetails.tsx";
import CoachClients from "./pages/CoachClients/CoachClients.tsx";
import ManagerDashboard from "./pages/Manager/ManagerDashboard.tsx";

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/auth" element={<Auth/>}/>

                    <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <Dashboard/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/nutrition/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <Nutrition/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/calculator/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <MacroCalculator/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/meals/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <MyMeals/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/workouts/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <Workouts/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/generator/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <ProgramGenerator/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/my-plan/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <MyPlan/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/records/:userId?" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <PersonalRecords/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/gyms" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <Gyms/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/gyms/:id" element={
                        <ProtectedRoute allowedRoles={['athlete', 'coach']}>
                            <GymDetails/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/profile/:userId?" element={
                        <ProtectedRoute>
                            <Profile/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/clients" element={
                        <ProtectedRoute allowedRoles={['coach']}>
                            <CoachClients/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/manager/dashboard" element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerDashboard/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/" element={<Navigate to="/auth" replace/>}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;