import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { PersonAdd } from '@mui/icons-material';

const MOCK_INTERNS = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    status: 'Active',
    domain: 'Full Stack',
    entity: 'InternFlow',
    joinDate: '2026-01-15'
  },
  {
    id: 2,
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'Backend',
    status: 'Onboarding',
    joiningDate: '2026-06-15'
  }
];

export default function InternManagementLists() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box
        className="page-header"
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Intern Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View all interns and their details.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<PersonAdd />}>
          Add Intern
        </Button>
      </Box>

      <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joining Date</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {MOCK_INTERNS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {row.name}
                    </Typography>
                  </TableCell>

                  <TableCell>{row.email}</TableCell>

                  <TableCell>{row.role}</TableCell>

                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={
                        row.status === 'Active'
                          ? 'success'
                          : 'warning'
                      }
                    />
                  </TableCell>

                  <TableCell>{row.joiningDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      </Paper>
    </motion.div>
  );
}