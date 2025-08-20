import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert, MenuItem, TablePagination,
  FormControl, InputLabel, Select, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Resource } from '../services/resources';
import { fetchResources, createResource, updateResource, deleteResource } from '../services/resources';
import { fetchGroups, type Group } from '../services/group';



const ResourceManagementPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  
  const [uri, setUri] = useState<string | undefined>('');
  const [content, setContent] = useState<string | undefined>('');
  const [contentType, setContentType] = useState<string | undefined>('text/plain');
  const [description, setDescription] = useState<string | undefined>('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState<number | ''>('');

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchResources(
        page, 
        rowsPerPage, 
        filterGroupId === '' ? undefined : [filterGroupId] // Pass as a list
      );
      setResources(response.content);
      setTotalElements(response.totalElements);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch resources.');
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
    loadResources();
  }, [page, rowsPerPage, filterGroupId]);

  useEffect(() => {
    loadGroups();
  }, []);
  
  const handleOpenDialog = (resource: Resource | null = null) => {
    setCurrentResource(resource);
    setUri(resource?.uri || '');
    setContent(resource?.content || '');
    setContentType(resource?.contentType || 'text/plain');
    setDescription(resource?.description || '');
    setSelectedGroups(resource?.groupIds || []);
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentResource(null);
    setUri('');
    setContent('');
    setContentType('text/plain');
    setDescription('');
    setSelectedGroups([]);
    setDialogError(null);
  };

  const handleGroupChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedGroups(
      typeof value === 'string' ? value.split(',').map(Number) : value,
    );
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      const resourceData = {
        uri, content, contentType, description, groupIds: selectedGroups
      };

      if (currentResource) {
        // Update resource
        await updateResource(currentResource.id, { id: currentResource.id, ...resourceData } as Resource);
      } else {
        // Create resource
        await createResource(resourceData as Omit<Resource, 'id'>);
      }
      loadResources();
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Resource operation error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(id);
        loadResources();
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete resource.');
        console.error('Delete resource error:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Resources...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Resource Management
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()} 
        >
          Add Resource
        </Button>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-group-label">Filter by Group</InputLabel>
          <Select
            labelId="filter-group-label"
            id="filter-group"
            value={filterGroupId}
            label="Filter by Group"
            onChange={(e) => {
              setFilterGroupId(e.target.value as number | '');
              setPage(0); // Reset page when filter changes
            }}
          >
            <MenuItem value=""><em>All Groups</em></MenuItem>
            {availableGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="resource table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>URI</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Groups</TableCell> {/* New column */}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(resources ?? []).map((resource) => (
              <TableRow key={resource.id}>
                <TableCell component="th" scope="row">
                  {resource.id}
                </TableCell>
                <TableCell>{resource.uri}</TableCell>
                <TableCell>{resource.contentType}</TableCell>
                <TableCell>{resource.description || 'N/A'}</TableCell>
                <TableCell>
                  {(resource.groupIds || []).map(id => availableGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ')}
                </TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(resource)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(resource.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{currentResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="uri"
            label="URI"
            type="text"
            fullWidth
            variant="standard"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="contentType"
            label="Content Type"
            select
            fullWidth
            variant="standard"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="text/plain">text/plain</MenuItem>
            <MenuItem value="application/json">application/json</MenuItem>
            <MenuItem value="text/html">text/html</MenuItem>
            <MenuItem value="text/xml">text/xml</MenuItem>
            <MenuItem value="application/xml">application/xml</MenuItem>
            <MenuItem value="image/jpeg">image/jpeg</MenuItem>
            <MenuItem value="image/png">image/png</MenuItem>
            <MenuItem value="application/octet-stream">application/octet-stream</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            id="content"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={10}
            variant="standard"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="select-groups-label">Groups</InputLabel>
            <Select
              labelId="select-groups-label"
              id="select-groups"
              multiple
              value={selectedGroups}
              onChange={handleGroupChange}
              input={<OutlinedInput label="Groups" />}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentResource ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceManagementPage;