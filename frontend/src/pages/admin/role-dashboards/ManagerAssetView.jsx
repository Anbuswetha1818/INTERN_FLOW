/**
 * SIMS — Manager Asset View (read-only)
 * Manager can VIEW asset details but cannot modify.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Table, TableBody, TableCell,
         TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { Inventory, CheckCircle, Error, Devices } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { StatCard } from '../../../components/common';
import api from '../../../services/api';

export default function ManagerAssetView() {
  const [assets, setAssets] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/Sims/assert-stock/'),
      api.get('/Sims/assert-stock-count/'),
    ])
      .then(([assetsRes, countsRes]) => {
        setAssets(assetsRes.data);
        setCounts(countsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusStyles = {
    available: { bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.2)' },
    assigned: { bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.2)' },
    damaged: { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' },
    lost: { bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#c2410c', border: '1px solid rgba(245, 158, 11, 0.2)' },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Poppins", sans-serif' }}>Asset Overview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Poppins", sans-serif' }}>
            View-only — asset inventory and assignments
          </Typography>
        </Box>
        <Chip 
          label="View Only" 
          size="small" 
          sx={{ 
            bgcolor: 'rgba(245, 158, 11, 0.1)', 
            color: '#c2410c', 
            fontWeight: 600, 
            fontFamily: '"Poppins", sans-serif',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            px: 0.5
          }} 
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Equal Fraction Boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              { label: 'Total Assets',  value: counts.total || 0,     color: 'var(--color-primary)', icon: <Inventory /> },
              { label: 'Available',     value: counts.available || 0, color: '#22c55e',              icon: <CheckCircle /> },
              { label: 'Assigned',      value: counts.assigned || 0,  color: '#3b82f6',              icon: <Devices /> },
              { label: 'Damaged / Lost',value: (counts.damaged || 0) + (counts.lost || 0), color: '#ef4444', icon: <Error /> },
            ].map((s, i) => (
              <StatCard {...s} delay={i * 0.05} key={i} />
            ))}
          </div>

          <Box className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ fontFamily: '"Poppins", sans-serif' }}>
              Asset Inventory
            </Typography>
            {assets.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '8px', fontFamily: '"Poppins", sans-serif' }}>
                No assets found.
              </Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Code', 'Type', 'Brand / Model', 'Status', 'Assigned To', 'Condition'].map((head) => (
                      <TableCell key={head} sx={{ fontWeight: 700, color: 'var(--text-secondary)', fontFamily: '"Poppins", sans-serif', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1.75 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: '"Poppins", sans-serif', color: 'var(--text-primary)' }}>
                          {a.asset_code}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        {a.asset_type}
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        {a.name || '—'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                        <Chip 
                          label={a.status} 
                          size="small" 
                          sx={{ 
                            ...statusStyles[a.status] || { bgcolor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary)' },
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            fontSize: '0.75rem',
                            fontFamily: '"Poppins", sans-serif'
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: 'var(--text-primary)', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>
                        {a.assigned_to_name || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        {a.condition}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </>
      )}
    </motion.div>
  );
}
