import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { HistoryProvider, useHistory } from './context/HistoryContext';
import { DisclaimerScreen } from './pages/Disclaimer/DisclaimerScreen';
import { OnboardingFlow } from './pages/Onboarding/OnboardingFlow';
import { SignupScreen } from './pages/Auth/SignupScreen';
import { ConsentScreen } from './pages/Auth/ConsentScreen';
import { HomeScreen } from './pages/Home/HomeScreen';
import { ScanScreen } from './pages/Scan/ScanScreen';
import { LabelReviewScreen } from './pages/LabelReview/LabelReviewScreen';
import { ResultScreen } from './pages/Result/ResultScreen';
import { HistoryScreen } from './pages/History/HistoryScreen';
import { ProfileScreen } from './pages/Profile/ProfileScreen';
import { BottomNav, TabType } from './components/ui/BottomNav/BottomNav';
import { ScanRecord } from './types/scan';
import { Product } from './types/product';
import { runVerdictEngine } from './engine/verdictEngine';
import { explainVerdict } from './services/edgeFunctions';
import { v4 as uuidv4 } from 'uuid';

// Splash Screen
const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <motion.div
        animate={{ scale: [0.8, 1.05, 1], rotate: [0, 4, 0] }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e88fa7 0%, #c4b5fd 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 50px var(--accent-rose-glow), 0 0 100px rgba(196, 181, 253, 0.4)',
          marginBottom: '20px',
          fontSize: '44px',
        }}
      >
        🌸
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="title-xl"
        style={{ fontSize: '34px', letterSpacing: '-0.03em', marginBottom: '8px' }}
      >
        SHE <span className="gradient-text-rose">Scan</span>
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="body-md"
        style={{ color: 'var(--accent-lavender)', fontWeight: 500 }}
      >
        Know before you eat. Safe food for women's health.
      </motion.p>
    </motion.div>
  );
};

// Main App Controller
const MainAppController: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading, disclaimerAccepted, acceptDisclaimer } = useProfile();
  const { addScan } = useHistory();

  // Navigation states
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [onboardingCompletedLocally, setOnboardingCompletedLocally] = useState(false);
  const [isAuthSuccessPendingConsent, setIsAuthSuccessPendingConsent] = useState(false);

  // Scan & Result active records
  const [currentResultRecord, setCurrentResultRecord] = useState<ScanRecord | null>(null);
  const [extractedOcrData, setExtractedOcrData] = useState<Partial<Product> | null>(null);

  // 1. Splash Screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. First-launch medical disclaimer
  if (!disclaimerAccepted) {
    return <DisclaimerScreen onAccept={acceptDisclaimer} />;
  }

  // 3. User onboarding & auth pipeline
  if (!profile) {
    if (!onboardingCompletedLocally) {
      return (
        <OnboardingFlow
          onComplete={() => setOnboardingCompletedLocally(true)}
        />
      );
    }

    if (!user && !isAuthSuccessPendingConsent) {
      return (
        <SignupScreen
          onSuccess={() => setIsAuthSuccessPendingConsent(true)}
        />
      );
    }

    // Auth succeeded, present mandatory health data consent before saving profile
    return (
      <ConsentScreen
        onConsented={() => {
          setIsAuthSuccessPendingConsent(false);
          setActiveTab('home');
        }}
      />
    );
  }

  // 4. Label Review Screen (after OCR before verdict)
  if (extractedOcrData) {
    const handleConfirmOcr = async (confirmedProduct: Product) => {
      // Run verdict engine
      const verdict = runVerdictEngine(confirmedProduct, profile);

      const conditionSummaries = [
        ...profile.lifeStages.map((s) => s.toUpperCase()),
        profile.diabetesType !== 'none' ? profile.diabetesType.toUpperCase() : null,
        profile.lactoseIntolerant ? 'Lactose Intolerant' : null,
      ].filter(Boolean) as string[];

      const explResult = await explainVerdict(
        confirmedProduct,
        verdict,
        conditionSummaries,
        profile.allergies,
        profile.id
      );

      const record: ScanRecord = {
        id: uuidv4(),
        userId: profile.id,
        source: 'ocr',
        product: confirmedProduct,
        verdict,
        explanation: explResult.explanation,
        rulesVersion: verdict.rulesVersion,
        scannedAt: new Date().toISOString(),
      };

      await addScan(record);
      setExtractedOcrData(null);
      setCurrentResultRecord(record);
    };

    return (
      <LabelReviewScreen
        initialData={extractedOcrData}
        onConfirm={handleConfirmOcr}
        onCancel={() => setExtractedOcrData(null)}
      />
    );
  }

  // 5. Result Screen
  if (currentResultRecord) {
    return (
      <ResultScreen
        record={currentResultRecord}
        onScanAnother={() => {
          setCurrentResultRecord(null);
          setActiveTab('scan');
        }}
        onBack={() => {
          setCurrentResultRecord(null);
        }}
      />
    );
  }

  // 6. Active Tabs
  return (
    <div className="app-viewport">
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HomeScreen
                onStartScan={() => setActiveTab('scan')}
                onOpenHistory={() => setActiveTab('history')}
                onOpenProfile={() => setActiveTab('profile')}
                onSelectScan={(record) => setCurrentResultRecord(record)}
              />
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ScanScreen
                onBack={() => setActiveTab('home')}
                onScanComplete={(record) => setCurrentResultRecord(record)}
                onStartReview={(extracted) => setExtractedOcrData(extracted)}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryScreen
                onSelectScan={(record) => setCurrentResultRecord(record)}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setCurrentResultRecord(null);
          setExtractedOcrData(null);
          setActiveTab(tab);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <HistoryProvider>
          <MainAppController />
        </HistoryProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
