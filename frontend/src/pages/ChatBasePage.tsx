import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchGroups, type Group } from '../services/group';
import { createChatBaseInstance, fetchChatBaseInstances, updateChatBaseInstance, deleteChatBaseInstance, updateChatBaseInstanceStatus, queryChatBaseSessions, type ChatBaseInstance, type CreateChatBasePayload, type Session } from '../services/chatbase';

import ChatDialog from '../components/ChatDialog'; // Import ChatDialog
import ChatBaseForm from '../components/ChatBaseForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

const ChatBaseCreatePage: React.FC = () => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  useEffect(() => {
    const getGroups = async () => {
      try {
        const response = await fetchGroups();
        setAvailableGroups(response.content);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    getGroups();
  }, []);

  const handleSubmit = async (payload: CreateChatBasePayload) => {
    try {
      await createChatBaseInstance(payload);
      alert('ChatBase created successfully!');
      // How to reset form? The form state is in the child component.
      // We can either lift the state up, or use a key to re-mount the component.
      // For now, we can just leave it as it is.
    } catch (error) {
      console.error('Error creating ChatBase:', error);
      alert('Failed to create ChatBase.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>Create New ChatBase</Typography>
      <ChatBaseForm
        isEdit={false}
        onSubmit={handleSubmit}
        availableGroups={availableGroups}
      />
    </Box>
  );
};

interface SessionListForChatBaseProps {
  chatBaseId: number;
  chatBaseName: string; // Added
  appId: string; // Added
}

const SessionListForChatBase: React.FC<SessionListForChatBaseProps> = ({ chatBaseId, chatBaseName, appId }) => { // Destructure new props
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [openChatDialogForHistory, setOpenChatDialogForHistory] = useState(false); // Renamed state
  const [selectedSessionForHistory, setSelectedSessionForHistory] = useState<Session | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await queryChatBaseSessions(chatBaseId, page, pageSize);
      setSessions(response.content);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [chatBaseId, page, pageSize]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when page size changes
  };

  const handleViewChatHistory = (session: Session) => {
    setSelectedSessionForHistory(session);
    setOpenChatDialogForHistory(true);
  };

  if (loading) return <Typography>Loading sessions...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {sessions.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No sessions found for this ChatBase.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="sessions table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow
                  key={session.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {session.id}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title || 'N/A'}</TableCell>
                  <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                  <TableCell>{session.userId}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="view chat history" onClick={() => handleViewChatHistory(session)}>
                      <StorageOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={pageSize}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}

      {/* Chat Dialog for History */}
      {selectedSessionForHistory && (
        <ChatDialog
          open={openChatDialogForHistory}
          onClose={() => setOpenChatDialogForHistory(false)}
          chatBaseId={chatBaseId}
          chatBaseName={chatBaseName}
          appId={appId}
          language={navigator.language || "en-US"}
          chatSessionId={selectedSessionForHistory.id} // Pass sessionId
        />
      )}
    </Box>
  );
};

const ChatBaseInstancesPage: React.FC = () => {
  const [instances, setInstances] = useState<ChatBaseInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-indexed
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentInstanceToEdit, setCurrentInstanceToEdit] = useState<ChatBaseInstance | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  // State for Chat Dialog
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedChatBaseForChat, setSelectedChatBaseForChat] = useState<ChatBaseInstance | null>(null);

  // State for Sessions Dialog
  const [openSessionsDialog, setOpenSessionsDialog] = useState(false);
  const [selectedChatBaseForSessions, setSelectedChatBaseForSessions] = useState<ChatBaseInstance | null>(null);

  const loadInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchChatBaseInstances(page, pageSize);
      setInstances(response.content);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error fetching ChatBase instances:', err);
      setError('Failed to load ChatBase instances.');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetchGroups();
      setAvailableGroups(response.content);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    loadInstances();
    loadGroups();
  }, [page, pageSize]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when page size changes
  };

  const handleToggleStatus = async (instance: ChatBaseInstance) => {
    // Convert to uppercase for backend enum matching
    const newStatus = instance.status.toLowerCase() === 'active' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateChatBaseInstanceStatus(instance.id, newStatus as 'active' | 'inactive'); // Cast back to frontend type
      loadInstances(); // Reload data to reflect changes
    } catch (err) {
      console.error(`Error updating status for ${instance.id}:`, err);
      alert('Failed to update instance status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ChatBase instance?')) {
      try {
        await deleteChatBaseInstance(id);
        loadInstances(); // Reload data
      } catch (err) {
        console.error(`Error deleting instance ${id}:`, err);
        alert('Failed to delete ChatBase instance.');
      }
    }
  };

  const handleEditClick = (instance: ChatBaseInstance) => {
    setCurrentInstanceToEdit(instance);
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setCurrentInstanceToEdit(null);
  };

  

  const handleViewSessions = (instance: ChatBaseInstance) => {
    setSelectedChatBaseForSessions(instance);
    setOpenSessionsDialog(true);
  };

  const handleCloseChatDialog = () => {
    setOpenChatDialog(false);
    setSelectedChatBaseForChat(null);
  };

  if (loading) return <Typography>Loading ChatBase instances...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>ChatBase Instances</Typography>
      {instances.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No ChatBase instances found.
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Please create one using the 'Create' tab.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // This assumes the parent component (ChatBasePage) handles tab navigation
              // A more robust solution might involve context or prop drilling for navigation
              const navigateToCreateTab = new CustomEvent('navigateToCreateTab');
              window.dispatchEvent(navigateToCreateTab);
            }}
          >
            Go to Create ChatBase
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="chatbase instances table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Groups</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.map((instance) => (
                <TableRow
                  key={instance.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {instance.id}
                  </TableCell>
                  <TableCell>{instance.name}</TableCell>
                  
                  <TableCell>
                    {instance.groupIds.map(id => availableGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={instance.status.toLowerCase() === 'active'}
                      onChange={() => handleToggleStatus(instance)}
                      color="primary"
                      inputProps={{ 'aria-label': 'toggle instance status' }}
                    />
                    {instance.status.toUpperCase()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="view sessions" onClick={() => handleViewSessions(instance)}>
                      <StorageOutlinedIcon />
                    </IconButton>
                    <IconButton aria-label="edit" onClick={() => handleEditClick(instance)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => handleDelete(instance.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={pageSize}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Edit ChatBase Instance</DialogTitle>
        <DialogContent>
          {currentInstanceToEdit && (
            <ChatBaseForm
              isEdit={true}
              initialData={currentInstanceToEdit}
              onSubmit={(payload) => {
                if (!currentInstanceToEdit) return;
                const newPayload: CreateChatBasePayload = {
                  name: payload.name,
                  rolePrompt: payload.rolePrompt,
                  greeting: payload.greeting,
                  groupIds: payload.groupIds,
                  requireAuth: payload.requireAuth,
                  authUrl: payload.authUrl,
                };
                updateChatBaseInstance(currentInstanceToEdit.id, {
                  ...currentInstanceToEdit,
                  ...newPayload,
                })
                  .then(() => {
                    alert('ChatBase instance updated successfully!');
                    handleEditDialogClose();
                    loadInstances(); // Reload data
                  })
                  .catch((err) => {
                    console.error(`Error updating instance ${currentInstanceToEdit.id}:`, err);
                    alert('Failed to update ChatBase instance.');
                  });
              }}
              availableGroups={availableGroups}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      {selectedChatBaseForChat && (
        <ChatDialog
          open={openChatDialog}
          onClose={handleCloseChatDialog}
          chatBaseId={selectedChatBaseForChat.id}
          chatBaseName={selectedChatBaseForChat.name}
          appId={selectedChatBaseForChat.appId}
          language={navigator.language || "en-US"} // Use browser language or default to en-US
        />
      )}

      {/* Sessions Dialog */}
      <Dialog open={openSessionsDialog} onClose={() => setOpenSessionsDialog(false)} fullWidth maxWidth="lg">
        <DialogTitle>Sessions for {selectedChatBaseForSessions?.name}</DialogTitle>
        <DialogContent>
          {selectedChatBaseForSessions && (
            <SessionListForChatBase chatBaseId={selectedChatBaseForSessions.id} chatBaseName={selectedChatBaseForSessions.name} appId={selectedChatBaseForSessions.appId} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSessionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};




const ChatBasePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = () => {
    switch (location.hash) {
      case '#instances':
        return 1;
      case '#create':
      default:
        return 0;
    }
  };

  const [value, setValue] = useState(getInitialTab());

  // Event listener for navigating to create tab from instances page
  useEffect(() => {
    const handleNavigate = () => {
      setValue(0); // Set tab to 'Create'
      navigate('#create');
    };
    window.addEventListener('navigateToCreateTab', handleNavigate);
    return () => {
      window.removeEventListener('navigateToCreateTab', handleNavigate);
    };
  }, [navigate]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('#create');
        break;
      case 1:
        navigate('#instances');
        break;
      default:
        navigate('#create');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="ChatBase sub-navigation"
        sx={{ borderRight: 1, borderColor: 'divider', minWidth: '150px' }}
      >
        <Tab label="Create" icon={<AddCircleOutlineOutlinedIcon />} {...a11yProps(0)} />
        <Tab label="Instances" icon={<StorageOutlinedIcon />} {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <ChatBaseCreatePage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ChatBaseInstancesPage />
      </TabPanel>
    </Box>
  );
};

export default ChatBasePage;