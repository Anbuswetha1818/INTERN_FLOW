import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import InternLists from '../admin/InternLists';
import OnboardingList from './OnboardingList';
import { useAuth } from '../../contexts/AuthContext';

export default function InternDirectory() {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'onboarding' ? 1 : 0;
  
  const [tabValue, setTabValue] = useState(initialTab);
  
  const isAdmin = user?.role === 'superadmin';

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {isAdmin ? (
        <div className="page-head">
          <div>
            <h1 className="page-title">Intern Management</h1>
            <p className="page-sub">View and manage the complete intern lifecycle.</p>
          </div>
        </div>
      ) : (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary" 
            textColor="primary"
            sx={{ '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem', textTransform: 'none' } }}
          >
            <Tab label="Active Interns" />
            <Tab label="Onboarding Approvals" />
          </Tabs>
        </Box>
      )}

      <Box>
        {(tabValue === 0 || isAdmin) && <InternLists isCombined={true} />}
        {tabValue === 1 && !isAdmin && <OnboardingList isCombined={true} />}
      </Box>
    </motion.div>
  );
}
