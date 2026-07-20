import { useState, useRef, useEffect } from 'react';
import { Box, InputBase, Popper, Paper, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Search as SearchIcon, Description as DescriptionIcon, Task as TaskIcon, Person as PersonIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usersAPI, tasksAPI, documentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Clear search bar and close results on navigation
  useEffect(() => {
    setQuery('');
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const [usersRes, tasksRes, docsRes] = await Promise.allSettled([
          usersAPI.list({ search: query }),
          tasksAPI.list({ search: query }),
          documentsAPI.list(),
        ]);

        const newResults = [];

        // 1. Process Users
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
          usersRes.value.data.forEach((u) => {
            const isIntern = u.role === 'intern';
            const targetUrl = user?.role === 'intern' 
              ? '/intern-user/profile' 
              : (isIntern ? '/admin/intern-directory' : '/admin/staff');
            
            newResults.push({
              id: `user-${u.emp_id}`,
              type: 'User',
              title: u.full_name || u.username,
              desc: `${u.role} • ID: ${u.emp_id}`,
              icon: <PersonIcon sx={{ color: 'var(--success-500)' }} />,
              url: targetUrl,
            });
          });
        }

        // 2. Process Tasks
        if (tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value.data)) {
          tasksRes.value.data.forEach((t) => {
            const targetUrl = user?.role === 'intern'
              ? '/intern-user/tasks'
              : (user?.role === 'mentor' ? '/admin/tasks' : '/task/tasks');

            newResults.push({
              id: `task-${t.id}`,
              type: 'Task',
              title: t.title,
              desc: t.description || 'No description',
              icon: <TaskIcon sx={{ color: 'var(--primary-500)' }} />,
              url: targetUrl,
            });
          });
        }

        // 3. Process Documents
        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value.data)) {
          const filteredDocs = docsRes.value.data.filter((d) => 
            (d.title && d.title.toLowerCase().includes(query.toLowerCase())) ||
            (d.file && d.file.toLowerCase().includes(query.toLowerCase()))
          );
          filteredDocs.forEach((d) => {
            const targetUrl = user?.role === 'intern' ? '/intern-user/documents' : '/intern/documents';
            newResults.push({
              id: `doc-${d.id}`,
              type: 'Document',
              title: d.title || d.file.split('/').pop(),
              desc: `Status: ${d.status}`,
              icon: <DescriptionIcon sx={{ color: 'var(--warning-500)' }} />,
              url: targetUrl,
            });
          });
        }

        setResults(newResults);
        setOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, user]);

  return (
    <Box
      ref={anchorRef}
      sx={{
        flex: 1,
        width: '100%',
        minWidth: 0,
        maxWidth: {
          xs: '100%',
          sm: 320,
          md: 420,
          lg: 520,
        },
        position: 'relative',
      }}
    >
      <div 
        className="topbar-search" 
        style={{ 
          border: open ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
          transition: 'all 0.2s'
        }}
      >
        <SearchIcon style={{ fontSize: '16px', color: 'var(--text-secondary)' }} />
        <InputBase
          fullWidth
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.length > 1) setOpen(true); }}
          onBlur={() => setTimeout(() => {
            setOpen(false);
            setQuery('');
          }, 200)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('');
              setOpen(false);
              e.target.blur();
            }
          }}
          sx={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', ml: 1 }}
        />
      </div>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ]}
        style={{
          zIndex: 1400,
          width: anchorRef.current
            ? anchorRef.current.clientWidth
            : undefined,
        }}
      >
        <Paper 
          elevation={8} 
          sx={{ 
            mt: 1, 
            borderRadius: 'var(--radius-md)', 
            maxHeight: 300, 
            overflow: 'auto', 
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          {results.length > 0 ? (
            <List disablePadding>
              {results.map((res, idx) => (
                <ListItem 
                  button 
                  key={res.id} 
                  sx={{ 
                    borderBottom: idx !== results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    py: 1.2,
                    px: 2,
                    alignItems: "flex-start",
                    cursor: "pointer",
                    transition: "0.25s",
                    "&:hover": {
                      bgcolor: "var(--bg-hover)",
                      '& .MuiListItemText-primary': {
                        color: 'var(--text-primary)',
                      }
                    }
                  }}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    if (res.url) {
                      navigate(res.url);
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 'var(--radius-sm)', 
                    bgcolor: 'var(--bg-input)', 
                    mr: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {res.icon}
                  </Box>
                  <ListItemText 
                    primary={<Typography variant="body2" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>{res.title}</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{res.desc} • {res.type}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {loading ? 'Searching...' : `No results found for "${query}"`}
              </Typography>
            </Box>
          )}
        </Paper>
      </Popper>
    </Box>
  );
}
