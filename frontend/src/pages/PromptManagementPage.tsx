import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert, TablePagination
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Prompt } from '../services/prompts';
import { fetchPrompts, createPrompt, updatePrompt, deletePrompt } from '../services/prompts';



const PromptManagementPage: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  
  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPrompts(page, rowsPerPage);
      setPrompts(response.content);
      setTotalElements(response.totalElements);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch prompts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [page, rowsPerPage]);
  
  const [name, setName] = useState<string | undefined>('');
  const [content, setContent] = useState<string | undefined>('');
  const [description, setDescription] = useState<string | undefined>('');
  const [inputSchemaJson, setInputSchemaJson] = useState<string | undefined>('');
  const [outputSchemaJson, setOutputSchemaJson] = useState<string | undefined>('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  

  

  const handleOpenDialog = (prompt: Prompt | null = null) => {
    setCurrentPrompt(prompt);
    setName(prompt?.name || '');
    setContent(prompt?.content || '');
    setDescription(prompt?.description || '');
    setInputSchemaJson(prompt?.inputSchemaJson || '');
    setOutputSchemaJson(prompt?.outputSchemaJson || '');
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPrompt(null);
    setName('');
    setContent('');
    setDescription('');
    setInputSchemaJson('');
    setOutputSchemaJson('');
    setDialogError(null);
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      const promptData = {
        name, content, description, inputSchemaJson, outputSchemaJson
      };

      if (currentPrompt) {
        // Update prompt
        await updatePrompt(currentPrompt.id, { id: currentPrompt.id, ...promptData } as Prompt);
      } else {
        // Create prompt
        await createPrompt(promptData as Omit<Prompt, 'id'>);
      }
      loadPrompts();
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Prompt operation error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePrompt(id);
        loadPrompts();
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete prompt.');
        console.error('Delete prompt error:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Prompts...</Typography>
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
        Prompt Management
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />} 
        onClick={() => handleOpenDialog()} 
        sx={{ mb: 2 }}
      >
        Add Prompt
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="prompt table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(prompts ?? []).map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell component="th" scope="row">
                  {prompt.id}
                </TableCell>
                <TableCell>{prompt.name}</TableCell>
                <TableCell>{prompt.description || 'N/A'}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(prompt)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(prompt.id)}>
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
        <DialogTitle>{currentPrompt ? 'Edit Prompt' : 'Add Prompt'}</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
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
          <TextField
            margin="dense"
            id="inputSchemaJson"
            label="Input Schema (JSON)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={inputSchemaJson}
            onChange={(e) => setInputSchemaJson(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="outputSchemaJson"
            label="Output Schema (JSON)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={outputSchemaJson}
            onChange={(e) => setOutputSchemaJson(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentPrompt ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptManagementPage;