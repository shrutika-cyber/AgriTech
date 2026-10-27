import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';
import { Loading } from './components/ui.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Farms = lazy(() => import('./pages/Farms.jsx'));
const Crops = lazy(() => import('./pages/Crops.jsx'));
const Soil = lazy(() => import('./pages/Soil.jsx'));
const Advisor = lazy(() => import('./pages/Advisor.jsx'));
const Alerts = lazy(() => import('./pages/Alerts.jsx'));
const Weather = lazy(() => import('./pages/Weather.jsx'));
const Market = lazy(() => import('./pages/Market.jsx'));
const Community = lazy(() => import('./pages/Community.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const guard = (el) => <Protected>{el}</Protected>;

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/farms" element={guard(<Farms />)} />
          <Route path="/crops" element={guard(<Crops />)} />
          <Route path="/soil" element={guard(<Soil />)} />
          <Route path="/advisor" element={guard(<Advisor />)} />
          <Route path="/alerts" element={guard(<Alerts />)} />
          <Route path="/weather" element={guard(<Weather />)} />
          <Route path="/market" element={guard(<Market />)} />
          <Route path="/community" element={guard(<Community />)} />
          <Route path="/profile" element={guard(<Profile />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
