import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ElevenLabsWidget from '../components/ElevenLabsWidget';

const MainLayout = () => {
  return (
    <div className="layout-wrapper">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <ElevenLabsWidget />
    </div>
  );
};

export default MainLayout;

