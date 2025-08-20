import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert, MenuItem, TablePagination
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Resource } from '../services/resources';
import { fetchResources, createResource, updateResource, deleteResource } from '../services/resources';



const ResourceManagementPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  
  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching resources with page:', page, 'rowsPerPage:', rowsPerPage);
      const response = await fetchResources(page, rowsPerPage);
      console.log('Resources fetched response:', response);
      setResources(response.content);
      setTotalElements(response.totalElements);
    } catch (err: unknown) {
      console.error('Error fetching resources:', err);
      setError((err as Error).message || 'Failed to fetch resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for ResourceManagementPage');
    loadResources();
  }, [page, rowsPerPage]);
  
  const [uri, setUri] = useState<string | undefined>('');
  const [content, setContent] = useState<string | undefined>('');
  const [contentType, setContentType] = useState<string | undefined>('text/plain');
  const [description, setDescription] = useState<string | undefined>('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  

  

  const handleOpenDialog = (resource: Resource | null = null) => {
    setCurrentResource(resource);
    setUri(resource?.uri || '');
    setContent(resource?.content || '');
    setContentType(resource?.contentType || 'text/plain');
    setDescription(resource?.description || '');
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
    setDialogError(null);
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      const resourceData = {
        uri, content, contentType, description
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
      <Button 
        variant="contained" 
        startIcon={<AddIcon />} 
        onClick={() => handleOpenDialog()} 
        sx={{ mb: 2 }}
      >
        Add Resource
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="resource table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>URI</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Description</TableCell>
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