import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Button, OutlinedInput, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Import the new icon
import { fetchGroups, type Group } from '../services/group';
import { createChatBaseInstance, fetchChatBaseInstances, updateChatBaseInstance, deleteChatBaseInstance, updateChatBaseInstanceStatus, regenerateAppId, type ChatBaseInstance, type CreateChatBasePayload } from '../services/chatbase';
import { fetchChatHistory, fetchChatHistoryByChatBaseId, type ChatHistory } from '../services/chatHistory';
import ChatDialog from '../components/ChatDialog'; // Import ChatDialog

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
  const [name, setName] = useState('');
  const [rolePrompt, setRolePrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
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

  const handleGroupChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedGroups(
      typeof value === 'string' ? value.split(',').map(Number) : value,
    );
  };

  const handleSubmit = async (_event: React.FormEvent) => {
    _event.preventDefault();
    const payload: CreateChatBasePayload = {
      name,
      rolePrompt,
      greeting,
      groupIds: selectedGroups,
    };
    try {
      await createChatBaseInstance(payload);
      alert('ChatBase created successfully!');
      // Optionally clear form or navigate
      setName('');
      setRolePrompt('');
      setGreeting('');
      setSelectedGroups([]);
    } catch (error) {
      console.error('Error creating ChatBase:', error);
      alert('Failed to create ChatBase.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>Create New ChatBase</Typography>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        variant="outlined"
        fullWidth
        required
      />
      <TextField
        label="Role Prompt"
        multiline
        rows={6}
        value={rolePrompt}
        onChange={(e) => setRolePrompt(e.target.value)}
        variant="outlined"
        fullWidth
        required
      />
      <TextField
        label="Greeting"
        multiline
        rows={3}
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
        variant="outlined"
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel id="select-groups-label">Tool Groups</InputLabel>
        <Select
          labelId="select-groups-label"
          id="select-groups"
          multiple
          value={selectedGroups}
          onChange={handleGroupChange}
          input={<OutlinedInput label="Tool Groups" />}
          renderValue={(selected) => {
            const selectedNames = availableGroups
              .filter(group => selected.includes(group.id))
              .map(group => group.name);
            return selectedNames.join(', ');
          }}
        >
          {availableGroups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
              <ListItemText primary={group.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Create ChatBase
      </Button>
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
  const [editName, setEditName] = useState('');
  const [editRolePrompt, setEditRolePrompt] = useState('');
  const [editGreeting, setEditGreeting] = useState('');
  const [editAppId, setEditAppId] = useState('');
  const [isGeneratingAppId, setIsGeneratingAppId] = useState(false);
  const [editSelectedGroups, setEditSelectedGroups] = useState<number[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  // State for Chat Dialog
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedChatBaseForChat, setSelectedChatBaseForChat] = useState<ChatBaseInstance | null>(null);

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
    setEditName(instance.name);
    setEditRolePrompt(instance.rolePrompt);
    setEditGreeting(instance.greeting);
    setEditAppId(instance.appId);
    setEditSelectedGroups(instance.groupIds);
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setCurrentInstanceToEdit(null);
  };

  const handleEditSubmit = async (_event: React.FormEvent) => {
    _event.preventDefault();
    if (!currentInstanceToEdit) return;

    const payload = {
      ...currentInstanceToEdit,
      name: editName,
      rolePrompt: editRolePrompt,
      greeting: editGreeting,
      groupIds: editSelectedGroups,
    };

    try {
      await updateChatBaseInstance(currentInstanceToEdit.id, payload);
      alert('ChatBase instance updated successfully!');
      handleEditDialogClose();
      loadInstances(); // Reload data
    } catch (err) {
      console.error(`Error updating instance ${currentInstanceToEdit.id}:`, err);
      alert('Failed to update ChatBase instance.');
    }
  };

  const handleEditGroupChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setEditSelectedGroups(
      typeof value === 'string' ? value.split(',').map(Number) : value,
    );
  };

  const handleRegenerateAppId = async (id: number) => {
    setIsGeneratingAppId(true);
    try {
      const updatedInstance = await regenerateAppId(id);
      setEditAppId(updatedInstance.appId);
      // Also update the instance in the main list to reflect the change
      setInstances(instances.map(inst => inst.id === id ? { ...inst, appId: updatedInstance.appId } : inst));
      loadInstances(); // Reload data
    } catch (error) {
      console.error('Error regenerating App ID:', error);
    } finally {
      setIsGeneratingAppId(false);
    }
  };

  const handleRunChatBase = (instance: ChatBaseInstance) => {
    setSelectedChatBaseForChat(instance);
    setOpenChatDialog(true);
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
                <TableCell>Role Prompt</TableCell>
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
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{instance.rolePrompt}</TableCell>
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
                    <IconButton
                      aria-label="run"
                      onClick={() => handleRunChatBase(instance)}
                      disabled={instance.status.toLowerCase() !== 'active'} // Enabled only if status is active
                    >
                      <PlayArrowIcon />
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
          <Box component="form" onSubmit={handleEditSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              variant="outlined"
              fullWidth
              required
            />
            <TextField
              label="Role Prompt"
              multiline
              rows={6}
              value={editRolePrompt}
              onChange={(e) => setEditRolePrompt(e.target.value)}
              variant="outlined"
              fullWidth
              required
            />
            <TextField
              label="Greeting"
              multiline
              rows={3}
              value={editGreeting}
              onChange={(e) => setEditGreeting(e.target.value)}
              variant="outlined"
              fullWidth
            />
            <TextField
              label="App ID"
              value={editAppId}
              variant="outlined"
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
                        <Button onClick={() => handleRegenerateAppId(currentInstanceToEdit!.id)} disabled={isGeneratingAppId}>
              {isGeneratingAppId ? 'Generating...' : 'Regenerate App ID'}
            </Button>
            <FormControl fullWidth>
              <InputLabel id="edit-select-groups-label">Tool Groups</InputLabel>
              <Select
                labelId="edit-select-groups-label"
                id="edit-select-groups"
                multiple
                value={editSelectedGroups}
                onChange={handleEditGroupChange}
                input={<OutlinedInput label="Tool Groups" />}
                renderValue={(selected) => {
                  const selectedNames = availableGroups
                    .filter(group => selected.includes(group.id))
                    .map(group => group.name);
                  return selectedNames.join(', ');
                }}
              >
                {availableGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Checkbox checked={editSelectedGroups.indexOf(group.id) > -1} />
                    <ListItemText primary={group.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">Save Changes</Button>
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
    </Box>
  );
};

const ChatBaseHistoryPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedChatBaseId, setSelectedChatBaseId] = useState<number | ''>('');
  const [availableChatBases, setAvailableChatBases] = useState<ChatBaseInstance[]>([]);

  const loadChatHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (selectedChatBaseId) {
        response = await fetchChatHistoryByChatBaseId(selectedChatBaseId as number, page, pageSize);
      } else {
        response = await fetchChatHistory(page, pageSize);
      }
      setChatHistory(response.content);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load chat history.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatBases = async () => {
    try {
      const response = await fetchChatBaseInstances(0, 100); // Fetch all for dropdown
      setAvailableChatBases(response.content);
    } catch (error) {
      console.error('Error fetching chat bases for history filter:', error);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [page, pageSize, selectedChatBaseId]);

  useEffect(() => {
    loadChatBases();
  }, []);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when page size changes
  };

  const handleChatBaseFilterChange = (event: any) => {
    setSelectedChatBaseId(event.target.value as number | '');
    setPage(0); // Reset to first page when filter changes
  };

  if (loading) return <Typography>Loading chat history...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>ChatBase History</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="chatbase-filter-label">Filter by ChatBase</InputLabel>
        <Select
          labelId="chatbase-filter-label"
          id="chatbase-filter"
          value={selectedChatBaseId}
          label="Filter by ChatBase"
          onChange={handleChatBaseFilterChange}
        >
          <MenuItem value=""><em>All ChatBases</em></MenuItem>
          {availableChatBases.map((chatBase) => (
            <MenuItem key={chatBase.id} value={chatBase.id}>
              {chatBase.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {chatHistory.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No chat history found.
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            There is no chat history for the selected ChatBase or overall.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="chat history table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>ChatBase Name</TableCell>
                <TableCell>User Message</TableCell>
                <TableCell>AI Response</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chatHistory.map((record) => (
                <TableRow
                  key={record.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {record.id}
                  </TableCell>
                  <TableCell>
                    {availableChatBases.find(cb => cb.id === record.chatBaseId)?.name || `ID: ${record.chatBaseId}`}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.userMessage}</TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.aiResponse}</TableCell>
                  <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
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
      case '#history':
        return 2;
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
      case 2:
        navigate('#history');
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
        <Tab label="History" icon={<HistoryOutlinedIcon />} {...a11yProps(2)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <ChatBaseCreatePage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ChatBaseInstancesPage />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ChatBaseHistoryPage />
      </TabPanel>
    </Box>
  );
};

export default ChatBasePage;